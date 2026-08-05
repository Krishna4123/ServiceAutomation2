"""Simple read/query helpers for JSON mock data — keeps data access in one place."""

import json
from pathlib import Path
from typing import Optional
from app.utils.logger import get_logger

logger = get_logger(__name__)

_DATA_DIR = Path(__file__).parent

_orders: list[dict] = []
_accounts: list[dict] = []


def _load_data() -> None:
    """Lazily loads mock data files into memory once."""
    global _orders, _accounts
    if not _orders:
        with open(_DATA_DIR / "mock_orders.json", encoding="utf-8") as f:
            _orders = json.load(f)
        logger.info("Loaded %d mock orders", len(_orders))
    if not _accounts:
        with open(_DATA_DIR / "mock_accounts.json", encoding="utf-8") as f:
            _accounts = json.load(f)
        logger.info("Loaded %d mock accounts", len(_accounts))


def get_order_by_id(order_id: str) -> Optional[dict]:
    """Returns the order dict matching order_id, or None if not found."""
    _load_data()
    return next((o for o in _orders if o["order_id"] == order_id), None)


def get_orders_by_account(account_id: str) -> list[dict]:
    """Returns all orders belonging to account_id."""
    _load_data()
    return [o for o in _orders if o["account_id"] == account_id]


def get_account_by_id(account_id: str) -> Optional[dict]:
    """Returns the account dict matching account_id, or None if not found."""
    _load_data()
    return next((a for a in _accounts if a["account_id"] == account_id), None)


def get_account_by_email(email: str) -> Optional[dict]:
    """Returns the account matching the given email address, or None."""
    _load_data()
    return next((a for a in _accounts if a["email"].lower() == email.lower()), None)
