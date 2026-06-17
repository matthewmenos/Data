"""Web Push notification service using VAPID + pywebpush."""
import json
from py_vapid import Vapid
from pywebpush import webpush, WebPushException
from .db import global_db


def _get_or_create_vapid_keys(config) -> tuple[str, str]:
    """Return (private_key_b64, public_key_b64), generating and persisting if needed."""
    with global_db(config) as db:
        priv_row = db.execute(
            "SELECT value FROM app_settings WHERE key='vapid_private_key'"
        ).fetchone()
        pub_row = db.execute(
            "SELECT value FROM app_settings WHERE key='vapid_public_key'"
        ).fetchone()

        if priv_row and pub_row:
            return priv_row["value"], pub_row["value"]

        # Generate fresh VAPID key pair
        vapid = Vapid()
        vapid.generate_keys()
        private_b64 = vapid.private_key_urlsafe_base64()
        public_b64  = vapid.public_key_urlsafe_base64()

        db.execute(
            "INSERT OR REPLACE INTO app_settings (key, value) VALUES ('vapid_private_key', ?)",
            (private_b64,)
        )
        db.execute(
            "INSERT OR REPLACE INTO app_settings (key, value) VALUES ('vapid_public_key', ?)",
            (public_b64,)
        )
        return private_b64, public_b64


def get_vapid_public_key(config) -> str:
    _, pub = _get_or_create_vapid_keys(config)
    return pub


def _send_push_raw(private_key: str, claims: dict, subscription: dict,
                   title: str, body: str, url: str, icon: str) -> bool:
    """Low-level send — no DB access. Returns True on success, raises on 410."""
    payload = json.dumps({"title": title, "body": body, "url": url, "icon": icon})
    try:
        webpush(
            subscription_info=subscription,
            data=payload,
            vapid_private_key=private_key,
            vapid_claims=claims,
        )
        return True
    except WebPushException as e:
        if hasattr(e, "response") and e.response is not None and e.response.status_code == 410:
            raise
        return False


def send_push(config, subscription: dict, title: str, body: str,
              url: str = "/", icon: str = "/static/icons/icon-192.svg") -> bool:
    """Send a push notification to one subscription. Returns True on success."""
    private_key, _ = _get_or_create_vapid_keys(config)
    app_url = config.get("APP_URL", "")
    claims = {"sub": f"mailto:admin@{app_url.replace('https://', '').replace('http://', '').split('/')[0]}"}
    return _send_push_raw(private_key, claims, subscription, title, body, url, icon)


def broadcast_push(config, user_id: str | None, title: str, body: str,
                   url: str = "/") -> None:
    """Send push to all subscriptions for a user_id (or all guests if None)."""
    icon = "/static/icons/icon-192.svg"

    # Fetch VAPID keys and subscriptions in one DB open — no nesting
    private_key, _ = _get_or_create_vapid_keys(config)
    app_url = config.get("APP_URL", "")
    claims = {"sub": f"mailto:admin@{app_url.replace('https://', '').replace('http://', '').split('/')[0]}"}

    with global_db(config) as db:
        if user_id:
            rows = db.execute(
                "SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE user_id=?",
                (user_id,)
            ).fetchall()
        else:
            rows = db.execute(
                "SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE user_id IS NULL"
            ).fetchall()

        rows = [dict(r) for r in rows]

    # Send outside the DB context so no nested global_db calls occur
    stale_ids = []
    for row in rows:
        sub = {
            "endpoint": row["endpoint"],
            "keys": {"p256dh": row["p256dh"], "auth": row["auth"]},
        }
        try:
            _send_push_raw(private_key, claims, sub, title, body, url, icon)
        except WebPushException:
            stale_ids.append(row["id"])

    if stale_ids:
        with global_db(config) as db:
            for sid in stale_ids:
                db.execute("DELETE FROM push_subscriptions WHERE id=?", (sid,))
