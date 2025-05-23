from typing import AsyncGenerator, List, Tuple
import os

from sqlalchemy.orm import Session
from fastapi import APIRouter, Body, Depends
from fastapi.responses import StreamingResponse
import openai

from backend.db.models import CustomerModel
from backend.db.database import get_db
from backend.routers.basecurd import BaseCRUD
from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')

class ChatRouter(BaseCRUD):
    def __init__(self):
        self.router = APIRouter()
        self.register_routes()

        # ⚠️ Avoid hard‑coding production keys. Pass them via env‑vars / secrets.
        self.client = openai.AsyncClient(api_key=OPENAI_API_KEY)

    # ---------------------------------------------------------------------
    # public routes
    # ---------------------------------------------------------------------
    def register_routes(self) -> None:
        self.router.add_api_route(
            "/", self.predict_stream, methods=["POST"], include_in_schema=False
        )

    @staticmethod
    def _build_customers_markdown(db: Session) -> str:
        # id 늦은게 먼저 나오게, status는 0만
        customers = db.query(CustomerModel).filter(CustomerModel.status == 0).order_by(CustomerModel.id.desc()).all()
        # customers = db.query(CustomerModel).order_by(CustomerModel.id.desc()).all()

        status_map: dict[int, str] = {
            0: "진행",
            4: "대기",
            2: "보류",
            1: "완료",
            3: "폐기",
        }

        if not customers:
            return "_(등록된 고객이 없습니다)_"

        lines: List[str] = ["## 💼 고객정보\n"]
        for cust in customers:
            status_label = status_map.get(cust.status, str(cust.status))
            lines.append(f"### {cust.id}. {cust.company_name or 'Unnamed'}")
            lines += [
                f"- **중요도**: {cust.importance or '-'}",
                f"- **컨택일**: {cust.contact_date or '-'}",
                f"- **입주시기**: {cust.move_in_date or '-'}",
                f"- **업종**: {cust.industry or '-'}",
                f"- **연락처**: {cust.contact_info or '-'}",
                f"- **비고**: {cust.notes or '-'}",
                f"- **컨택 담당자**: {cust.contact_person or '-'}",
                f"- **정(Head)**: {cust.head or '-'}",
                f"- **부(Deputy)**: {cust.deputy or '-'}",
                f"- **상태**: {status_label}",
                f"- **수정일**: {cust.edit_date or '-'}",
                f"- **생성일**: {cust.create_date or '-'}",
                f"- **마케팅**: {cust.marketing or '-'}",
                f"- **성별**: {cust.gender or '-'}",
                f"- **금액**: {cust.price or '-'}",
                f"- **면적**: {cust.area or '-'}",
                f"- **위치**: {cust.location or '-'}",
                f"- **특이사항**: {cust.special_notes or '-'}",
                "",
            ]

        return "\n".join(lines)

    # ------------------------------------------------------------------
    # chat logic
    # ------------------------------------------------------------------
    async def predict(
        self,
        message: str,
        chat_history: List[Tuple[str, str]],
        db: Session,
    ) -> AsyncGenerator[str, None]:
        """Wrapper that builds the system prompt and yields the streamed answer."""

        customer_md = self._build_customers_markdown(db)
        print(customer_md)
        async for chunk in self._run_chat(message, chat_history, customer_md):
            yield chunk

    async def _run_chat(
        self,
        message: str,
        chat_history: List[Tuple[str, str]],
        customer_md: str,
    ) -> AsyncGenerator[str, None]:
        """Core routine that performs the OpenAI streaming call."""

        # 1) Compose messages --------------------------------------------------
        messages: List[dict] = [
            {
                "role": "system",
                "content": (
                    "다음은 하이브메이트 데이터베이스에서 추출한 전체 고객 목록입니다. "
                    "마크다운 구조를 유지해 자유롭게 참조하되 *출력에 그대로 복사하지 말고* "
                    "사용자의 질문에 필요한 부분만 요약·인용해 답변하세요.\n\n" + customer_md
                ),
            }
        ]

        # maintain the last 5 turns (human/assistant pairs)
        for human, assistant in chat_history:
            messages.append({"role": "user", "content": human})
            messages.append({"role": "assistant", "content": assistant})

        messages.append({"role": "user", "content": message})

        # 2) Call OpenAI -------------------------------------------------------
        response = await self.client.chat.completions.create(
            model="gpt-4.1",
            messages=messages,
            stream=True
        )

        # 3) Stream tokens back to client -------------------------------------
        async for chunk in response:
            if chunk.choices:
                delta = chunk.choices[0].delta.content
                if delta:
                    yield delta

    # ------------------------------------------------------------------
    # FastAPI endpoint
    # ------------------------------------------------------------------
    async def predict_stream(
        self,
        message: str = Body(..., description="최종 사용자 메시지"),
        chat_history: List[Tuple[str, str]] = Body(default=[], description="이전 대화 내역"),
        db: Session = Depends(get_db),
    ):  # noqa: D401 – FastAPI expects snake_case
        """POST /predict – returns a text/event‑stream with the model's answer."""

        generator = self.predict(message=message, chat_history=chat_history, db=db)
        return StreamingResponse(generator, media_type="text/event-stream")
