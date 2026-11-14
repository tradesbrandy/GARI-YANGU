"""Response shaping shared by the route modules (matches the shapes the React app expects)."""
from sqlalchemy import func

from .extensions import db
from .models import BuyerRequest, Listing, Offer, Review, User, iso, num


def dealer_info(user_id):
    u = db.session.get(User, user_id)
    avg, cnt = db.session.query(func.avg(Review.rating), func.count(Review.id)).filter(Review.dealer_id == user_id).one()
    p = u.dealer if u else None
    return {
        "id": user_id,
        "name": (p.business_name if p else None) or (u.full_name if u else "Dealer"),
        "verified": bool(p and p.status == "approved"),
        "county": (p.county if p else None) or (u.county if u else ""),
        "phone": (u.phone if u else "") or "",
        "rating": round(float(avg), 1) if cnt else None,
        "review_count": cnt,
    }


def listing_public(l):
    d = l.to_dict()
    info = dealer_info(l.owner_id)
    d.update(dealer=info["name"], verified=info["verified"], dealer_info=info)
    return d


def expand_offer(o, reveal=False):
    info = dealer_info(o.dealer_id)
    info["phone"] = info["phone"] if (reveal or o.status == "accepted") else None
    l = o.listing
    return {
        "id": o.id, "request_id": o.request_id, "dealer_id": o.dealer_id, "listing_id": o.listing_id,
        "price": num(o.price), "message": o.message or "", "status": o.status, "created_at": iso(o.created_at),
        "dealer": info,
        "listing": {"id": l.id, "title": f"{l.year} {l.make} {l.model}", "mileage_km": l.mileage_km,
                    "body_type": l.body_type, "color": l.color} if l else None,
        "reviewed": db.session.query(Review.id).filter_by(offer_id=o.id).first() is not None,
    }


def expand_request(r):
    offers = sorted((o for o in r.offers if o.status != "withdrawn"), key=lambda o: o.price)
    d = r.base_dict()
    d.update(expired=r.status == "open" and not r.is_live, offers=[expand_offer(o) for o in offers])
    return d
