from datetime import datetime, timedelta
import os
import secrets

_otp_store = {}


def create_otp(identifier: str, purpose: str) -> str:
    otp = f"{secrets.randbelow(1_000_000):06d}"
    expires_at = datetime.utcnow() + timedelta(
        minutes=int(os.getenv("OTP_EXPIRE_MINUTES", "10"))
    )
    _otp_store[_key(identifier, purpose)] = {
        "otp": otp,
        "expires_at": expires_at,
        "verified": False,
    }
    return otp


def verify_otp(identifier: str, purpose: str, otp: str, mark_verified: bool = True) -> bool:
    record = _otp_store.get(_key(identifier, purpose))
    if not record:
        return False

    if record["expires_at"] < datetime.utcnow():
        _otp_store.pop(_key(identifier, purpose), None)
        return False

    is_valid = secrets.compare_digest(record["otp"], otp)
    if is_valid and mark_verified:
        record["verified"] = True

    return is_valid


def consume_verified_otp(identifier: str, purpose: str, otp: str) -> bool:
    key = _key(identifier, purpose)
    record = _otp_store.get(key)
    if not record:
        return False

    is_valid = (
        record.get("verified")
        and record["expires_at"] >= datetime.utcnow()
        and secrets.compare_digest(record["otp"], otp)
    )

    if is_valid:
        _otp_store.pop(key, None)

    return is_valid


def _key(identifier: str, purpose: str) -> tuple[str, str]:
    return identifier.strip().lower(), purpose.strip().lower()
