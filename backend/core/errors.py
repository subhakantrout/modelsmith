from fastapi import HTTPException

def error_response(status_code: int, detail: str) -> HTTPException:
    return HTTPException(status_code=status_code, detail=detail)

def not_found(msg: str = "Resource not found") -> HTTPException:
    return error_response(404, msg)

def bad_request(msg: str = "Bad request") -> HTTPException:
    return error_response(400, msg)

def server_error(msg: str = "Internal server error") -> HTTPException:
    return error_response(500, msg)
