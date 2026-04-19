"""Integration tests for API endpoints."""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

from app.main import app

client = TestClient(app)


class TestHealthEndpoints:
    def test_root_returns_info(self):
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert "version" in data

    def test_health_ok(self):
        response = client.get("/api/v1/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert "version" in data

    def test_ready_ok(self):
        response = client.get("/api/v1/ready")
        assert response.status_code == 200
        assert response.json()["status"] == "ready"

    def test_metrics_endpoint(self):
        response = client.get("/api/v1/metrics")
        assert response.status_code == 200
        data = response.json()
        assert "uptime_seconds" in data
        assert "operations" in data


class TestSecurityHeaders:
    def test_no_frame_options(self):
        response = client.get("/")
        assert response.headers.get("X-Frame-Options") == "DENY"

    def test_correlation_id_returned(self):
        response = client.get("/", headers={"X-Request-ID": "test-123"})
        assert response.headers.get("X-Request-ID") == "test-123"

    def test_response_time_header(self):
        response = client.get("/")
        assert "X-Response-Time" in response.headers
