"""Demo data (same as the original frontend mock). Run: flask --app run seed  (add --reset to wipe first)."""
import json
import re
from datetime import timedelta
from pathlib import Path

from .extensions import db
from .models import BuyerRequest, DealerProfile, Listing, Offer, Review, User, utcnow

PASSWORD = "demo1234"
PENDING = {"Kilimani Cars", "Mt Kenya Cars"}


def seed():
    now = utcnow()
    ago = lambda d: now - timedelta(days=d)
    ahead = lambda d: now + timedelta(days=d)
    cars = json.loads((Path(__file__).parent / "seed_cars.json").read_text())

    def pin(i):
        return "A" + str(100000000 + i * 7919317)[:9] + "Z"

    def user(id, email, name, role, county, phone="", days=30):
        u = User(id=id, email=email, full_name=name, role=role, county=county, phone=phone, created_at=ago(days))
        u.set_password(PASSWORD)
        db.session.add(u)
        return u

    def dealer(id, biz, county, status, email, phone):
        u = user(id, email, biz + " Sales", "dealer", county, phone, 60)
        u.dealer = DealerProfile(business_name=biz, kra_pin=pin(id), county=county, address=f"{county} town", status=status,
                                 verified_at=ago(50) if status == "approved" else None, created_at=ago(60))
        return u

    user(1, "buyer@demo.com", "Demo Buyer", "buyer", "Nairobi", "0712 345 678")
    dealer(2, "Prestige Motors", "Nairobi", "approved", "dealer@demo.com", "0722 000 111")
    user(3, "admin@demo.com", "Site Admin", "admin", "Nairobi", "", 90)
    for i, (n, c) in {20: ("Peter M.", "Nakuru"), 21: ("Grace A.", "Eldoret"), 22: ("Samuel K.", "Nairobi"),
                      23: ("Fatma S.", "Mombasa")}.items():
        user(i, f"buyer{i}@demo.test", n, "buyer", c, f"0700 000 0{i}", 40)

    dealer_ids, nid = {"Prestige Motors": 2}, 10
    for name in dict.fromkeys(c["dealer"] for c in cars):
        if name == "Prestige Motors":
            continue
        county = next(c["county"] for c in cars if c["dealer"] == name)
        dealer_ids[name] = nid
        slug = re.sub(r"[^a-z]+", "", name.lower())
        dealer(nid, name, county, "pending" if name in PENDING else "approved", f"{slug}@dealers.demo", f"0733 000 0{nid}")
        nid += 1
    dealer(40, "Savannah Wheels", "Nakuru", "pending", "savannah@dealers.demo", "0744 000 040")
    dealer(41, "Karen Auto Gallery", "Nairobi", "pending", "karen@dealers.demo", "0744 000 041")

    for c in cars:
        db.session.add(Listing(
            id=c["id"], owner_id=dealer_ids[c["dealer"]], make=c["make"], model=c["model"], year=c["year"], price=c["price"],
            mileage_km=c["mileage_km"], fuel=c["fuel"], transmission=c["transmission"], body_type=c["body_type"],
            color=c["color"], county=c["county"], status="active", created_at=ago(c["id"]),
            description=f"{c['year']} {c['make']} {c['model']} in excellent condition. Full service history, "
                        f"one careful owner, ready for viewing in {c['county']}."))

    R = lambda id, b, mk, md, yr, price, fuel, body, county, notes, created, exp: db.session.add(BuyerRequest(
        id=id, buyer_id=b, make=mk, model=md, min_year=yr, max_price=price, fuel=fuel, body_type=body, county=county,
        notes=notes, status="open", created_at=ago(created), expires_at=ahead(exp)))
    R(1, 1, "Toyota", "Harrier", 2016, 3800000, "petrol", "suv", "Nairobi", "Pearl white or black preferred, low mileage please.", 3, 27)
    R(2, 1, "Honda", "Fit", 2015, 1500000, "hybrid", "hatchback", "Nairobi", "", 1, 13)
    R(3, 20, "Subaru", "Forester", 2014, 2500000, "petrol", "suv", "Nakuru", "Need good ground clearance for farm roads.", 2, 28)
    R(4, 21, "Isuzu", "D-Max", 2017, 4500000, "diesel", "pickup", "Eldoret", "", 4, 10)
    R(5, 22, "", "", 2015, 5000000, "", "suv", "Nairobi", "Open to any reliable SUV, family of five.", 1, 29)
    R(6, 23, "Toyota", "Noah", 2014, 2000000, "petrol", "van", "Mombasa", "", 5, 9)

    cap, coast = dealer_ids.get("Capital Auto Hub", 2), dealer_ids.get("Coast Motors", 2)
    db.session.add_all([
        Offer(id=1, request_id=1, dealer_id=cap, listing_id=2, price=3620000, status="pending", created_at=ago(2),
              message="Pearl white, one owner, full Toyota service history. Viewing available any day this week."),
        Offer(id=2, request_id=1, dealer_id=coast, listing_id=None, price=3590000, status="pending", created_at=ago(1),
              message="We can source a 2017 Harrier Premium from our Mombasa yard and deliver to Nairobi at no extra cost."),
        Offer(id=3, request_id=5, dealer_id=2, listing_id=13, price=4150000, status="pending", created_at=ago(1),
              message="BMW X3 xDrive20d, 69,000 km, fully serviced. Happy to arrange a test drive."),
    ])
    db.session.add_all([
        Review(reviewer_id=20, dealer_id=cap, rating=5, comment="Smooth purchase.", created_at=ago(20)),
        Review(reviewer_id=21, dealer_id=cap, rating=4, comment="Fair price.", created_at=ago(15)),
        Review(reviewer_id=22, dealer_id=2, rating=5, comment="Great service.", created_at=ago(12)),
    ])
    db.session.commit()


def reset_and_seed():
    db.drop_all()
    db.create_all()
    seed()
