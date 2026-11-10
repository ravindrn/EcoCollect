
from datetime import date, datetime
from zoneinfo import ZoneInfo
from pathlib import Path

import joblib
import numpy as np
import pandas as pd

from sqlalchemy import text

from database import get_engine
from forecasting import forecast_next_7_days
from config import APP_MODE, MAX_MISSING_WORKING_DAYS
from freshness import check_history_freshness

# ==========================================
# CONFIGURATION
# ==========================================

BASE_DIR = Path(__file__).resolve().parent

MODEL_PATH = BASE_DIR / "models" / "random_forest_v1.joblib"
MODEL_VERSION = "rf_v1"

TIMEZONE = ZoneInfo("Asia/Colombo")

DATA_SOURCE = "SYNTHETIC_PROTOTYPE"


# ==========================================
# 1. GET CURRENT SRI LANKAN DATE
# ==========================================

def get_forecast_date():

    return datetime.now(
        TIMEZONE
    ).date()


# ==========================================
# 2. READ DATABASE DATA
# ==========================================

def load_forecasting_data(engine):

    with engine.connect() as connection:

        history = pd.read_sql(
            text("""
                SELECT date, collected_kg
                FROM daily_collection_history
                ORDER BY date
            """),
            connection,
            parse_dates=["date"]
        )

        calendar = pd.read_sql(
            text("""
                SELECT date, working_day
                FROM collection_calendar
                ORDER BY date
            """),
            connection,
            parse_dates=["date"]
        )

    if history.empty:
        raise ValueError(
            "Daily history is empty"
        )

    if calendar.empty:
        raise ValueError(
            "Collection calendar is empty"
        )

    # Generate feature required by Random Forest
    calendar["day_of_week"] = (
        calendar["date"].dt.day_of_week
    )

    return history, calendar


# ==========================================
# 3. GENERATE RANDOM FOREST FORECAST
# ==========================================

def generate_forecast(history, calendar, as_of_date):

    # Load trusted local model
    model = joblib.load(MODEL_PATH)

    predictions = forecast_next_7_days(
        model=model,
        history=history,
        calendar=calendar,
        as_of_date=as_of_date.isoformat()
    )

    # Check returned data type
    if not isinstance(predictions, pd.DataFrame):
        raise ValueError(
            "Forecast must be a Pandas DataFrame"
        )

    # Must predict exactly seven days
    if len(predictions) != 7:
        raise ValueError(
            "Expected exactly seven predictions"
        )

    required_columns = {
        "date",
        "predicted_kg",
        "working_day"
    }

    missing_columns = (
        required_columns - set(predictions.columns)
    )

    if missing_columns:
        raise ValueError(
            f"Missing forecast columns: {missing_columns}"
        )

    # Convert forecast values to numeric
    values = predictions["predicted_kg"].to_numpy(
        dtype=float
    )

    if not np.isfinite(values).all():
        raise ValueError(
            "Invalid forecast values"
        )

    if (values < 0).any():
        raise ValueError(
            "Negative forecast detected"
        )

    # Check duplicate prediction dates
    if predictions["date"].duplicated().any():
        raise ValueError(
            "Duplicate forecast dates"
        )

    # Validate working_day values
    if not predictions["working_day"].isin([0, 1]).all():
        raise ValueError(
            "Invalid working_day values"
        )

    # Non-working days must have zero predictions
    non_working = predictions[
        predictions["working_day"] == 0
    ]

    if (non_working["predicted_kg"] != 0).any():
        raise ValueError(
            "Non-working day has nonzero prediction"
        )

    return predictions


# ==========================================
# 4. SAVE FORECAST TO POSTGRESQL
# ==========================================

def save_predictions(
    engine,
    predictions,
    as_of_date
):

    # All database operations happen in one transaction
    with engine.begin() as connection:

        # Lock this forecast date and model version.
        # Prevent concurrent instances of this script
        # from inserting duplicate completed runs.
        forecast_key = (
            f"daily:{as_of_date.isoformat()}:{MODEL_VERSION}"
        )

        connection.execute(
            text("""
                SELECT pg_advisory_xact_lock(
                    hashtextextended(
                        CAST(:forecast_key AS text),
                        0
                    )
                )
            """),
            {
                "forecast_key": forecast_key
            }
        )

        # Check if this forecast already exists
        existing_run_id = connection.execute(
            text("""
                SELECT id
                FROM forecast_runs
                WHERE forecast_as_of = :forecast_as_of
                  AND model_version = :model_version
                  AND status = 'completed'
                ORDER BY id DESC
                LIMIT 1
            """),
            {
                "forecast_as_of": as_of_date,
                "model_version": MODEL_VERSION
            }
        ).scalar_one_or_none()

        if existing_run_id is not None:

            print(
                "\nForecast already exists."
            )

            print(
                "Using existing run ID:",
                existing_run_id
            )

            return existing_run_id, False

        # Create a new forecast run
        result = connection.execute(
            text("""
                INSERT INTO forecast_runs (
                    forecast_as_of,
                    model_version,
                    data_source,
                    status
                )
                VALUES (
                    :forecast_as_of,
                    :model_version,
                    :data_source,
                    'completed'
                )
                RETURNING id
            """),
            {
                "forecast_as_of": as_of_date,
                "model_version": MODEL_VERSION,
                "data_source": DATA_SOURCE
            }
        )

        run_id = result.scalar_one()

        # Save the seven predicted days
        for _, row in predictions.iterrows():

            target_date = pd.Timestamp(
                row["date"]
            ).date()

            connection.execute(
                text("""
                    INSERT INTO waste_predictions (
                        run_id,
                        target_date,
                        predicted_kg,
                        working_day,
                        unit
                    )
                    VALUES (
                        :run_id,
                        :target_date,
                        :predicted_kg,
                        :working_day,
                        'kg'
                    )
                """),
                {
                    "run_id": int(run_id),
                    "target_date": target_date,
                    "predicted_kg": float(
                        row["predicted_kg"]
                    ),
                    "working_day": int(
                        row["working_day"]
                    )
                }
            )

    return run_id, True


# ==========================================
# 5. COMPLETE FORECAST WORKFLOW
# ==========================================


def main():

    # ==========================================
    # 1. GET CURRENT DATE
    # ==========================================

    as_of_date = get_forecast_date()

    print("\n======================================")
    print("WASTE PREDICTION AI")
    print("======================================")

    print("Forecast as of:", as_of_date.isoformat())
    print("Application mode:", APP_MODE)

    # ==========================================
    # 2. CONNECT TO POSTGRESQL
    # ==========================================

    print("\nConnecting to PostgreSQL...")

    engine = get_engine()

    try:

        # ==========================================
        # 3. LOAD HISTORICAL DATA
        # ==========================================

        history, calendar = load_forecasting_data(
            engine
        )

        print("\nDATABASE RECORDS")
        print("Daily records:", len(history))
        print("Calendar records:", len(calendar))

        # ==========================================
        # 4. CHECK HISTORY AGE
        # ==========================================

        latest_history_date = (
            history["date"].max().date()
        )

        history_age_days = (
            as_of_date - latest_history_date
        ).days

        print("\nHISTORY INFORMATION")
        print("Latest history date:", latest_history_date)
        print("History age:", history_age_days, "days")

        if history_age_days < 0:
            raise ValueError(
                "Historical data contains dates "
                "after the forecast reference date"
            )

        # ==========================================
        # 5. CHECK HISTORY FRESHNESS
        # ==========================================

        freshness = check_history_freshness(
            history=history,
            calendar=calendar,
            as_of_date=as_of_date,
            max_missing_working_days=MAX_MISSING_WORKING_DAYS
        )

        print("\nHISTORY FRESHNESS RESULT")
        print(
            "Last history date:",
            freshness["last_history_date"]
        )
        print(
            "Forecast as of:",
            freshness["forecast_as_of"]
        )
        print(
            "Missed working days:",
            freshness["missed_working_days"]
        )
        print(
            "Is history fresh:",
            freshness["is_fresh"]
        )

        # ==========================================
        # 6. APPLY MODE-SPECIFIC RULES
        # ==========================================

        print("\nAPPLICATION MODE:", APP_MODE)

        if APP_MODE == "production":

            # Production mode is intentionally blocked
            # until verified actual-data filtering is ready.
            if not freshness["is_fresh"]:
                raise ValueError(
                    "PRODUCTION FORECAST BLOCKED: "
                    "Historical data is stale. "
                    f"Missing {freshness['missed_working_days']} "
                    "scheduled collection days."
                )

            raise RuntimeError(
                "PRODUCTION FORECAST BLOCKED: "
                "Verified actual-data filtering and "
                "validation are not implemented yet."
            )

        elif APP_MODE == "prototype":

            print(
                "Prototype mode enabled."
            )

            if not freshness["is_fresh"]:
                print(
                    "\nWARNING: Prototype forecast uses "
                    "stale historical data."
                )

                print(
                    "Missing scheduled collection days:",
                    freshness["missed_working_days"]
                )

                print(
                    "Predictions may depend on recursively "
                    "generated historical estimates."
                )

            else:
                print(
                    "Historical data freshness check passed."
                )

            print(
                "WARNING: Daily forecasting currently "
                "uses synthetic historical data."
            )

        else:
            raise ValueError(
                f"Unsupported application mode: {APP_MODE}"
            )

        # ==========================================
        # 7. GENERATE RANDOM FOREST FORECAST
        # ==========================================

        print("\nGenerating seven-day forecast...")

        predictions = generate_forecast(
            history,
            calendar,
            as_of_date
        )

        print("\nAI FORECAST GENERATED")

        print(
            predictions.to_string(
                index=False
            )
        )

        # ==========================================
        # 8. SAVE FORECAST TO POSTGRESQL
        # ==========================================

        print("\nSaving forecast to PostgreSQL...")

        run_id, created = save_predictions(
            engine,
            predictions,
            as_of_date
        )

        # ==========================================
        # 9. DISPLAY FINAL RESULT
        # ==========================================

        print("\n======================================")

        if created:
            print(
                "PASS: NEW FORECAST SAVED TO POSTGRESQL"
            )
        else:
            print(
                "PASS: EXISTING FORECAST REUSED"
            )

        print("======================================")

        print("Forecast run ID:", run_id)
        print("Forecast as of:", as_of_date.isoformat())

        print(
            "Forecast contains:",
            len(predictions),
            "predicted days"
        )

        print(
            "Total predicted waste:",
            round(
                predictions["predicted_kg"].sum(),
                2
            ),
            "kg"
        )

        print("Application mode:", APP_MODE)

        print(
            "History fresh:",
            freshness["is_fresh"]
        )

    finally:
        # ==========================================
        # 10. RELEASE DATABASE RESOURCES
        # ==========================================

        engine.dispose()



# ==========================================
# RUN APPLICATION
# ==========================================

if __name__ == "__main__":
    main()
