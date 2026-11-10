
import hashlib
import json

import pandas as pd
from sqlalchemy import text

from database import get_engine
from monthly.pipeline import run_monthly_pipeline


DATA_SOURCE = "COUNCIL_MONTHLY_RECORDS"


# ==========================================
# 1. CALCULATE MONTHLY DATA FINGERPRINT
# ==========================================

def calculate_input_hash(monthly):
    """
    Create a SHA-256 fingerprint from confirmed
    monthly collection records.

    Same confirmed data -> same hash.
    Changed confirmed data -> different hash.
    """

    confirmed = monthly[
        monthly["status"] == "confirmed"
    ].copy()

    if confirmed.empty:
        raise ValueError(
            "No confirmed monthly records available"
        )

    confirmed["month"] = pd.to_datetime(
        confirmed["month"]
    ).dt.to_period("M").dt.to_timestamp()

    confirmed = confirmed.sort_values("month")

    records = []

    for _, row in confirmed.iterrows():
        records.append({
            "month": row["month"].strftime("%Y-%m"),
            "deg_loads": format(
                float(row["deg_loads"]), ".17g"
            ),
            "nondeg_loads": format(
                float(row["nondeg_loads"]), ".17g"
            )
        })

    payload = json.dumps(
        records,
        sort_keys=True,
        separators=(",", ":")
    )

    return hashlib.sha256(
        payload.encode("utf-8")
    ).hexdigest()


# ==========================================
# 2. READ MONTHLY DATA FROM POSTGRESQL
# ==========================================

def load_monthly_data(engine):
    """
    Load monthly waste history from PostgreSQL.
    """

    with engine.connect() as connection:
        monthly = pd.read_sql(
            text("""
                SELECT
                    month,
                    nondeg_loads,
                    deg_loads,
                    status
                FROM monthly_waste_loads
                ORDER BY month
            """),
            connection,
            parse_dates=["month"]
        )

    if monthly.empty:
        raise ValueError(
            "No monthly waste records in PostgreSQL"
        )

    return monthly


# ==========================================
# 3. GENERATE MONTHLY FORECAST
# ==========================================

def generate_monthly_forecast(monthly):
    """
    Run the existing monthly forecasting pipeline.

    The pipeline uses confirmed records, evaluates
    forecasting methods and generates two predictions.
    """

    result = run_monthly_pipeline(monthly)

    forecast = result["forecast"]
    decisions = result["decisions"]

    if len(forecast) != 2:
        raise ValueError(
            "Expected two category predictions"
        )

    expected_categories = {
        "deg_loads",
        "nondeg_loads"
    }

    if set(forecast["series"]) != expected_categories:
        raise ValueError(
            "Unexpected waste categories"
        )

    if forecast["forecast_month"].nunique() != 1:
        raise ValueError(
            "Forecast categories have different months"
        )

    if (
        forecast["series"].duplicated().any()
        or decisions["series"].duplicated().any()
    ):
        raise ValueError(
            "Duplicate forecasting categories"
        )

    if not expected_categories.issubset(
        set(decisions["series"])
    ):
        raise ValueError(
            "Missing model selection decisions"
        )

    return result


# ==========================================
# 4. SAVE MONTHLY FORECAST TO POSTGRESQL
# ==========================================

def save_monthly_predictions(
    engine,
    result,
    data_through_month,
    input_hash
):
    """
    Save one monthly forecasting run and its
    two category predictions.

    If the same input hash already exists for the
    forecast month, reuse the existing run.

    If confirmed historical data changes,
    create a new forecast version.
    """

    forecast = result["forecast"]
    decisions = result["decisions"]

    forecast_month = pd.Period(
        str(forecast["forecast_month"].iloc[0]),
        freq="M"
    ).start_time.date()

    data_through_month = pd.Period(
        data_through_month,
        freq="M"
    ).start_time.date()

    if not isinstance(input_hash, str) or len(input_hash) != 64:
        raise ValueError(
            "Invalid monthly forecast input hash"
        )

    with engine.begin() as connection:

        # Prevent simultaneous saves for the
        # same forecast month.
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
                "forecast_key": (
                    f"monthly:{forecast_month.isoformat()}"
                )
            }
        )

        # Check whether this exact input version
        # was already forecasted.
        existing_run = connection.execute(
            text("""
                SELECT id
                FROM monthly_forecast_runs
                WHERE forecast_month = :forecast_month
                  AND data_through_month = :data_through_month
                  AND input_hash = :input_hash
                  AND status = 'completed'
                ORDER BY id DESC
                LIMIT 1
            """),
            {
                "forecast_month": forecast_month,
                "data_through_month": data_through_month,
                "input_hash": input_hash
            }
        ).scalar_one_or_none()

        if existing_run is not None:
            return int(existing_run), False

        # Insert a new forecast run.
        run_id = connection.execute(
            text("""
                INSERT INTO monthly_forecast_runs (
                    forecast_month,
                    data_through_month,
                    data_source,
                    input_hash,
                    status
                )
                VALUES (
                    :forecast_month,
                    :data_through_month,
                    :data_source,
                    :input_hash,
                    'completed'
                )
                RETURNING id
            """),
            {
                "forecast_month": forecast_month,
                "data_through_month": data_through_month,
                "data_source": DATA_SOURCE,
                "input_hash": input_hash
            }
        ).scalar_one()

        # Save degradable and non-degradable
        # predictions in the same transaction.
        for _, row in forecast.iterrows():

            series = row["series"]

            decision = decisions.loc[
                decisions["series"] == series
            ].iloc[0]

            connection.execute(
                text("""
                    INSERT INTO monthly_forecast_predictions (
                        run_id,
                        category,
                        selected_method,
                        actual_method,
                        predicted_loads,
                        unit
                    )
                    VALUES (
                        :run_id,
                        :category,
                        :selected_method,
                        :actual_method,
                        :predicted_loads,
                        'loads'
                    )
                """),
                {
                    "run_id": int(run_id),
                    "category": series,
                    "selected_method": str(
                        decision["chosen"]
                    ),
                    "actual_method": str(
                        row["method"]
                    ),
                    "predicted_loads": float(
                        row["forecast_loads"]
                    )
                }
            )

    return int(run_id), True


# ==========================================
# 5. COMPLETE MONTHLY FORECAST WORKFLOW
# ==========================================

def run_monthly_forecast_job():
    engine = get_engine()

    try:
        # Load latest monthly history.
        monthly = load_monthly_data(engine)

        print("\nMONTHLY DATABASE RECORDS")
        print("Total rows:", len(monthly))

        # Only confirmed records contribute to
        # the historical input fingerprint.
        confirmed = monthly[
            monthly["status"] == "confirmed"
        ].copy()

        if confirmed.empty:
            raise ValueError(
                "No confirmed monthly records available"
            )

        # Calculate latest confirmed month.
        data_through_month = (
            pd.to_datetime(confirmed["month"])
            .max()
            .date()
        )

        # Calculate the confirmed input fingerprint.
        input_hash = calculate_input_hash(monthly)

        print("\nLATEST CONFIRMED MONTH")
        print(data_through_month)

        print("\nINPUT HASH")
        print(input_hash)

        # Run the existing five-method pipeline.
        result = generate_monthly_forecast(monthly)

        print("\nMODEL COMPARISON")
        print(
            result["scores"].to_string(
                index=False
            )
        )

        print("\nSELECTED METHODS")
        print(
            result["decisions"].to_string(
                index=False
            )
        )

        print("\nMONTHLY PREDICTIONS")
        print(
            result["forecast"].to_string(
                index=False
            )
        )

        # Persist the forecast.
        run_id, created = save_monthly_predictions(
            engine=engine,
            result=result,
            data_through_month=data_through_month,
            input_hash=input_hash
        )

        if created:
            print(
                "\nPASS: NEW MONTHLY FORECAST SAVED"
            )
        else:
            print(
                "\nPASS: EXISTING MONTHLY FORECAST REUSED"
            )

        print("Forecast run ID:", run_id)

        return {
            "run_id": run_id,
            "created": created,
            "forecast_month": str(
                result["forecast"]["forecast_month"].iloc[0]
            ),
            "input_hash": input_hash
        }

    finally:
        engine.dispose()


def main():
    return run_monthly_forecast_job()


if __name__ == "__main__":
    main()