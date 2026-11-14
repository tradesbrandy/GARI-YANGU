from datetime import timedelta
from functools import wraps

import jwt
from flask import current_app, g, jsonify, request

from .extensions import db
from .models import User, utcnow


class ApiError(Exception):
    def __init__(self, message, status=400):
        super().__init__(message)
        self.message, self.status = message, status


def make_token(user):
    payload = {"sub": str(user.id), "exp": utcnow() + timedelta(hours=current_app.config["TOKEN_HOURS"])}
    return jwt.encode(payload, current_app.config["SECRET_KEY"], algorithm="HS256")


def _current_user():
    header = request.headers.get("Authorization", "")
    if not header.startswith("Bearer "):
        return None
    try:
        data = jwt.decode(header[7:], current_app.config["SECRET_KEY"], algorithms=["HS256"])
        user = db.session.get(User, int(data["sub"]))
    except (jwt.PyJWTError, ValueError, KeyError):
        return None
    return user if user and user.is_active else None


def login_required(*roles):
    """@login_required() = any signed-in user; @login_required('dealer') = that role only."""
    def deco(fn):
        @wraps(fn)
        def wrapper(*a, **kw):
            user = _current_user()
            if not user:
                return jsonify(error="Please sign in."), 401
            if roles and user.role not in roles:
                return jsonify(error="You don't have access to this."), 403
            g.user = user
            return fn(*a, **kw)
        return wrapper
    return deco
