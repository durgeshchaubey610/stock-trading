import os
from pathlib import Path


def _load_dotenv() -> None:
    env_path = Path(__file__).resolve().parent.parent / ".env"
    if not env_path.exists():
        return

    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")

        if key:
            os.environ.setdefault(key, value)


_load_dotenv()


def _get_env(name: str, default: str | None = None, *, required: bool = False) -> str:
    value = os.getenv(name, default)
    if required and not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value or ""


def _get_int(name: str, default: int) -> int:
    value = os.getenv(name)
    if value is None:
        return default
    return int(value)


DB_HOST = _get_env("DB_HOST", "localhost")
DB_PORT = _get_env("DB_PORT", "3306")
DB_USER = _get_env("DB_USER", "root")
DB_PASS = _get_env("DB_PASS", "")
DB_NAME = _get_env("DB_NAME", "stock_ai")

SECRET_KEY = _get_env("SECRET_KEY", required=True)

BASE_BUY_QTY = _get_int("BASE_BUY_QTY", 10)
MARKET_BUY_TIME = _get_int("MARKET_BUY_TIME", 15)
ACCESS_TOKEN_EXPIRE_HOURS = _get_int("ACCESS_TOKEN_EXPIRE_HOURS", 10)
