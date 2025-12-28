from app import create_app, db
from app.models import User
from werkzeug.security import generate_password_hash

app = create_app()

with app.app_context():
    # Check for admin user
    user = User.query.filter_by(email='admin@example.com').first()
    
    if user:
        print(f"User found: {user.email}")
        print(f"Role: {user.role}")
        # Reset password to be sure
        user.password_hash = generate_password_hash('admin123')
        db.session.commit()
        print("Password reset to: admin123")
    else:
        print("User admin@example.com NOT found.")
        # Create it if missing
        new_admin = User(
            email='admin@example.com',
            full_name='Administrador',
            role='admin',
            password_hash=generate_password_hash('admin123')
        )
        db.session.add(new_admin)
        db.session.commit()
        print("Admin user created with password: admin123")
