from datetime import timedelta
import math

from flask import Blueprint, g, jsonify, request

from ..auth import ApiError, login_required
from ..extensions import db
from ..models import BuyerRequest, Offer, Review, utcnow
from ..services import expand_request

bp = Blueprint("buyer", __name__, url_prefix="/api")

FUELS = {"", "petrol", "diesel", "hybrid", "electric"}
BODIES = {"", "sedan", "suv", "hatchback", "pickup", "van", "wagon", "coupe"}


def _int(v, field):
    if v in (None, ""):
        return None
    try:
        return int(float(v))
    except (TypeError, ValueError, OverflowError):
        raise ApiError(f"Invalid {field}.")


@bp.post("/requests")
@login_required("buyer")
def create_request():
    f = request.get_json(silent=True) or {}
    try:
        max_price = float(f.get("max_price"))
    except (TypeError, ValueError):
        raise ApiError("Enter your maximum budget.")
    if not math.isfinite(max_price) or max_price <= 0:
        raise ApiError("Enter your maximum budget.")
    if f.get("fuel", "") not in FUELS or f.get("body_type", "") not in BODIES:
        raise ApiError("Invalid fuel or body type.")
    days = min(max(_int(f.get("days"), "duration") or 30, 1), 90)
    r = BuyerRequest(
        buyer_id=g.user.id, make=f.get("make") or "", model=(f.get("model") or "").strip(),
        min_year=_int(f.get("min_year"), "year"), max_price=max_price, fuel=f.get("fuel") or "",
        body_type=f.get("body_type") or "", county=f.get("county") or "", notes=(f.get("notes") or "").strip(),
        expires_at=utcnow() + timedelta(days=days),
    )
    db.session.add(r)
    db.session.commit()
    return jsonify(expand_request(r)), 201


@bp.get("/requests/mine")
@login_required("buyer")
def my_requests():
    rows = BuyerRequest.query.filter_by(buyer_id=g.user.id).order_by(BuyerRequest.id.desc()).all()
    return jsonify([expand_request(r) for r in rows])


def _own_request(rid):
    r = BuyerRequest.query.filter_by(id=rid, buyer_id=g.user.id).first()
    if not r:
        raise ApiError("Request not found.", 404)
    return r


def _own_offer(oid):
    o = db.session.get(Offer, oid)
    if not o or o.request.buyer_id != g.user.id:
        raise ApiError("Offer not found.", 404)
    return o


@bp.post("/requests/<int:rid>/close")
@login_required("buyer")
def close_request(rid):
    r = _own_request(rid)
    r.status = "closed"
    for o in r.offers:
        if o.status == "pending":
            o.status = "declined"
    db.session.commit()
    return jsonify(ok=True)


@bp.post("/offers/<int:oid>/accept")
@login_required("buyer")
def accept_offer(oid):
    o = _own_offer(oid)
    r = o.request
    if r.status != "open":
        raise ApiError("This request is no longer open.", 409)
    if o.status != "pending":
        raise ApiError("This offer can no longer be accepted.", 409)
    for x in r.offers:
        if x.id == o.id:
            x.status = "accepted"
        elif x.status == "pending":
            x.status = "declined"
    r.status = "fulfilled"
    db.session.commit()
    return jsonify(ok=True)


@bp.post("/offers/<int:oid>/decline")
@login_required("buyer")
def decline_offer(oid):
    o = _own_offer(oid)
    if o.status != "pending":
        raise ApiError("Only pending offers can be declined.", 409)
    o.status = "declined"
    db.session.commit()
    return jsonify(ok=True)


@bp.post("/offers/<int:oid>/review")
@login_required("buyer")
def review_offer(oid):
    d = request.get_json(silent=True) or {}
    o = _own_offer(oid)
    if o.status != "accepted":
        raise ApiError("You can only review a dealer after accepting their offer.", 409)
    if Review.query.filter_by(offer_id=oid).first():
        raise ApiError("You already reviewed this deal.", 409)
    try:
        rating = int(d.get("rating"))
    except (TypeError, ValueError):
        rating = 0
    if not 1 <= rating <= 5:
        raise ApiError("Rating must be between 1 and 5.")
    db.session.add(Review(reviewer_id=g.user.id, dealer_id=o.dealer_id, offer_id=oid, rating=rating,
                          comment=(d.get("comment") or "").strip()))
    db.session.commit()
    return jsonify(ok=True), 201
