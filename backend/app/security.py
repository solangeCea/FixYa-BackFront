import hashlib
from passlib.context import CryptContext

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)

def normalize_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def hash_password(password: str):
    return pwd_context.hash(normalize_password(password))

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(
        normalize_password(plain_password),
        hashed_password
    )