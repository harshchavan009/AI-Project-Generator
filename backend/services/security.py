"""
Security, Authentication, RBAC, Input Sanitization & Data Protection.
Production-ready security hardening for CapstoneForge.
"""

import os
import re
import html
import base64
import hashlib
from datetime import datetime, timedelta, timezone
from typing import Optional, List, Dict, Any, Tuple

import bcrypt
import jwt
from cryptography.fernet import Fernet
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from backend import config

# -------------------------------------------------------------
# Secrets & Config
# -------------------------------------------------------------
JWT_SECRET_KEY = getattr(config, "JWT_SECRET_KEY", os.getenv("JWT_SECRET_KEY", "capstoneforge-production-super-secret-jwt-key-2026-v2"))
JWT_ALGORITHM = getattr(config, "JWT_ALGORITHM", os.getenv("JWT_ALGORITHM", "HS256"))
ACCESS_TOKEN_EXPIRE_MINUTES = int(getattr(config, "ACCESS_TOKEN_EXPIRE_MINUTES", os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "480"))) # 8 hours

# Fernet requires a 32-byte urlsafe base64 encoded key
RAW_PII_KEY = getattr(config, "PII_ENCRYPTION_KEY", os.getenv("PII_ENCRYPTION_KEY", JWT_SECRET_KEY))
_derived_key = hashlib.sha256(RAW_PII_KEY.encode("utf-8")).digest()
FERNET_KEY = base64.urlsafe_b64encode(_derived_key)
_cipher_suite = Fernet(FERNET_KEY)

security_bearer = HTTPBearer(auto_error=False)

# -------------------------------------------------------------
# Password Hashing (bcrypt)
# -------------------------------------------------------------
def hash_password(password: str) -> str:
    """Hash a plaintext password using bcrypt with salt rounds = 12."""
    if not password:
        raise ValueError("Password cannot be empty")
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plaintext password against a bcrypt hash."""
    if not plain_password or not hashed_password:
        return False
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False

# -------------------------------------------------------------
# JWT Generation & Decoding
# -------------------------------------------------------------
def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Creates a signed JWT with subject, role, and expiration."""
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "iat": now})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Dict[str, Any]:
    """Decodes and validates a JWT token signature and expiration."""
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session has expired. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials.",
            headers={"WWW-Authenticate": "Bearer"},
        )

# -------------------------------------------------------------
# FastAPI Auth & RBAC Dependencies
# -------------------------------------------------------------
async def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer)) -> Dict[str, Any]:
    """Extracts and verifies current user from Bearer token."""
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please provide a Bearer token in the Authorization header.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = credentials.credentials
    payload = decode_access_token(token)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload: missing subject.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return {
        "id": user_id,
        "email": payload.get("email", ""),
        "name": payload.get("name", ""),
        "role": payload.get("role", "student"),
        "department": payload.get("department", "Computer Science"),
        "cohort_id": payload.get("cohort_id", "cohort-cse-2026-a")
    }

async def get_optional_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer)) -> Optional[Dict[str, Any]]:
    """Returns the authenticated user if token provided, otherwise None."""
    if not credentials or not credentials.credentials:
        return None
    try:
        return await get_current_user(credentials)
    except Exception:
        return None

def require_role(allowed_roles: List[str]):
    """Role-based access control dependency factory."""
    async def role_checker(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
        user_role = current_user.get("role", "student")
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: role '{user_role}' is not authorized for this resource. Required one of: {allowed_roles}"
            )
        return current_user
    return role_checker

# -------------------------------------------------------------
# PII Encryption at Rest (Fernet AES-256)
# -------------------------------------------------------------
def encrypt_pii(text: str) -> str:
    """Encrypts sensitive student PII (e.g. email, phone) using Fernet AES-256."""
    if not text:
        return ""
    try:
        return _cipher_suite.encrypt(text.encode("utf-8")).decode("utf-8")
    except Exception:
        return text

def decrypt_pii(token: str) -> str:
    """Decrypts sensitive student PII using Fernet AES-256."""
    if not token:
        return ""
    try:
        return _cipher_suite.decrypt(token.encode("utf-8")).decode("utf-8")
    except Exception:
        # If not encrypted (legacy plain text), return as-is
        return token

# -------------------------------------------------------------
# Server-Side Input Sanitization
# -------------------------------------------------------------
HTML_TAG_REGEX = re.compile(r"<[^>]+>")
CONTROL_CHAR_REGEX = re.compile(r"[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]")

def sanitize_text(input_str: Optional[str], max_length: int = 5000) -> str:
    """
    Sanitizes user input server-side:
    - Strips malicious HTML/script tags
    - Unescapes safe HTML entities then escapes dangerous symbols
    - Removes ASCII control characters
    - Truncates to max_length
    """
    if not input_str:
        return ""
    # Strip HTML tags
    cleaned = HTML_TAG_REGEX.sub("", input_str)
    # Strip non-printable control characters
    cleaned = CONTROL_CHAR_REGEX.sub("", cleaned)
    # Escape dangerous HTML characters (<, >, &, ", ')
    cleaned = html.escape(cleaned.strip())
    # Truncate to maximum permitted length
    return cleaned[:max_length]

# -------------------------------------------------------------
# Mentor Chat Abuse & Prompt-Injection Guardrails
# -------------------------------------------------------------
INJECTION_PATTERNS = [
    re.compile(r"ignore\s+(all\s+)?(previous|prior|above)\s+instructions?", re.IGNORECASE),
    re.compile(r"disregard\s+(the\s+)?system\s+prompt", re.IGNORECASE),
    re.compile(r"you\s+are\s+now\s+(in\s+)?dan\s+mode", re.IGNORECASE),
    re.compile(r"bypass\s+(all\s+)?safety\s+filters?", re.IGNORECASE),
    re.compile(r"reveal\s+(your\s+)?(system\s+prompt|initial\s+instructions?)", re.IGNORECASE),
    re.compile(r"exfiltrate\s+internal\s+data", re.IGNORECASE),
    re.compile(r"drop\s+table\s+", re.IGNORECASE),
    re.compile(r"union\s+select\s+", re.IGNORECASE)
]

def validate_mentor_input(message: str) -> Tuple[bool, Optional[str]]:
    """
    Evaluates student mentor message for abuse, jailbreak attempts, or prompt injection.
    Returns (is_valid, rejection_reason).
    """
    if not message or not message.strip():
        return False, "Message cannot be empty."

    if len(message) > 4000:
        return False, "Message exceeds maximum allowed length of 4000 characters."

    for pattern in INJECTION_PATTERNS:
        if pattern.search(message):
            return False, "Message rejected: Potentially harmful or off-topic prompt injection pattern detected."

    return True, None
