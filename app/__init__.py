from datetime import datetime
from flask import Flask, render_template, request, session
from .config import Config
from .services.db import init_global_db, global_db


def create_app():
    app = Flask(__name__, template_folder="templates", static_folder="../static")
    app.config.from_object(Config)

    init_global_db(app.config)

    @app.context_processor
    def inject_globals():
        ctx = {
            "now": datetime.utcnow(),
            "config": app.config,
            "request": request,
        }
        # Inject nav badge counts only for admin pages (avoids DB hit on every public page)
        if session.get("role") == "admin" and request.path.startswith("/admin"):
            try:
                with global_db(app.config) as db:
                    ctx["nav_pending_orders"]      = db.execute(
                        "SELECT COUNT(*) as c FROM orders WHERE status='pending'"
                    ).fetchone()["c"]
                    ctx["nav_pending_withdrawals"] = db.execute(
                        "SELECT COUNT(*) as c FROM wallet_withdrawals WHERE status='pending'"
                    ).fetchone()["c"]
            except Exception:
                ctx["nav_pending_orders"]      = 0
                ctx["nav_pending_withdrawals"] = 0
        else:
            ctx["nav_pending_orders"]      = 0
            ctx["nav_pending_withdrawals"] = 0
        return ctx

    @app.errorhandler(404)
    def not_found(e):
        return render_template("public/404.html"), 404

    @app.errorhandler(500)
    def server_error(e):
        return render_template("public/404.html"), 500

    # Register blueprints
    from .routes.public import public_bp
    from .routes.auth import auth_bp
    from .routes.reseller import reseller_bp
    from .routes.admin import admin_bp
    from .routes.webhook import webhook_bp

    app.register_blueprint(public_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(reseller_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(webhook_bp)

    return app
