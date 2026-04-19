"""Small demo service for meeting presentations.

Run with custom arguments so you can show clear proof that it is working.
Example:
    python demo_service.py --doctor "Dr. Sami" --student "Ali" --case "Session-10AM"
"""

from __future__ import annotations

import argparse
import json
import socket
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, HTTPServer
from typing import Any


@dataclass(frozen=True)
class DemoConfig:
    doctor: str
    student: str
    case: str
    note: str
    port: int


def parse_args() -> DemoConfig:
    parser = argparse.ArgumentParser(
        description="Tiny HTTP service to prove demo setup is working."
    )
    parser.add_argument(
        "--doctor",
        default="Doctor",
        help="Doctor name shown in the proof response.",
    )
    parser.add_argument(
        "--student",
        default="Student",
        help="Student/laptop owner name shown in the proof response.",
    )
    parser.add_argument(
        "--case",
        default="AI-Comm-Demo",
        help="Any meeting label you want to show.",
    )
    parser.add_argument(
        "--note",
        default="Frontend setup verified",
        help="Custom note printed in the response.",
    )
    parser.add_argument(
        "--port",
        type=int,
        default=5050,
        help="Port to run the demo service on (default: 5050).",
    )
    args = parser.parse_args()
    return DemoConfig(
        doctor=args.doctor,
        student=args.student,
        case=args.case,
        note=args.note,
        port=args.port,
    )


def make_handler(config: DemoConfig, started_at: float):
    class DemoHandler(BaseHTTPRequestHandler):
        def _write_json(self, status_code: int, payload: dict[str, Any]) -> None:
            body = json.dumps(payload, ensure_ascii=True).encode("utf-8")
            self.send_response(status_code)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def do_GET(self) -> None:  # noqa: N802 (required method name)
            now = datetime.now(timezone.utc).isoformat()
            uptime_seconds = round(time.time() - started_at, 2)

            if self.path == "/health":
                self._write_json(
                    200,
                    {
                        "status": "ok",
                        "service": "demo_service",
                        "timestamp_utc": now,
                        "uptime_seconds": uptime_seconds,
                    },
                )
                return

            if self.path == "/proof":
                self._write_json(
                    200,
                    {
                        "status": "worked",
                        "doctor": config.doctor,
                        "student": config.student,
                        "case": config.case,
                        "note": config.note,
                        "timestamp_utc": now,
                        "uptime_seconds": uptime_seconds,
                        "host": socket.gethostname(),
                    },
                )
                return

            self._write_json(404, {"error": "not_found", "path": self.path})

        def log_message(self, format: str, *args: Any) -> None:
            # Keep output clean for demos.
            return

    return DemoHandler


def main() -> None:
    config = parse_args()
    started_at = time.time()
    handler = make_handler(config=config, started_at=started_at)
    server = HTTPServer(("0.0.0.0", config.port), handler)

    print("=" * 66)
    print("Demo service started")
    print(f"Doctor : {config.doctor}")
    print(f"Student: {config.student}")
    print(f"Case   : {config.case}")
    print(f"Note   : {config.note}")
    print(f"URL    : http://127.0.0.1:{config.port}")
    print(f"Health : http://127.0.0.1:{config.port}/health")
    print(f"Proof  : http://127.0.0.1:{config.port}/proof")
    print("=" * 66)

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
        print("Demo service stopped")


if __name__ == "__main__":
    main()
