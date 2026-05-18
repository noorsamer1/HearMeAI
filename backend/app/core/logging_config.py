import logging
import sys

import structlog

# Third-party loggers that flood the console when root level is DEBUG.
_NOISY_LOGGER_NAMES: tuple[str, ...] = (
    "sqlalchemy.engine",
    "sqlalchemy.engine.Engine",
    "sqlalchemy.pool",
    "sqlalchemy.orm",
    "aiosqlite",
    "httpx",
    "httpcore",
    "httpcore.connection",
    "httpcore.http11",
    "h11",
    "openai",
    "openai._base_client",
    "urllib3",
    "uvicorn.access",
    "multipart",
    "watchfiles",
)


def _set_logger_level(name: str, level: int) -> None:
    logging.getLogger(name).setLevel(level)


def configure_logging(*, debug: bool = False, sql_echo: bool = False) -> None:
    """Configure structlog and stdlib logging.

    ``debug`` enables DEBUG for application loggers only (``app.*``), not
    libraries. SQL statement echo is controlled separately via ``sql_echo``.
    """
    root_level = logging.INFO
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=root_level,
        force=True,
    )

    for name in _NOISY_LOGGER_NAMES:
        _set_logger_level(name, logging.WARNING)

    app_level = logging.DEBUG if debug else logging.INFO
    _set_logger_level("app", app_level)

    if sql_echo:
        _set_logger_level("sqlalchemy.engine", logging.INFO)

    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.stdlib.add_log_level,
            structlog.stdlib.add_logger_name,
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.dev.ConsoleRenderer() if debug else structlog.processors.JSONRenderer(),
        ],
        wrapper_class=structlog.stdlib.BoundLogger,
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )


def get_logger(name: str = __name__):
    return structlog.get_logger(name)
