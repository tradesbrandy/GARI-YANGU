import pytest

from app import create_app
from app.extensions import db
from app.seed import seed


@pytest.fixture()
def c():
    app = create_app({"TESTING": True, "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:", "SECRET_KEY": "test-secret-key-that-is-long-enough-123456"})
    with app.app_context():
        db.create_all()
        seed()
        yield app.test_client()
        db.drop_all()


def login(c, email, pw="demo1234"):
    r = c.post("/api/auth/login", json={"email": email, "password": pw})
    assert r.status_code == 200, r.json
    return {"Authorization": "Bearer " + r.json["token"]}


def test_auth_and_roles(c):
    assert c.post("/api/auth/login", json={"email": "buyer@demo.com", "password": "x"}).status_code == 401
    h = login(c, "buyer@demo.com")
    assert c.get("/api/auth/me", headers=h).json["role"] == "buyer"
    assert c.get("/api/auth/me").status_code == 401
    assert c.get("/api/dealer/stats", headers=h).status_code == 403
    assert c.get("/api/admin/dealers", headers=h).status_code == 403


def test_register(c):
    r = c.post("/api/auth/register", json={"email": "n@x.com", "password": "secret1", "full_name": "N X", "role": "buyer"})
    assert r.status_code == 201 and "token" in r.json
    assert c.post("/api/auth/register", json={"email": "n@x.com", "password": "secret1", "full_name": "N"}).status_code == 409
    d = {"email": "d@x.com", "password": "secret1", "full_name": "D", "role": "dealer", "business_name": "D Ltd",
         "kra_pin": "A123456789Z", "county": "Nairobi"}
    r = c.post("/api/auth/register", json=d)
    assert r.status_code == 201 and r.json["user"]["dealer"]["status"] == "pending"
    d["email"] = "e@x.com"
    assert c.post("/api/auth/register", json=d).status_code == 409  # duplicate PIN


def test_cars(c):
    cars = c.get("/api/cars").json
    assert len(cars) >= 10 and "dealer" in cars[0] and "verified" in cars[0]
    assert c.get("/api/cars/1").json["id"] == 1
    assert c.get("/api/cars/9999").status_code == 404


def test_full_deal_flow(c):
    b, d = login(c, "buyer@demo.com"), login(c, "dealer@demo.com")
    req = c.post("/api/requests", headers=b, json={"make": "Mazda", "model": "CX-5", "max_price": 3000000, "county": "Nairobi"}).json
    assert req["status"] == "open" and req["title"] == "Mazda CX-5"
    assert any(r["id"] == req["id"] for r in c.get("/api/dealer/requests", headers=d).json)
    o = c.post("/api/dealer/offers", headers=d, json={"request_id": req["id"], "price": 2900000, "message": "hi"})
    assert o.status_code == 201
    assert c.post("/api/dealer/offers", headers=d, json={"request_id": req["id"], "price": 2800000}).status_code == 409
    mine = [r for r in c.get("/api/requests/mine", headers=b).json if r["id"] == req["id"]][0]
    off = mine["offers"][0]
    assert off["price"] == 2900000 and off["dealer"]["phone"] is None  # phone hidden until accepted
    assert c.post(f"/api/offers/{off['id']}/accept", headers=d).status_code == 403
    assert c.post(f"/api/offers/{off['id']}/review", headers=b, json={"rating": 5}).status_code == 409
    assert c.post(f"/api/offers/{off['id']}/accept", headers=b).status_code == 200
    mine = [r for r in c.get("/api/requests/mine", headers=b).json if r["id"] == req["id"]][0]
    assert mine["status"] == "fulfilled" and mine["offers"][0]["dealer"]["phone"]
    assert c.post(f"/api/offers/{off['id']}/review", headers=b, json={"rating": 5, "comment": "ok"}).status_code == 201
    assert c.post(f"/api/offers/{off['id']}/review", headers=b, json={"rating": 5}).status_code == 409


def test_withdraw_and_reoffer(c):
    d = login(c, "dealer@demo.com")
    offers = c.get("/api/dealer/offers", headers=d).json
    oid = offers[0]["id"]
    assert c.post(f"/api/dealer/offers/{oid}/withdraw", headers=d).status_code == 200
    rid = offers[0]["request_id"]
    assert c.post("/api/dealer/offers", headers=d, json={"request_id": rid, "price": 1}).status_code == 201


def test_unapproved_dealer_cannot_offer(c):
    c.post("/api/auth/register", json={"email": "d@x.com", "password": "secret1", "full_name": "D", "role": "dealer",
                                       "business_name": "D", "kra_pin": "A123456789Z", "county": "Nairobi"})
    d = login(c, "d@x.com", "secret1")
    assert c.post("/api/dealer/offers", headers=d, json={"request_id": 1, "price": 5}).status_code == 403


def test_listings_crud_and_ownership(c):
    d = login(c, "dealer@demo.com")
    body = {"make": "Toyota", "model": "Vitz", "year": 2015, "price": 900000, "fuel": "petrol", "transmission": "automatic",
            "body_type": "hatchback", "county": "Nairobi", "color": "#fff"}
    l = c.post("/api/dealer/listings", headers=d, json=body)
    assert l.status_code == 201
    lid = l.json["id"]
    assert c.put(f"/api/dealer/listings/{lid}", headers=d, json={**body, "price": 950000}).json["price"] == 950000
    assert c.post(f"/api/dealer/listings/{lid}/status", headers=d, json={"status": "sold"}).status_code == 200
    assert lid not in [x["id"] for x in c.get("/api/cars").json]
    other = login(c, "capitalautohub@dealers.demo")
    assert c.delete(f"/api/dealer/listings/{lid}", headers=other).status_code == 404
    assert c.delete(f"/api/dealer/listings/{lid}", headers=d).status_code == 200


def test_admin_review(c):
    a = login(c, "admin@demo.com")
    pending = [u for u in c.get("/api/admin/dealers", headers=a).json if u["dealer"]["status"] == "pending"]
    assert pending
    uid = pending[0]["id"]
    assert c.post(f"/api/admin/dealers/{uid}/review", headers=a, json={"decision": "rejected", "reason": "bad pin"}).status_code == 200
    assert c.post(f"/api/admin/dealers/{uid}/review", headers=a, json={"decision": "approved"}).status_code == 200
    assert c.post(f"/api/admin/dealers/{uid}/review", headers=a, json={"decision": "x"}).status_code == 400


def test_dealer_stats(c):
    d = login(c, "dealer@demo.com")
    s = c.get("/api/dealer/stats", headers=d).json
    assert set(s) == {"active_listings", "open_requests", "offers_sent", "accepted", "rating"}


def test_listing_photo_upload_and_management(c, tmp_path):
    from io import BytesIO
    from PIL import Image
    from app import create_app
    from app.extensions import db

    # Use an isolated folder for the uploaded image bytes.
    app = c.application
    app.config["UPLOAD_FOLDER"] = str(tmp_path)
    dealer = login(c, "dealer@demo.com")
    body = {"make": "Toyota", "model": "Auris", "year": 2016, "price": 1250000,
            "fuel": "petrol", "transmission": "automatic", "body_type": "hatchback", "county": "Nairobi"}
    listing = c.post("/api/dealer/listings", headers=dealer, json=body)
    assert listing.status_code == 201, listing.json
    listing_id = listing.json["id"]

    image_bytes = BytesIO()
    Image.new("RGB", (640, 420), "#4b6542").save(image_bytes, format="JPEG")
    image_bytes.seek(0)
    uploaded = c.post(f"/api/dealer/listings/{listing_id}/images", headers=dealer,
                      data={"images": (image_bytes, "front.jpg")}, content_type="multipart/form-data")
    assert uploaded.status_code == 201, uploaded.json
    photo = uploaded.json["images"][0]
    assert photo["is_primary"] is True
    public_listing = c.get(f"/api/cars/{listing_id}").json
    assert public_listing["image_url"] == photo["url"]
    assert c.get(photo["url"]).status_code == 200

    # Another dealer cannot change or delete this listing's photos.
    other = login(c, "capitalautohub@dealers.demo")
    assert c.delete(f"/api/dealer/listings/{listing_id}/images/{photo['id']}", headers=other).status_code == 404
    assert c.delete(f"/api/dealer/listings/{listing_id}/images/{photo['id']}", headers=dealer).status_code == 200
    assert c.get(f"/api/cars/{listing_id}").json["image_url"] is None
