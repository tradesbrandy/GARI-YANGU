import os
from pathlib import Path

from dotenv import load_dotenv
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.exceptions import HTTPException

from .auth import ApiError
from .extensions import db

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

DIST = Path(__file__).resolve().parents[2] / "frontend" / "dist"


def create_app(overrides=None):
    from .config import Config

    app = Flask(__name__, static_folder=None)
    app.config.from_object(Config)
    app.config.update(overrides or {})

    db.init_app(app)
    CORS(app, resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}})

    from .routes import admin, auth, buyer, cars, dealer
    for m in (auth, cars, buyer, dealer, admin):
        app.register_blueprint(m.bp)

    @app.get("/uploads/<path:filename>")
    def uploaded_file(filename):
        return send_from_directory(app.config["UPLOAD_FOLDER"], filename, max_age=3600)

    @app.get("/api/health")
    def health():
        return jsonify(status="ok")

    @app.errorhandler(ApiError)
    def api_error(e):
        return jsonify(error=e.message), e.status

    @app.errorhandler(HTTPException)
    def http_error(e):
        return jsonify(error=e.description), e.code

    @app.errorhandler(Exception)
    def unhandled(e):
        app.logger.exception(e)
        db.session.rollback()
        return jsonify(error="Something went wrong on the server."), 500

    # Optional single-process deploy: if `npm run build` has been run, serve the SPA too.
    if DIST.is_dir():
        @app.get("/", defaults={"path": ""})
        @app.get("/<path:path>")
        def spa(path):
            if path.startswith("api/"):
                return jsonify(error="Not found."), 404
            f = DIST / path
            return send_from_directory(DIST, path if path and f.is_file() else "index.html")

    with app.app_context():
        db.create_all()
        from .models import User
        if not app.config.get("TESTING") and User.query.count() == 0:
            from .seed import seed
            seed()  # first run: load demo data so the app isn't empty

    @app.cli.command("seed")
    def seed_cmd():
        """Wipe the database and load demo data."""
        from .seed import reset_and_seed
        reset_and_seed()
        print("Database reset and seeded.")

    return app
