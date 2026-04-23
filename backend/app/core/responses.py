from fastapi import HTTPException


def success_response(message: str, data):
    return {"success": True, "message": message, "data": data}


def error_response(status_code: int, message: str, errors=None):
    raise HTTPException(
        status_code=status_code,
        detail={"success": False, "message": message, "errors": errors or {}},
    )
