from app import create_app, db
from app.models import User

app = create_app()

with app.app_context():
    user = User.query.filter_by(email='admin@example.com').first()
    if user:
        print(f"Updating user: {user.email}")
        user.subscription_status = 'active'
        user.monthly_token_limit = 1000000  # Unlimited basically
        user.current_month_tokens = 0
        db.session.commit()
        print("✓ Subscription activated and tokens refreshed.")
    else:
        print("User not found!")
