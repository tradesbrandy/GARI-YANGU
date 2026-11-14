from flask import Blueprint, jsonify

from ..auth import ApiError
from ..models import Listing
from ..services import listing_public

bp = Blueprint("cars", __name__, url_prefix="/api/cars")


@bp.get("")
def list_cars():
    rows = Listing.query.filter_by(status="active").order_by(Listing.id).all()
    return jsonify([listing_public(l) for l in rows])


@bp.get("/<int:car_id>")
def get_car(car_id):
    l = Listing.query.filter_by(id=car_id, status="active").first()
    if not l:
        raise ApiError("Car not found.", 404)
    return jsonify(listing_public(l))
