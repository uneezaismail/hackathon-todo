from jose import jwt
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

load_dotenv()
secret = os.getenv("BETTER_AUTH_SECRET")

# Create a fake user "test-user-123"
token = jwt.encode({
    "sub": "test-user-123",
    "exp": datetime.utcnow() + timedelta(days=7),
    "iat": datetime.utcnow()
}, secret, algorithm="HS256")
   
print(f"Bearer {token}")