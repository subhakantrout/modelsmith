import os

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
