"""One-shot: delete every chat session and all messages (all users)."""

import asyncio
import sys
from pathlib import Path

_BACKEND = Path(__file__).resolve().parents[1]
if str(_BACKEND) not in sys.path:
    sys.path.insert(0, str(_BACKEND))

from app.crud import chat_session as session_crud  # noqa: E402
from app.db.session import get_session_factory, init_db  # noqa: E402
from app.services.context_manager import context_registry  # noqa: E402


async def main() -> None:
    await init_db()
    factory = get_session_factory()
    async with factory() as db:
        count = await session_crud.delete_all_sessions(db)
        await db.commit()
    context_registry.clear_all()
    print(f"Purged {count} session(s) and all related messages.")


if __name__ == "__main__":
    asyncio.run(main())
