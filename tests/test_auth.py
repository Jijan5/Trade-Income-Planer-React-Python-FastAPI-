import os
import pytest
from datetime import datetime, timedelta
from unittest.mock import patch, MagicMock

# Set environment variables before imports
os.environ["SECRET_KEY"] = "test-secret-key-for-testing"

# Now import the module to test
from backend.app.auth import (
    verify_password,
    get_password_hash,
    create_access_token,
    decode_access_token
)


class TestPasswordHashing:
    """Test password hashing and verification functions."""

    def test_get_password_hash(self):
        """Test that password hashing returns a valid bcrypt hash."""
        password = "testpassword123"
        hashed = get_password_hash(password)
        
        # Should return a string
        assert isinstance(hashed, str)
        # Should be a valid bcrypt hash (starts with $2)
        assert hashed.startswith('$2')

    def test_verify_password_correct(self):
        """Test password verification with correct password."""
        password = "testpassword123"
        hashed = get_password_hash(password)
        
        result = verify_password(password, hashed)
        assert result is True

    def test_verify_password_incorrect(self):
        """Test password verification with incorrect password."""
        password = "testpassword123"
        wrong_password = "wrongpassword"
        hashed = get_password_hash(password)
        
        result = verify_password(wrong_password, hashed)
        assert result is False

    def test_verify_password_empty(self):
        """Test password verification with empty password."""
        password = "testpassword123"
        hashed = get_password_hash(password)
        
        result = verify_password("", hashed)
        assert result is False


class TestJWTToken:
    """Test JWT token creation and decoding."""

    def test_create_access_token_default_expiry(self):
        """Test token creation with default expiry (15 minutes)."""
        data = {"sub": "testuser", "tenant_id": 1}
        token = create_access_token(data)
        
        assert isinstance(token, str)
        assert len(token) > 0

    def test_create_access_token_custom_expiry(self):
        """Test token creation with custom expiry."""
        data = {"sub": "testuser", "tenant_id": 1}
        expires_delta = timedelta(hours=1)
        token = create_access_token(data, expires_delta)
        
        assert isinstance(token, str)
        assert len(token) > 0

    def test_decode_access_token_valid(self):
        """Test decoding a valid token."""
        data = {"sub": "testuser", "tenant_id": 1}
        token = create_access_token(data)
        
        decoded = decode_access_token(token)
        
        assert decoded is not None
        assert decoded["sub"] == "testuser"
        assert decoded["tenant_id"] == 1
        assert "exp" in decoded

    def test_decode_access_token_invalid(self):
        """Test decoding an invalid token."""
        result = decode_access_token("invalid.token.here")
        assert result is None

    def test_decode_access_token_empty(self):
        """Test decoding an empty token."""
        result = decode_access_token("")
        assert result is None

    def test_token_contains_expiry(self):
        """Test that token contains expiry time."""
        data = {"sub": "testuser"}
        expires_delta = timedelta(hours=1)
        token = create_access_token(data, expires_delta)
        
        decoded = decode_access_token(token)
        
        assert "exp" in decoded
        # Expiry should be in the future
        exp_time = datetime.fromtimestamp(decoded["exp"])
        assert exp_time > datetime.utcnow()


class TestAuthIntegration:
    """Integration tests for auth module."""

    def test_hash_and_verify_roundtrip(self):
        """Test that hashing and verifying works in roundtrip."""
        original_password = "MySecureP@ssw0rd!2024"
        
        hashed = get_password_hash(original_password)
        verified = verify_password(original_password, hashed)
        
        assert verified is True

    def test_different_passwords_different_hashes(self):
        """Test that different passwords produce different hashes."""
        password1 = "password1"
        password2 = "password2"
        
        hash1 = get_password_hash(password1)
        hash2 = get_password_hash(password2)
        
        # Hashes should be different (due to random salt)
        assert hash1 != hash2
        
        # But verification should work correctly
        assert verify_password(password1, hash1) is True
        assert verify_password(password2, hash2) is True
        assert verify_password(password1, hash2) is False
        assert verify_password(password2, hash1) is False
