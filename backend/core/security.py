import os
import secrets
import re

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

ALLOWED_ROOT = os.path.abspath(PROJECT_ROOT)

ALLOWED_PREFIXES = [
    ALLOWED_ROOT,
    os.path.expanduser("~"),
    "/tmp",
]

def is_safe_path(path: str) -> bool:
    resolved = os.path.abspath(os.path.normpath(os.path.expanduser(path)))
    for prefix in ALLOWED_PREFIXES:
        if resolved.startswith(prefix):
            return True
    return False

def resolve_model_path(path: str) -> str:
    resolved = os.path.abspath(os.path.normpath(os.path.expanduser(path)))
    if not is_safe_path(resolved):
        raise ValueError(f"Access denied: path outside allowed directories: {resolved}")
    return resolved

def validate_path_exists(path: str) -> str:
    resolved = resolve_model_path(path)
    if not os.path.exists(resolved):
        raise FileNotFoundError(f"Path not found: {resolved}")
    return resolved

def is_safe_model_path(path: str) -> bool:
    return bool(re.match(r'^[a-zA-Z0-9_./\-\s:]+$', path))

SAFE_MODEL_PATH_RE = re.compile(r'^[a-zA-Z0-9_./\-\s:]+$')

def sanitize_model_path(path: str) -> str:
    if not SAFE_MODEL_PATH_RE.match(path):
        raise ValueError(f"Invalid model path: contains disallowed characters")
    return path

_api_key: str | None = None

def get_api_key() -> str:
    global _api_key
    if _api_key is None:
        _api_key = os.environ.get("MODELSMITH_API_KEY") or secrets.token_urlsafe(32)
    return _api_key

def validate_api_key(key: str) -> bool:
    if not key:
        return False
    return secrets.compare_digest(key, get_api_key())

SAFE_ARG_RE = re.compile(r'^[a-zA-Z0-9_./\-\s,:=@]+$')

def validate_subprocess_arg(arg: str) -> str:
    if not SAFE_ARG_RE.match(arg):
        raise ValueError(f"Unsafe subprocess argument: contains disallowed characters")
    return arg
