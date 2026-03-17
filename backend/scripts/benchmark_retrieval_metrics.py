"""Benchmark retrieval metrics script.

Compute:
- Recall@K (default K=5)
- MRR@K (default K=10)

Script behavior:
1. Load benchmark dataset (documents + queries + ground truth doc_ids)
2. Build provider-specific Chroma collection
3. Retrieve top-K docs for each query
4. Save results to JSON + Markdown

Usage (from backend/):
python scripts/benchmark_retrieval_metrics.py --provider baseline --rebuild-index
python scripts/benchmark_retrieval_metrics.py --provider gemini --rebuild-index
"""

from __future__ import annotations

import argparse
import json
import math
import os
import sys
import time
from pathlib import Path
from typing import Any

# Ensure backend/ import path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
from langchain_core.documents import Document

from app.services.ai_agent.embeddings.factory import get_embedding_provider

try:
    from langchain_chroma import Chroma
except ImportError:  # pragma: no cover
    from langchain_community.vectorstores import Chroma


def _percentile(values: list[float], p: float) -> float:
    if not values:
        return 0.0
    if len(values) == 1:
        return values[0]
    sorted_values = sorted(values)
    rank = (len(sorted_values) - 1) * (p / 100.0)
    lower = math.floor(rank)
    upper = math.ceil(rank)
    if lower == upper:
        return sorted_values[int(rank)]
    weight = rank - lower
    return sorted_values[lower] * (1.0 - weight) + sorted_values[upper] * weight


def _load_dataset(dataset_path: Path) -> dict[str, Any]:
    payload = json.loads(dataset_path.read_text(encoding="utf-8"))
    documents = payload.get("documents") or []
    queries = payload.get("queries") or []

    if not documents:
        raise ValueError("Dataset khong co documents")
    if not queries:
        raise ValueError("Dataset khong co queries")

    return payload


def _build_documents(dataset_documents: list[dict[str, Any]]) -> tuple[list[Document], list[str]]:
    docs: list[Document] = []
    ids: list[str] = []

    for row in dataset_documents:
        doc_id = str(row["doc_id"])
        metadata = {
            "doc_id": doc_id,
            "category": row.get("category"),
            "title": row.get("title"),
            "benchmark": True,
        }
        docs.append(Document(page_content=str(row["content"]), metadata=metadata))
        ids.append(doc_id)

    return docs, ids


def _ensure_collection(
    *,
    provider: str,
    collection_name: str,
    persist_dir: Path,
    dataset_documents: list[dict[str, Any]],
    rebuild_index: bool,
) -> Chroma:
    embedding_provider = get_embedding_provider(provider)
    persist_dir.mkdir(parents=True, exist_ok=True)

    vs = Chroma(
        collection_name=collection_name,
        embedding_function=embedding_provider,
        persist_directory=str(persist_dir),
    )

    docs, ids = _build_documents(dataset_documents)

    if rebuild_index:
        try:
            vs.delete(ids=ids)
        except Exception:
            pass
        vs.add_documents(docs, ids=ids)

    return vs


def run_metrics_for_provider(
    *,
    provider: str,
    dataset_path: Path,
    persist_dir: Path,
    collection_prefix: str,
    recall_k: int,
    mrr_k: int,
    rebuild_index: bool,
    output_dir: Path,
) -> dict[str, Any]:
    started = time.time()
    dataset = _load_dataset(dataset_path)

    collection_name = f"{collection_prefix}_{provider}"
    k_max = max(recall_k, mrr_k)

    vs = _ensure_collection(
        provider=provider,
        collection_name=collection_name,
        persist_dir=persist_dir,
        dataset_documents=dataset["documents"],
        rebuild_index=rebuild_index,
    )

    query_results: list[dict[str, Any]] = []
    recall_hits = 0
    mrr_sum = 0.0
    latencies_ms: list[float] = []

    for query_item in dataset["queries"]:
        query_id = str(query_item["query_id"])
        query_text = str(query_item["query"])
        gt_ids = [str(x) for x in query_item.get("ground_truth_doc_ids", [])]

        t0 = time.perf_counter()
        docs = vs.similarity_search(query=query_text, k=k_max)
        latency_ms = (time.perf_counter() - t0) * 1000.0
        latencies_ms.append(latency_ms)

        retrieved_ids = [
            str(doc.metadata.get("doc_id"))
            for doc in docs
            if doc.metadata.get("doc_id")
        ]

        top_recall_ids = retrieved_ids[:recall_k]
        recall_hit = any(doc_id in top_recall_ids for doc_id in gt_ids)
        if recall_hit:
            recall_hits += 1

        reciprocal_rank = 0.0
        for rank, doc_id in enumerate(retrieved_ids[:mrr_k], start=1):
            if doc_id in gt_ids:
                reciprocal_rank = 1.0 / float(rank)
                break
        mrr_sum += reciprocal_rank

        query_results.append(
            {
                "query_id": query_id,
                "query": query_text,
                "ground_truth_doc_ids": gt_ids,
                "retrieved_doc_ids_top_k": retrieved_ids,
                f"recall_hit_at_{recall_k}": recall_hit,
                f"reciprocal_rank_at_{mrr_k}": reciprocal_rank,
                "latency_ms": round(latency_ms, 3),
            }
        )

    total_queries = len(dataset["queries"])
    recall_at_k = (recall_hits / total_queries) if total_queries else 0.0
    mrr_at_k = (mrr_sum / total_queries) if total_queries else 0.0

    corpus_chars = sum(len(str(doc.get("content", ""))) for doc in dataset["documents"])
    queries_chars = sum(len(str(item.get("query", ""))) for item in dataset["queries"])

    result = {
        "provider": provider,
        "dataset": {
            "path": str(dataset_path),
            "version": dataset.get("version"),
            "documents": len(dataset["documents"]),
            "queries": total_queries,
            "corpus_characters": corpus_chars,
            "query_characters": queries_chars,
        },
        "collection": {
            "name": collection_name,
            "persist_dir": str(persist_dir),
            "rebuild_index": rebuild_index,
        },
        "metrics": {
            f"recall_at_{recall_k}": round(recall_at_k, 6),
            f"mrr_at_{mrr_k}": round(mrr_at_k, 6),
        },
        "latency": {
            "avg_ms": round(sum(latencies_ms) / len(latencies_ms), 3) if latencies_ms else 0.0,
            "p50_ms": round(_percentile(latencies_ms, 50), 3),
            "p95_ms": round(_percentile(latencies_ms, 95), 3),
            "max_ms": round(max(latencies_ms), 3) if latencies_ms else 0.0,
        },
        "query_results": query_results,
        "generated_at_epoch": int(time.time()),
        "runtime_seconds": round(time.time() - started, 3),
    }

    output_dir.mkdir(parents=True, exist_ok=True)
    json_path = output_dir / f"metrics_{provider}.json"
    md_path = output_dir / f"metrics_{provider}.md"

    json_path.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")

    md_lines = [
        f"# Retrieval Metrics - {provider}",
        "",
        f"- dataset_version: {dataset.get('version')}",
        f"- documents: {len(dataset['documents'])}",
        f"- queries: {total_queries}",
        f"- collection: {collection_name}",
        f"- recall@{recall_k}: {result['metrics'][f'recall_at_{recall_k}']}",
        f"- mrr@{mrr_k}: {result['metrics'][f'mrr_at_{mrr_k}']}",
        f"- latency_avg_ms: {result['latency']['avg_ms']}",
        f"- latency_p50_ms: {result['latency']['p50_ms']}",
        f"- latency_p95_ms: {result['latency']['p95_ms']}",
        "",
        "## Query Details",
        "",
        f"| query_id | recall@{recall_k} | rr@{mrr_k} | latency_ms |",
        "|---|---:|---:|---:|",
    ]

    for row in query_results:
        md_lines.append(
            f"| {row['query_id']} | {str(row[f'recall_hit_at_{recall_k}']).lower()} | {row[f'reciprocal_rank_at_{mrr_k}']} | {row['latency_ms']} |"
        )

    md_path.write_text("\n".join(md_lines) + "\n", encoding="utf-8")

    return result


def _default_dataset_path() -> Path:
    repo_root = Path(__file__).resolve().parents[2]
    return (
        repo_root
        / "tasks"
        / "ai_data_management"
        / "021-p6-benchmark-dataset"
        / "dataset"
        / "benchmark_dataset_v1.json"
    )


def _default_output_dir() -> Path:
    repo_root = Path(__file__).resolve().parents[2]
    return (
        repo_root
        / "tasks"
        / "ai_data_management"
        / "022-p6-metrics-scripts"
        / "results"
    )


def _default_persist_dir() -> Path:
    backend_root = Path(__file__).resolve().parents[1]
    return backend_root / "chroma_db"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Compute retrieval metrics for one embedding provider")
    parser.add_argument("--provider", type=str, required=True, help="baseline | gemini")
    parser.add_argument("--dataset", type=Path, default=_default_dataset_path())
    parser.add_argument("--persist-dir", type=Path, default=_default_persist_dir())
    parser.add_argument("--collection-prefix", type=str, default="salt_lamp_benchmark")
    parser.add_argument("--recall-k", type=int, default=5)
    parser.add_argument("--mrr-k", type=int, default=10)
    parser.add_argument("--rebuild-index", action="store_true")
    parser.add_argument("--output-dir", type=Path, default=_default_output_dir())
    return parser.parse_args()


def main() -> int:
    load_dotenv(Path(__file__).resolve().parents[1] / ".env")
    args = parse_args()

    try:
        result = run_metrics_for_provider(
            provider=args.provider.strip().lower(),
            dataset_path=args.dataset,
            persist_dir=args.persist_dir,
            collection_prefix=args.collection_prefix,
            recall_k=args.recall_k,
            mrr_k=args.mrr_k,
            rebuild_index=args.rebuild_index,
            output_dir=args.output_dir,
        )
    except Exception as exc:
        print(f"[ERROR] Benchmark failed for provider={args.provider}: {exc}")
        return 1

    metrics = result["metrics"]
    latency = result["latency"]
    print(
        "[OK] provider={provider} recall={recall} mrr={mrr} p50={p50}ms p95={p95}ms".format(
            provider=result["provider"],
            recall=next(v for k, v in metrics.items() if k.startswith("recall_at_")),
            mrr=next(v for k, v in metrics.items() if k.startswith("mrr_at_")),
            p50=latency["p50_ms"],
            p95=latency["p95_ms"],
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
