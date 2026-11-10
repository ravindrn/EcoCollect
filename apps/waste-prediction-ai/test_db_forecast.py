
import joblib
import numpy as np
import pandas as pd

from database import get_engine
from forecasting import forecast_next_7_days


# ==========================================
# MAIN FUNCTION
# ==========================================

def main():

    # ==========================================
    # STEP 1: CONNECT TO POSTGRESQL
    # ==========================================

    print("\nConnecting to PostgreSQL...")

    engine = get_engine()

    try:

        # ==========================================
        # STEP 2: READ HISTORICAL WASTE DATA
        # ==========================================

        history = pd.read_sql(
            """
            SELECT date, collected_kg
            FROM daily_collection_history
            ORDER BY date
            """,
            engine,
            parse_dates=["date"]
        )

        # ==========================================
        # STEP 3: READ COLLECTION CALENDAR
        # ==========================================

        calendar = pd.read_sql(
            """
            SELECT date, working_day
            FROM collection_calendar
            ORDER BY date
            """,
            engine,
            parse_dates=["date"]
        )

    finally:
        # Close database connection resources
        engine.dispose()

    print("PostgreSQL data retrieved successfully!")

    # ==========================================
    # STEP 4: VALIDATE DATABASE DATA
    # ==========================================

    if history.empty:
        raise ValueError(
            "No historical waste records found"
        )

    if calendar.empty:
        raise ValueError(
            "No collection calendar records found"
        )

    history["date"] = pd.to_datetime(
        history["date"]
    )

    calendar["date"] = pd.to_datetime(
        calendar["date"]
    )

    print("\nDATABASE RECORD COUNTS")
    print("Daily history:", len(history))
    print("Calendar:", len(calendar))

    # ==========================================
    # STEP 5: GENERATE CALENDAR FEATURES
    # ==========================================

    # Monday = 0
    # Tuesday = 1
    # Wednesday = 2
    # Thursday = 3
    # Friday = 4
    # Saturday = 5
    # Sunday = 6

    calendar["day_of_week"] = (
        calendar["date"].dt.day_of_week
    )

    print("\nCALENDAR FEATURES")

    print(
        calendar[
            ["date", "day_of_week", "working_day"]
        ].head()
    )

    # ==========================================
    # STEP 6: LOAD RANDOM FOREST MODEL
    # ==========================================

    model = joblib.load(
        "models/random_forest_v1.joblib"
    )

    print(
        "\nRandom Forest model loaded successfully"
    )

    # ==========================================
    # STEP 7: GENERATE 7-DAY FORECAST
    # ==========================================

    as_of_date = "2026-11-05"

    predictions = forecast_next_7_days(
        model=model,
        history=history,
        calendar=calendar,
        as_of_date=as_of_date
    )

    # ==========================================
    # STEP 8: DISPLAY PREDICTIONS
    # ==========================================

    print("\nDATABASE-BASED DAILY FORECAST")

    print(
        predictions.to_string(index=False)
    )

    # ==========================================
    # STEP 9: VALIDATE PREDICTION OUTPUT
    # ==========================================

    # Make sure output is a DataFrame
    assert isinstance(predictions, pd.DataFrame), (
        "Expected a Pandas DataFrame"
    )

    # Check number of predicted days
    assert len(predictions) == 7, (
        "Expected exactly 7 daily predictions"
    )

    # Check required columns
    required_columns = {
        "date",
        "predicted_kg",
        "working_day"
    }

    missing_columns = (
        required_columns - set(predictions.columns)
    )

    assert not missing_columns, (
        f"Missing columns: {missing_columns}"
    )

    # Check predictions are not missing
    assert predictions["predicted_kg"].notna().all(), (
        "Missing waste predictions detected"
    )

    # Check predictions are finite
    assert np.isfinite(
        predictions["predicted_kg"]
    ).all(), (
        "Infinite or invalid waste predictions detected"
    )

    # Check predictions are non-negative
    assert (
        predictions["predicted_kg"] >= 0
    ).all(), (
        "Negative waste prediction detected"
    )

    # Validate weekend/non-collection predictions
    non_working_days = predictions[
        predictions["working_day"] == 0
    ]

    assert (
        non_working_days["predicted_kg"] == 0
    ).all(), (
        "Non-working days should have zero predictions"
    )

    # Check date uniqueness
    assert predictions["date"].is_unique, (
        "Duplicate prediction dates detected"
    )

    # ==========================================
    # STEP 10: SHOW SUCCESS MESSAGE
    # ==========================================

    print("\n======================================")
    print("PASS: PostgreSQL -> Random Forest -> Forecast")
    print("======================================")

    print("\nSUMMARY")
    print("Forecast as of:", as_of_date)
    print("Predicted days:", len(predictions))

    print(
        "Total predicted waste:",
        round(
            predictions["predicted_kg"].sum(),
            2
        ),
        "kg"
    )

    print(
        "Working days:",
        int(predictions["working_day"].sum())
    )

    print(
        "Non-working days:",
        int((predictions["working_day"] == 0).sum())
    )


# ==========================================
# RUN PROGRAM
# ==========================================

if __name__ == "__main__":
    main()
