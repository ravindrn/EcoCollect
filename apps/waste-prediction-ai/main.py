
from pathlib import Path
from datetime import date

import joblib
import pandas as pd

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from forecasting import forecast_next_7_days
from monthly.pipeline import run_monthly_pipeline
from forecast_api import router as forecast_router
from monthly_trigger_api import router as monthly_trigger_router


# ==========================================
# 1. PROJECT CONFIGURATION
# ==========================================

BASE_DIR = Path(__file__).resolve().parent

OUTPUT_DIR = BASE_DIR / "results"

MODEL_PATH = (
    BASE_DIR / "models" / "random_forest_v1.joblib"
)

HISTORY_PATH = BASE_DIR / "data" / "history.csv"
CALENDAR_PATH = BASE_DIR / "data" / "calendar.csv"
MONTHLY_PATH = BASE_DIR / "data" / "monthly_loads.csv"


# ==========================================
# 2. CREATE FASTAPI APPLICATION
# ==========================================

app = FastAPI(
    title="Bope-Poddala Waste Prediction AI",
    version="1.0.0",
    description=(
        "Daily and monthly waste prediction "
        "API for Bope-Poddala."
    )
)


# ==========================================
# 3. CONFIGURE CORS
# ==========================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_methods=["GET"],
    allow_headers=["*"],
)


# ==========================================
# 4. REGISTER DATABASE API ROUTES
# ==========================================

app.include_router(forecast_router)
app.include_router(monthly_trigger_router)


# ==========================================
# 5. HOME ENDPOINT
# ==========================================

@app.get("/")
def home():
    return {
        "message": "Waste Prediction AI is running",
        "version": "1.0.0",
        "status": "prototype"
    }


# ==========================================
# 6. LEGACY DAILY CSV FORECAST ENDPOINT
# ==========================================

@app.get("/predict/next-7-days")
def predict(as_of_date: date):

    # Legacy prototype files are optional.
    # Database-backed APIs do not need these CSVs.
    if not HISTORY_PATH.is_file():
        raise HTTPException(
            status_code=404,
            detail="Prototype daily history CSV not found"
        )

    if not CALENDAR_PATH.is_file():
        raise HTTPException(
            status_code=404,
            detail="Prototype calendar CSV not found"
        )

    if not MODEL_PATH.is_file():
        raise HTTPException(
            status_code=503,
            detail="Daily prediction model not available"
        )

    try:
        # Load files only when this endpoint is called.
        model = joblib.load(MODEL_PATH)

        history = pd.read_csv(
            HISTORY_PATH,
            parse_dates=["date"]
        )

        calendar = pd.read_csv(
            CALENDAR_PATH,
            parse_dates=["date"]
        )

        if "day_of_week" not in calendar.columns:
            calendar["day_of_week"] = (
                calendar["date"].dt.day_of_week
            )

        result = forecast_next_7_days(
            model=model,
            history=history,
            calendar=calendar,
            as_of_date=as_of_date.isoformat()
        )

        OUTPUT_DIR.mkdir(
            parents=True,
            exist_ok=True
        )

        output_file = (
            OUTPUT_DIR /
            f"forecast_{as_of_date.isoformat()}.csv"
        )

        result.to_csv(
            output_file,
            index=False
        )

        predictions = []

        for _, row in result.iterrows():
            predictions.append({
                "date": pd.Timestamp(
                    row["date"]
                ).strftime("%Y-%m-%d"),
                "predicted_kg": float(
                    row["predicted_kg"]
                ),
                "working_day": int(
                    row["working_day"]
                )
            })

        return {
            "forecast_as_of": as_of_date.isoformat(),
            "model_version": "rf_v1",
            "data_source": "SYNTHETIC_PROTOTYPE",
            "saved_filename": output_file.name,
            "predictions": predictions
        }

    except (ValueError, KeyError) as error:
        raise HTTPException(
            status_code=400,
            detail=str(error)
        ) from error

    except (OSError, EOFError) as error:
        raise HTTPException(
            status_code=503,
            detail="Prototype prediction files are unreadable"
        ) from error


# ==========================================
# 7. LEGACY MONTHLY CSV FORECAST ENDPOINT
# ==========================================

@app.get("/predict/next-month-categories")
def predict_monthly_categories():

    if not MONTHLY_PATH.is_file():
        raise HTTPException(
            status_code=404,
            detail="Monthly collection dataset not found"
        )

    try:
        monthly_data = pd.read_csv(MONTHLY_PATH)

        result = run_monthly_pipeline(monthly_data)

        scores = result["scores"].to_dict(
            orient="records"
        )

        decisions = result["decisions"].to_dict(
            orient="records"
        )

        forecasts = result["forecast"].to_dict(
            orient="records"
        )

        return {
            "message": "Monthly waste forecast generated",
            "data_source": "COUNCIL_MONTHLY_RECORDS",
            "unit": "loads",
            "scores": scores,
            "selected_methods": decisions,
            "predictions": forecasts
        }

    except (ValueError, KeyError) as error:
        raise HTTPException(
            status_code=400,
            detail=str(error)
        ) from error

    except OSError as error:
        raise HTTPException(
            status_code=503,
            detail="Monthly collection dataset is unreadable"
        ) from error
