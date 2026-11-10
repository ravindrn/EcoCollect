
import os
import secrets
import logging

from dotenv import load_dotenv
from fastapi import APIRouter, Header, HTTPException
from starlette.concurrency import run_in_threadpool

from save_monthly_forecast import run_monthly_forecast_job


load_dotenv()

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/internal/forecasts",
    tags=["Internal Forecast Jobs"]
)


@router.post("/monthly/refresh")
async def refresh_monthly_forecast(
    x_internal_api_key: str | None = Header(default=None)
):
    """
    Trigger monthly forecasting after the Admin
    confirms monthly collection data.

    This endpoint must only be called by the
    trusted TypeScript backend.
    """

    expected_key = os.getenv("INTERNAL_API_KEY")

    if not expected_key:
        raise HTTPException(
            status_code=503,
            detail="Internal API key is not configured"
        )

    if (
        not x_internal_api_key
        or not secrets.compare_digest(
            x_internal_api_key,
            expected_key
        )
    ):
        raise HTTPException(
            status_code=401,
            detail="Unauthorized"
        )

    try:
        result = await run_in_threadpool(
            run_monthly_forecast_job
        )

    except ValueError as error:
        logger.warning(
            "Monthly forecasting validation failed: %s",
            error
        )
        raise HTTPException(
            status_code=422,
            detail=str(error)
        ) from error

    except Exception:
        logger.exception(
            "Monthly forecasting execution failed"
        )
        raise HTTPException(
            status_code=500,
            detail="Monthly forecasting failed"
        )

    return {
        "message": "Monthly forecasting completed",
        "run_id": result["run_id"],
        "created": result["created"],
        "forecast_month": result["forecast_month"]
    }
