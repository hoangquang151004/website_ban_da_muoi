"""Smoke test: Gemini embedding -> upsert Chroma -> retrieval check.

Run from backend/:
python scripts/smoke_gemini_upsert_chroma.py
"""

from __future__ import annotations

import os
import sys
from datetime import datetime, timezone
from pathlib import Path

# Ensure backend is importable
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Force provider for this smoke run before importing app settings.
os.environ["EMBEDDING_PROVIDER"] = "gemini"

from dotenv import load_dotenv
from langchain_core.documents import Document

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"))

from app.services.ai_agent.embeddings import get_embedding_provider
from app.services.ai_agent.vector_store import _resolve_persist_dir

try:
    from langchain_chroma import Chroma
except ImportError:  # pragma: no cover
    from langchain_community.vectorstores import Chroma


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _write_report(report: str) -> Path:
    repo_root = Path(__file__).resolve().parents[2]
    report_path = repo_root / "tasks" / "ai_data_management" / "008-p2-smoke-upsert-chroma" / "smoke_result.md"
    report_path.write_text(report, encoding="utf-8")
    return report_path


def main() -> None:
    started_at = _now_iso()

    persist_dir = _resolve_persist_dir()
    embeddings = get_embedding_provider("gemini")
    collection_name = "salt_lamp_knowledge_smoke_gemini"

    vs = Chroma(
        collection_name=collection_name,
        embedding_function=embeddings,
        persist_directory=persist_dir,
    )

    docs = [
        Document(
            page_content=(
                "Smoke Gemini: Chinh sach van chuyen don duoi 1.000.000d tinh phi theo khu vuc, "
                "thoi gian giao hang tu 2 den 5 ngay lam viec."
            ),
            metadata={
                "doc_id": "smoke_gemini_shipping_001",
                "category": "policy",
                "title": "Smoke Chinh sach van chuyen",
                "source": "smoke_test",
            },
        ),
        Document(
            page_content=(
                "Smoke Gemini: Chinh sach doi tra trong 7 ngay neu san pham loi do nha san xuat "
                "hoac hu hong khi van chuyen."
            ),
            metadata={
                "doc_id": "smoke_gemini_return_001",
                "category": "policy",
                "title": "Smoke Chinh sach doi tra",
                "source": "smoke_test",
            },
        ),
    ]

    query = "Phi van chuyen duoc tinh nhu the nao?"
    filter_clause = {"source": "smoke_test"}

    ids = [doc.metadata["doc_id"] for doc in docs]
    try:
        vs.delete(ids=ids)
    except Exception:
        pass
    vs.add_documents(docs, ids=ids)
    results = vs.similarity_search(query=query, k=3, filter=filter_clause)

    top_title = results[0].metadata.get("title", "") if results else ""
    top_preview = results[0].page_content[:180] if results else ""

    retrieval_ok = bool(results) and ("van chuyen" in top_preview.lower())

    if not retrieval_ok:
        raise RuntimeError(
            "Smoke retrieval failed: top result is not relevant to shipping query."
        )

    finished_at = _now_iso()

    report = (
        "# Smoke Test Result - Gemini Upsert Chroma\n\n"
        f"- started_at: {started_at}\n"
        f"- finished_at: {finished_at}\n"
        "- embedding_provider: gemini\n"
        f"- collection_name: {collection_name}\n"
        f"- persist_dir: {persist_dir}\n"
        f"- documents_upserted: {len(docs)}\n"
        f"- query: {query}\n"
        f"- filter: {filter_clause}\n"
        f"- results_count: {len(results)}\n"
        f"- top_title: {top_title}\n"
        f"- top_preview: {top_preview}\n"
        f"- retrieval_ok: {retrieval_ok}\n"
        "- status: PASS\n"
    )

    report_path = _write_report(report)

    print("Smoke test completed successfully.")
    print(f"Report written to: {report_path}")


if __name__ == "__main__":
    main()
