"""SQLAlchemy models. Mirrors gari-yangu-schema.dbml (make/model kept as plain strings,
which is what the frontend sends and expects)."""
from datetime import datetime, timezone

from werkzeug.security import check_password_hash, generate_password_hash

from .extensions import db


def utcnow():
    return datetime.now(timezone.utc).replace(tzinfo=None)


def iso(dt):
    """Naive-UTC datetime -> ISO string with 'Z' so JavaScript parses it as UTC."""
    return dt.isoformat(timespec="seconds") + "Z" if dt else None


def num(v):
    if v is None:
        return None
    f = float(v)
    return int(f) if f.is_integer() else f


class User(db.Model):
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(254), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(150), nullable=False)
    phone = db.Column(db.String(20), default="")
    role = db.Column(db.String(10), nullable=False, default="buyer")  # buyer|dealer|admin
    county = db.Column(db.String(50), default="")
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    created_at = db.Column(db.DateTime, nullable=False, default=utcnow)
    dealer = db.relationship("DealerProfile", uselist=False, back_populates="user", cascade="all, delete-orphan")

    def set_password(self, pw):
        # PBKDF2 avoids environments where Python's hashlib lacks scrypt.
        self.password_hash = generate_password_hash(pw, method="pbkdf2:sha256")

    def check_password(self, pw):
        return check_password_hash(self.password_hash, pw)

    def to_dict(self):
        d = {
            "id": self.id, "email": self.email, "full_name": self.full_name, "phone": self.phone or "",
            "role": self.role, "county": self.county or "", "created_at": iso(self.created_at),
        }
        if self.dealer:
            d["dealer"] = self.dealer.to_dict()
        return d


class DealerProfile(db.Model):
    __tablename__ = "dealer_profiles"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), unique=True, nullable=False)
    business_name = db.Column(db.String(150), nullable=False)
    kra_pin = db.Column(db.String(20), unique=True, nullable=False)
    county = db.Column(db.String(50), nullable=False)
    address = db.Column(db.String(255), default="")
    status = db.Column(db.String(10), nullable=False, default="pending")  # pending|approved|rejected
    rejection_reason = db.Column(db.Text, default="")
    verified_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, nullable=False, default=utcnow)
    user = db.relationship("User", back_populates="dealer")

    def to_dict(self):
        return {
            "business_name": self.business_name, "kra_pin": self.kra_pin, "county": self.county,
            "address": self.address or "", "status": self.status,
            "rejection_reason": self.rejection_reason or "", "verified_at": iso(self.verified_at),
        }


class Listing(db.Model):
    __tablename__ = "listings"
    id = db.Column(db.Integer, primary_key=True)
    owner_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    make = db.Column(db.String(60), nullable=False)
    model = db.Column(db.String(80), nullable=False)
    year = db.Column(db.SmallInteger, nullable=False, index=True)
    price = db.Column(db.Numeric(12, 2), nullable=False, index=True)  # KES
    mileage_km = db.Column(db.Integer)
    fuel = db.Column(db.String(10), nullable=False)
    transmission = db.Column(db.String(10), nullable=False)
    body_type = db.Column(db.String(10))
    color = db.Column(db.String(30))  # hex colour used by the frontend CarArt
    engine_cc = db.Column(db.Integer)
    county = db.Column(db.String(50), nullable=False, index=True)
    description = db.Column(db.Text, default="")
    status = db.Column(db.String(10), nullable=False, default="active", index=True)  # draft|active|sold|hidden
    created_at = db.Column(db.DateTime, nullable=False, default=utcnow)
    owner = db.relationship("User")
    images = db.relationship("ListingImage", back_populates="listing", cascade="all, delete-orphan", order_by="(ListingImage.is_primary.desc(), ListingImage.id.asc())")

    def to_dict(self):
        return {
            "id": self.id, "owner_id": self.owner_id, "make": self.make, "model": self.model, "year": self.year,
            "price": num(self.price), "mileage_km": self.mileage_km, "fuel": self.fuel,
            "transmission": self.transmission, "body_type": self.body_type, "color": self.color,
            "engine_cc": self.engine_cc, "county": self.county, "description": self.description or "",
            "status": self.status, "created_at": iso(self.created_at),
            "images": [img.to_dict() for img in self.images],
            "image_url": next((img.url for img in self.images if img.is_primary), self.images[0].url if self.images else None),
        }


class ListingImage(db.Model):
    __tablename__ = "listing_images"
    id = db.Column(db.Integer, primary_key=True)
    listing_id = db.Column(db.Integer, db.ForeignKey("listings.id", ondelete="CASCADE"), nullable=False, index=True)
    filename = db.Column(db.String(255), nullable=False, unique=True)
    is_primary = db.Column(db.Boolean, nullable=False, default=False)
    created_at = db.Column(db.DateTime, nullable=False, default=utcnow)
    listing = db.relationship("Listing", back_populates="images")

    @property
    def url(self):
        return "/uploads/" + self.filename

    def to_dict(self):
        return {"id": self.id, "url": self.url, "is_primary": self.is_primary, "created_at": iso(self.created_at)}


class BuyerRequest(db.Model):
    __tablename__ = "buyer_requests"
    id = db.Column(db.Integer, primary_key=True)
    buyer_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    make = db.Column(db.String(60), default="")
    model = db.Column(db.String(80), default="")
    min_year = db.Column(db.SmallInteger)
    max_price = db.Column(db.Numeric(12, 2))
    fuel = db.Column(db.String(10), default="")
    body_type = db.Column(db.String(10), default="")
    county = db.Column(db.String(50), default="", index=True)
    notes = db.Column(db.Text, default="")
    status = db.Column(db.String(10), nullable=False, default="open", index=True)  # open|fulfilled|closed
    expires_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, nullable=False, default=utcnow)
    buyer = db.relationship("User")
    offers = db.relationship("Offer", back_populates="request", cascade="all, delete-orphan")

    @property
    def is_live(self):
        return self.status == "open" and (self.expires_at is None or self.expires_at > utcnow())

    @property
    def title(self):
        return " ".join(p for p in (self.make, self.model) if p) or "Any car"

    def base_dict(self):
        return {
            "id": self.id, "buyer_id": self.buyer_id, "make": self.make or "", "model": self.model or "",
            "min_year": self.min_year, "max_price": num(self.max_price), "fuel": self.fuel or "",
            "body_type": self.body_type or "", "county": self.county or "", "notes": self.notes or "",
            "status": self.status, "created_at": iso(self.created_at), "expires_at": iso(self.expires_at),
            "title": self.title,
        }


class Offer(db.Model):
    __tablename__ = "offers"
    __table_args__ = (db.UniqueConstraint("request_id", "dealer_id", name="uq_offer_request_dealer"),)
    id = db.Column(db.Integer, primary_key=True)
    request_id = db.Column(db.Integer, db.ForeignKey("buyer_requests.id"), nullable=False, index=True)
    dealer_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    listing_id = db.Column(db.Integer, db.ForeignKey("listings.id", ondelete="SET NULL"))
    price = db.Column(db.Numeric(12, 2), nullable=False)
    message = db.Column(db.Text, default="")
    status = db.Column(db.String(10), nullable=False, default="pending")  # pending|accepted|declined|withdrawn
    created_at = db.Column(db.DateTime, nullable=False, default=utcnow)
    request = db.relationship("BuyerRequest", back_populates="offers")
    dealer = db.relationship("User")
    listing = db.relationship("Listing")


class Review(db.Model):
    __tablename__ = "reviews"
    id = db.Column(db.Integer, primary_key=True)
    reviewer_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    dealer_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    offer_id = db.Column(db.Integer, db.ForeignKey("offers.id"), unique=True)
    rating = db.Column(db.SmallInteger, nullable=False)
    comment = db.Column(db.Text, default="")
    created_at = db.Column(db.DateTime, nullable=False, default=utcnow)
