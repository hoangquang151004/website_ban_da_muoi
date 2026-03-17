"""Latency + cost AB test between embedding providers.

This script calls benchmark_retrieval_metrics for each provider, then produces
comparison outputs with p50/p95 latency and estimated embedding cost.

Usage (from backend/):
python scripts/benchmark_latency_cost_abtest.py --providers baseline gemini --rebuild-index
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
from pathlib import Path
from typing import Any

# Ensure backend/ import path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv

from scripts.benchmark_retrieval_metrics import (
    _default_dataset_path,
    _default_persist_dir,
    run_metrics_for_provider,
)


def _default_results_dir() -> Path:
    repo_root = Path(__file__).resolve().parents[2]
    return (
        repo_root
        / "tasks"
        / "ai_data_management"
        / "023-p6-latency-cost-abtest"
        / "results"
    )


def _metrics_output_dir() -> Path:
    repo_root = Path(__file__).resolve().parents[2]
    return (
        repo_root
        / "tasks"
        / "ai_data_management"
        / "022-p6-metrics-scripts"
        / "results"
    )


def _cost_rate_per_1k_chars(provider: str) -> float:
    # Assumptions (USD / 1k chars embedded)
    # baseline default = 0 (local HF/OpenAI key not accounted in this heuristic)
    # gemini default heuristic can be overridden by env.
    provider = provider.lower()
    if provider == "gemini":
        return float(os.getenv("GEMINI_EMBEDDING_USD_PER_1K_CHARS", "0.00012"))
    return float(os.getenv("BASELINE_EMBEDDING_USD_PER_1K_CHARS", "0"))


def _estimate_cost_usd(result: dict[str, Any], provider: str) -> float:
    dataset = result.get("dataset", {})
    total_chars = int(dataset.get("corpus_characters", 0)) + int(dataset.get("query_characters", 0))
    rate = _cost_rate_per_1k_chars(provider)
    return (float(total_chars) / 1000.0) * rate


def _recommendation(success_rows: list[dict[str, Any]]) -> tuple[str, list[str]]:
    if not success_rows:
        return (
            "fallback_baseline",
            [
                "Khong co provider nao benchmark thanh cong. Tam thoi giu baseline va dieu tra moi truong embedding.",
            ],
        )

    rows_by_provider = {row["provider"]: row for row in success_rows}
    baseline = rows_by_provider.get("baseline")
    gemini = rows_by_provider.get("gemini")

    if gemini is None and baseline is not None:
        return (
            "hybrid_baseline_default",
            [
                "Gemini khong benchmark duoc trong moi truong hien tai, nen giu baseline lam mac dinh.",
                "Duy tri kha nang chuyen provider qua config de mo lai AB test khi co API key/han muc.",
            ],
        )

    if baseline is None and gemini is not None:
        return (
            "full_gemini",
            [
                "Chi co Gemini benchmark thanh cong. Co the rollout full Gemini neu quan ly duoc chi phi.",
            ],
        )

    assert baseline is not None and gemini is not None

    recall_baseline = baseline["metrics"]["recall"]
    recall_gemini = gemini["metrics"]["recall"]
    mrr_baseline = baseline["metrics"]["mrr"]
    mrr_gemini = gemini["metrics"]["mrr"]

    p95_baseline = baseline["latency"]["p95_ms"]
    p95_gemini = gemini["latency"]["p95_ms"]

    cost_baseline = baseline["cost"]["estimated_usd"]
    cost_gemini = gemini["cost"]["estimated_usd"]

    notes: list[str] = []

    quality_up = (recall_gemini - recall_baseline) >= 0.03 or (mrr_gemini - mrr_baseline) >= 0.03
    latency_ok = p95_gemini <= (p95_baseline * 1.8 if p95_baseline > 0 else p95_gemini + 1)
    cost_ok = cost_baseline == 0 or cost_gemini <= (cost_baseline * 5)

    if quality_up and latency_ok and cost_ok:
        notes.append("Gemini cho cai thien quality du lon va latency/cost nam trong nguong chap nhan.")
        return "full_gemini", notes

    notes.append("Khong dat dong thoi quality-latency-cost de rollout full Gemini.")
    notes.append("Khuyen nghi hybrid: baseline mac dinh, Gemini cho policy/query can do chinh xac cao.")
    return "hybrid_baseline_default", notes


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run latency/cost AB test for embedding providers")
    parser.add_argument("--providers", nargs="+", default=["baseline", "gemini"])
    parser.add_argument("--dataset", type=Path, default=_default_dataset_path())
    parser.add_argument("--persist-dir", type=Path, default=_default_persist_dir())
    parser.add_argument("--collection-prefix", type=str, default="salt_lamp_benchmark")
    parser.add_argument("--rebuild-index", action="store_true")
    parser.add_argument("--recall-k", type=int, default=5)
    parser.add_argument("--mrr-k", type=int, default=10)
    parser.add_argument("--results-dir", type=Path, default=_default_results_dir())
    return parser.parse_args()


def main() -> int:
    load_dotenv(Path(__file__).resolve().parents[1] / ".env")
    args = parse_args()

    args.results_dir.mkdir(parents=True, exist_ok=True)
    metrics_output_dir = _metrics_output_dir()
    metrics_output_dir.mkdir(parents=True, exist_ok=True)

    provider_rows: list[dict[str, Any]] = []

    for provider_raw in args.providers:
        provider = provider_raw.strip().lower()
        started = time.time()

        try:
            result = run_metrics_for_provider(
                provider=provider,
                dataset_path=args.dataset,
                persist_dir=args.persist_dir,
                collection_prefix=args.collection_prefix,
                recall_k=args.recall_k,
                mrr_k=args.mrr_k,
                rebuild_index=args.rebuild_index,
                output_dir=metrics_output_dir,
            )
            metrics = result["metrics"]
            latency = result["latency"]
            recall_value = float(metrics[f"recall_at_{args.recall_k}"])
            mrr_value = float(metrics[f"mrr_at_{args.mrr_k}"])
            estimated_cost = _estimate_cost_usd(result, provider)

            provider_rows.append(
                {
                    "provider": provider,
                    "status": "success",
                    "metrics": {
                        "recall": recall_value,
                        "mrr": mrr_value,
                    },
                    "latency": latency,
                    "cost": {
                        "rate_usd_per_1k_chars": _cost_rate_per_1k_chars(provider),
                        "estimated_usd": round(estimated_cost, 6),
                    },
                    "runtime_seconds": round(time.time() - started, 3),
                    "error": None,
                }
            )
        except Exception as exc:
            provider_rows.append(
                {
                    "provider": provider,
                    "status": "failed",
                    "metrics": None,
                    "latency": None,
                    "cost": {
                        "rate_usd_per_1k_chars": _cost_rate_per_1k_chars(provider),
                        "estimated_usd": None,
                    },
                    "runtime_seconds": round(time.time() - started, 3),
                    "error": str(exc),
                }
            )

    success_rows = [row for row in provider_rows if row["status"] == "success"]
    recommendation, notes = _recommendation(success_rows)

    report = {
        "dataset": str(args.dataset),
        "recall_k": args.recall_k,
        "mrr_k": args.mrr_k,
        "providers": provider_rows,
        "recommendation": recommendation,
        "notes": notes,
        "generated_at_epoch": int(time.time()),
    }

    json_path = args.results_dir / "abtest_summary.json"
    md_path = args.results_dir / "abtest_summary.md"

    json_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")

    lines = [
        "# Embedding AB Test Summary",
        "",
        f"- dataset: {args.dataset}",
        f"- recall@{args.recall_k}, mrr@{args.mrr_k}",
        f"- recommendation: {recommendation}",
        "",
        "## Provider Comparison",
        "",
        "| provider | status | recall | mrr | p50_ms | p95_ms | est_cost_usd | error |",
        "|---|---|---:|---:|---:|---:|---:|---|",
    ]

    for row in provider_rows:
        if row["status"] == "success":
            latency = row["latency"]
            lines.append(
                "| {provider} | {status} | {recall} | {mrr} | {p50} | {p95} | {cost} |  |".format(
                    provider=row["provider"],
                    status=row["status"],
                    recall=row["metrics"]["recall"],
                    mrr=row["metrics"]["mrr"],
                    p50=latency["p50_ms"],
                    p95=latency["p95_ms"],
                    cost=row["cost"]["estimated_usd"],
                )
            )
        else:
            lines.append(
                "| {provider} | failed | - | - | - | - | - | {error} |".format(
                    provider=row["provider"],
                    error=(row.get("error") or "").replace("|", "/"),
                )
            )

    lines.append("")
    lines.append("## Recommendation Notes")
    lines.append("")
    for note in notes:
        lines.append(f"- {note}")

    lines.append("")
    lines.append("## Cost Assumptions")
    lines.append("")
    lines.append("- baseline rate: env BASELINE_EMBEDDING_USD_PER_1K_CHARS (default 0)")
    lines.append("- gemini rate: env GEMINI_EMBEDDING_USD_PER_1K_CHARS (default 0.00012)")

    md_path.write_text("\n".join(lines) + "\n", encoding="utf-8")

    print(f"[OK] AB summary written: {json_path}")
    print(f"[OK] AB summary written: {md_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
