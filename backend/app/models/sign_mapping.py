import uuid

from sqlalchemy import Integer, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class SignMapping(Base):
    __tablename__ = "sign_mappings"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    phrase_key: Mapped[str] = mapped_column(String(256), index=True, nullable=False)
    locale: Mapped[str] = mapped_column(String(16), default="en", index=True, nullable=False)
    asset_url: Mapped[str] = mapped_column(Text, nullable=False)
    priority: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
