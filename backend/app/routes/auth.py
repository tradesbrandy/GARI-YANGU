import re

from flask import Blueprint, g, jsonify, request

from ..auth import ApiError, login_required, make_token
from ..extensions import db
from ..models import DealerProfile, User

bp = Blueprint("auth", __name__, url_prefix="/api/auth")
KRA_RE = re.compile(r"^[AP]\d{9}[A-Z]$", re.I)


@bp.post("/login")
def login():
    d = request.get_json(silent=True) or {}
    email = str(d.get("email", "")).strip().lower()
    u = User.query.filter_by(email=email).first()
    if not u or not u.check_password(str(d.get("password", ""))):
        raise ApiError("Wrong email or password.", 401)
    if not u.is_active:
        raise ApiError("This account is disabled.", 403)
    return jsonify(token=make_token(u), user=u.to_dict())


@bp.post("/register")
def register():
    d = request.get_json(silent=True) or {}
    email = str(d.get("email", "")).strip().lower()
    name = str(d.get("full_name", "")).strip()
    pw = str(d.get("password", ""))
    if not email or "@" not in email:
        raise ApiError("Enter a valid email address.")
    if not name:
        raise ApiError("Enter your full name.")
    if len(pw) < 6:
        raise ApiError("Password must be at least 6 characters.")
    if User.query.filter_by(email=email).first():
        raise ApiError("An account with this email already exists.", 409)

    role = "dealer" if d.get("role") == "dealer" else "buyer"
    u = User(email=email, full_name=name, phone=str(d.get("phone") or ""), role=role, county=d.get("county") or "")
    u.set_password(pw)
    if role == "dealer":
        pin = str(d.get("kra_pin", "")).strip().upper()
        biz = str(d.get("business_name", "")).strip()
        if not biz:
            raise ApiError("Enter your business name.")
        if not KRA_RE.match(pin):
            raise ApiError("Enter a valid KRA PIN (e.g. A123456789Z).")
        if DealerProfile.query.filter_by(kra_pin=pin).first():
            raise ApiError("That KRA PIN is already registered.", 409)
        u.dealer = DealerProfile(business_name=biz, kra_pin=pin, county=d.get("county") or "",
                                 address=d.get("address") or "", status="pending")
    db.session.add(u)
    db.session.commit()
    return jsonify(token=make_token(u), user=u.to_dict()), 201


@bp.get("/me")
@login_required()
def me():
    return jsonify(g.user.to_dict())
