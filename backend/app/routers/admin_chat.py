"""
admin_chat.py — Router cho Admin chat endpoints (Text-to-SQL).

Endpoint:
- POST /api/v1/admin/chat/report — Text-to-SQL báo cáo kinh doanh (admin only)
"""

from __future__ import annotations

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.core.dependencies import require_admin
from app.schemas.base import BaseResponse

router = APIRouter()


# ---------------------------------------------------------------------------
# Request schema
# ---------------------------------------------------------------------------
class AdminReportRequest(BaseModel):
    message: str


# ---------------------------------------------------------------------------
# POST /api/v1/admin/chat/report — Text-to-SQL
# ---------------------------------------------------------------------------
@router.post(
    "/chat/report",
    response_model=BaseResponse,
    summary="Báo cáo kinh doanh bằng ngôn ngữ tự nhiên (Admin)",
)
async def admin_chat_report(
    req: AdminReportRequest,
    _admin=Depends(require_admin),
):
    """Nhận câu hỏi ngôn ngữ tự nhiên từ Admin, sinh SQL, thực thi và trả kết quả.

    Ví dụ: "Top 5 sản phẩm bán chạy tháng này?"
    """
    from app.services.ai_agent.chains.admin_report import run_admin_report

    result = await run_admin_report(req.message)
    return BaseResponse.success(data=result)
