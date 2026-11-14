from datetime import datetime, timezone

from flask import Blueprint, jsonify, request

from ..auth import ApiError, login_required
from ..extensions import db
from ..models import DealerProfile, User, utcnow

bp = Blueprint("admin", __name__, url_prefix="/api/admin")


@bp.get("/dealers")
@login_required("admin")
def all_dealers():
    rows = User.query.join(DealerProfile).order_by(User.id.desc()).all()
    return jsonify([u.to_dict() for u in rows])


@bp.post("/dealers/<int:uid>/review")
@login_required("admin")
def review_dealer(uid):
    d = request.get_json(silent=True) or {}
    u = db.session.get(User, uid)
    if not u or not u.dealer:
        raise ApiError("Dealer not found.", 404)
    p = u.dealer
    if d.get("decision") == "approved":
        p.status, p.rejection_reason, p.verified_at = "approved", "", utcnow()
    elif d.get("decision") == "rejected":
        p.status, p.rejection_reason, p.verified_at = "rejected", (d.get("reason") or "").strip(), None
    else:
        raise ApiError("Decision must be 'approved' or 'rejected'.")
    db.session.commit()
    return jsonify(ok=True)
