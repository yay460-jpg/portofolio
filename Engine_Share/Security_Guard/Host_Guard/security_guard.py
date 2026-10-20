"""Shared host-side security policy for Lithosite Security Evolution 2.

This module enforces browser Origin allowlisting for the local-only Desktop Host.
It is not authentication and does not protect against an arbitrary process
already running as the same local user.
"""
from __future__ import annotations

import os

DEV_ORIGINS = frozenset({
    "http://127.0.0.1:5500",
    "http://localhost:5500",
    "http://127.0.0.1:5501",
    "http://localhost:5501",
})


def is_allowed_origin(origin: str | None, host_port: int | None = None) -> bool:
    """Allow the host's own origin and documented local development origins.

    Requests without an Origin header are allowed for non-browser local clients.
    The literal null origin and arbitrary loopback ports are rejected. This is
    a CORS/browser boundary, not caller authentication.
    """
    if origin is None:
        return True
    if not isinstance(origin, str) or not origin or origin == "null":
        return False

    if host_port is None:
        try:
            host_port = int(os.environ.get("MINE_SERVICES_PORT", "8765"))
        except (TypeError, ValueError):
            return False
    else:
        try:
            host_port = int(host_port)
        except (TypeError, ValueError):
            return False

    if not 1 <= host_port <= 65535:
        return False

    allowed = DEV_ORIGINS | frozenset({
        f"http://127.0.0.1:{host_port}",
        f"http://localhost:{host_port}",
    })
    return origin in allowed
