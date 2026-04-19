"""
Lightweight in-process metrics collection.

Tracks key performance indicators without requiring Prometheus.
Stats are exposed via the /api/v1/metrics endpoint.
"""

import time
from collections import defaultdict, deque
from dataclasses import dataclass, field
from threading import Lock
from typing import DefaultDict


@dataclass
class RequestStats:
    count: int = 0
    total_ms: float = 0.0
    error_count: int = 0
    p95_window: deque = field(default_factory=lambda: deque(maxlen=200))

    def record(self, elapsed_ms: float, success: bool = True):
        self.count += 1
        self.total_ms += elapsed_ms
        self.p95_window.append(elapsed_ms)
        if not success:
            self.error_count += 1

    @property
    def avg_ms(self) -> float:
        return self.total_ms / self.count if self.count else 0.0

    @property
    def p95_ms(self) -> float:
        if not self.p95_window:
            return 0.0
        sorted_vals = sorted(self.p95_window)
        idx = int(len(sorted_vals) * 0.95)
        return sorted_vals[min(idx, len(sorted_vals) - 1)]

    def to_dict(self) -> dict:
        return {
            "count": self.count,
            "avg_ms": round(self.avg_ms, 1),
            "p95_ms": round(self.p95_ms, 1),
            "error_count": self.error_count,
            "error_rate": round(self.error_count / max(1, self.count), 3),
        }


class MetricsCollector:
    def __init__(self):
        self._lock = Lock()
        self._stats: DefaultDict[str, RequestStats] = defaultdict(RequestStats)
        self._start_time = time.time()

    def record(self, operation: str, elapsed_ms: float, success: bool = True):
        with self._lock:
            self._stats[operation].record(elapsed_ms, success)

    def get_all(self) -> dict:
        with self._lock:
            uptime = int(time.time() - self._start_time)
            return {
                "uptime_seconds": uptime,
                "operations": {k: v.to_dict() for k, v in self._stats.items()},
            }


metrics = MetricsCollector()
