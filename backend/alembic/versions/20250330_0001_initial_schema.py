"""Initial HearME schema

Revision ID: 20250330_0001
Revises:
Create Date: 2025-03-30

"""

from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "20250330_0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    import app.models  # noqa: F401 — register tables on metadata
    from app.db.base import Base

    bind = op.get_bind()
    Base.metadata.create_all(bind=bind)


def downgrade() -> None:
    import app.models  # noqa: F401
    from app.db.base import Base

    bind = op.get_bind()
    Base.metadata.drop_all(bind=bind)
