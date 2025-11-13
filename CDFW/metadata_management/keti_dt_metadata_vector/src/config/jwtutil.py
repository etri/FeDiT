# jwtutil.py
import os
import time
import json
import requests
from flask import request, jsonify
from authlib.jose import JsonWebEncryption
from config.settings import OAUTH_PUBLIC_KEY_URL

JWE = JsonWebEncryption()

_cached_public_key = None

def get_public_key():
    global _cached_public_key
    if _cached_public_key is None:
        response = requests.get(OAUTH_PUBLIC_KEY_URL)
        response.raise_for_status()
        _cached_public_key = response.json().get("publickey")
        _cached_public_key = _cached_public_key.replace("-----BEGIN PUBLIC KEY-----", "")\
            .replace("-----END PUBLIC KEY-----", "")\
            .replace("\r\n", "")\
            .replace("\n", "")\
            .replace("\r", "")\
            .replace("/", "_").replace("+", "-")
    return _cached_public_key

def get_jwt_payload():
    """
    Authorization 헤더에서 Bearer 토큰을 추출하고 JWT JWE 복호화 수행
    반환: (payload, None, None) 또는 (None, error_response, status_code)
    """
    auth_header = request.headers.get("Authorization", "")
    token = auth_header.replace("Bearer", "").strip()

    if not token:
        return None, jsonify({"error": "Missing token"}), 401

    try:
        public_key = get_public_key()
        result = JWE.deserialize_compact(token, public_key)
        payload = result['payload']

        if isinstance(payload, str):
            payload = json.loads(payload)

        now = int(time.time())
        exp = payload.get("exp")
        nbf = payload.get("nbf")

        if exp is not None and now >= exp:
            return None, jsonify({"error": "Token expired"}), 401
        if nbf is not None and now < nbf:
            return None, jsonify({"error": "Token not yet valid"}), 401

        return payload, None, None
    except Exception as e:
        print(f"JWE 복호화 실패: {e}")
        return None, jsonify({"error": "Token decryption failed"}), 401