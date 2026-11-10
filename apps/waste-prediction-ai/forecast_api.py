
from fastapi import APIRouter, HTTPException
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from database import get_engine
from save_monthly_forecast import calculate_input_hash


router = APIRouter(
    prefix="/forecasts",
    tags=["Saved Forecasts"]
)


# ==========================================
# 1. GET LATEST SAVED DAILY FORECAST
# ==========================================

@router.get("/daily")
def get_latest_daily_forecast():

    engine = None

    try:
        engine = get_engine()

        with engine.connect() as connection:

            # Find the latest completed forecast run.
            run = connection.execute(
                text("""
                    SELECT
                        id,
                        forecast_as_of,
                        model_version,
                        data_source,
                        created_at
                    FROM forecast_runs
                    WHERE status = 'completed'
                    ORDER BY created_at DESC, id DESC
                    LIMIT 1
                """)
            ).mappings().first()

            if run is None:
                raise HTTPException(
                    status_code=404,
                    detail="No saved forecasts available"
                )

            # Retrieve the daily predictions.
            predictions = connection.execute(
                text("""
                    SELECT
                        target_date,
                        predicted_kg,
                        working_day,
                        unit
                    FROM waste_predictions
                    WHERE run_id = :run_id
                    ORDER BY target_date
                """),
                {"run_id": run["id"]}
            ).mappings().all()

        return {
            "run_id": run["id"],
            "forecast_as_of": str(
                run["forecast_as_of"]
            ),
            "model_version": run["model_version"],
            "data_source": run["data_source"],
            "created_at": run["created_at"].isoformat(),
            "predictions": [
                {
                    "date": str(row["target_date"]),
                    "predicted_kg": float(
                        row["predicted_kg"]
                    ),
                    "working_day": int(
                        row["working_day"]
                    ),
                    "unit": row["unit"]
                }
                for row in predictions
            ]
        }

    except HTTPException:
        raise

    except SQLAlchemyError as error:
        raise HTTPException(
            status_code=503,
            detail="Forecast database is unavailable"
        ) from error

    finally:
        if engine is not None:
            engine.dispose()


# ==========================================
# 2. GET LATEST SAVED MONTHLY FORECAST
# ==========================================

@router.get("/monthly")
def get_latest_monthly_forecast():

    engine = None

    try:
        engine = get_engine()

        with engine.connect() as connection:

            # Use one consistent snapshot for:
            # - saved forecast
            # - monthly history
            #
            # This prevents reading mismatched
            # versions during an Admin update.
            connection.exec_driver_sql(
                "SET TRANSACTION ISOLATION LEVEL "
                "REPEATABLE READ READ ONLY"
            )

            # Get the latest completed monthly run.
            run = connection.execute(
                text("""
                    SELECT
                        id,
                        forecast_month,
                        data_through_month,
                        data_source,
                        input_hash,
                        created_at
                    FROM monthly_forecast_runs
                    WHERE status = 'completed'
                    ORDER BY created_at DESC, id DESC
                    LIMIT 1
                """)
            ).mappings().first()

            if run is None:
                raise HTTPException(
                    status_code=404,
                    detail="No saved monthly forecasts available"
                )

            # Retrieve the predictions for this run.
            rows = connection.execute(
                text("""
                    SELECT
                        category,
                        selected_method,
                        actual_method,
                        predicted_loads,
                        unit
                    FROM monthly_forecast_predictions
                    WHERE run_id = :run_id
                    ORDER BY category
                """),
                {"run_id": run["id"]}
            ).mappings().all()

            if (
                len(rows) != 2
                or {
                    row["category"] for row in rows
                } != {"deg_loads", "nondeg_loads"}
            ):
                raise HTTPException(
                    status_code=409,
                    detail="Monthly forecast run is incomplete"
                )

            # Read confirmed monthly historical data
            # using the same database snapshot.
            #
            # calculate_input_hash() already filters
            # to confirmed records.
            import pandas as pd

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
                raise HTTPException(
                    status_code=409,
                    detail="No monthly history available"
                )

            confirmed = monthly[
                monthly["status"] == "confirmed"
            ]

            if confirmed.empty:
                raise HTTPException(
                    status_code=409,
                    detail="No confirmed monthly records"
                )

            # Fingerprint of current confirmed history.
            current_input_hash = calculate_input_hash(
                monthly
            )

            # Compare historical data versions.
            forecast_is_current = (
                run["input_hash"] is not None
                and run["input_hash"] == current_input_hash
            )

            latest_confirmed_month = (
                pd.to_datetime(
                    confirmed["month"]
                ).max().strftime("%Y-%m")
            )

        return {
            "run_id": int(run["id"]),

            "forecast_month": (
                run["forecast_month"].strftime("%Y-%m")
            ),

            "data_through_month": (
                run["data_through_month"].strftime("%Y-%m")
            ),

            "latest_confirmed_month": (
                latest_confirmed_month
            ),

            "data_source": run["data_source"],

            "created_at": (
                run["created_at"].isoformat()
            ),

            "input_hash": run["input_hash"],

            "forecast_is_current": (
                forecast_is_current
            ),

            "refresh_required": (
                not forecast_is_current
            ),

            "predictions": [
                {
                    "category": row["category"],

                    "selected_method": (
                        row["selected_method"]
                    ),

                    "actual_method": (
                        row["actual_method"]
                    ),

                    "predicted_loads": float(
                        row["predicted_loads"]
                    ),

                    "unit": row["unit"]
                }
                for row in rows
            ]
        }

    except HTTPException:
        raise

    except ValueError as error:
        raise HTTPException(
            status_code=409,
            detail=str(error)
        ) from error

    except SQLAlchemyError as error:
        raise HTTPException(
            status_code=503,
            detail="Monthly forecast database is unavailable"
        ) from error

    finally:
        if engine is not None:
            engine.dispose()


# ==========================================
# 3. DAILY FORECAST ACCURACY MONITORING
# ==========================================

@router.get("/accuracy")
def get_forecast_accuracy():

    engine = None

    try:
        engine = get_engine()

        with engine.connect() as connection:

            # Select eligible historical forecasts.
            # Only real actual weights are evaluated.
            #
            # Predictions from explicitly synthetic
            # prototype runs are excluded.
            rows = connection.execute(
                text("""
                    SELECT DISTINCT ON (p.target_date)
                        p.target_date,
                        p.predicted_kg,
                        h.collected_kg AS actual_kg,
                        r.forecast_as_of,
                        r.model_version,
                        r.data_source
                    FROM waste_predictions p
                    JOIN forecast_runs r
                        ON r.id = p.run_id
                    JOIN daily_collection_history h
                        ON h.date = p.target_date
                    WHERE h.source_type = 'actual'
                      AND r.status = 'completed'
                      AND r.data_source !=
                          'SYNTHETIC_PROTOTYPE'
                      AND r.forecast_as_of <
                          p.target_date
                      AND r.created_at::date <=
                          p.target_date
                    ORDER BY
                        p.target_date,
                        r.created_at DESC,
                        r.id DESC
                """)
            ).mappings().all()

        if not rows:
            return {
                "status": "insufficient_data",
                "message": (
                    "No eligible forecasts match "
                    "actual collection records yet."
                ),
                "matched_days": 0,
                "metrics": {
                    "MAE_kg": None,
                    "RMSE_kg": None,
                    "WAPE_percent": None
                },
                "comparisons": []
            }

        comparisons = []
        absolute_errors = []
        squared_errors = []
        total_actual = 0.0

        for row in rows:

            predicted = float(
                row["predicted_kg"]
            )

            actual = float(
                row["actual_kg"]
            )

            absolute_error = abs(
                predicted - actual
            )

            squared_error = (
                predicted - actual
            ) ** 2

            absolute_errors.append(
                absolute_error
            )

            squared_errors.append(
                squared_error
            )

            total_actual += actual

            comparisons.append({
                "date": (
                    row["target_date"].isoformat()
                ),
                "predicted_kg": round(
                    predicted, 2
                ),
                "actual_kg": round(
                    actual, 2
                ),
                "absolute_error_kg": round(
                    absolute_error, 2
                ),
                "model_version": (
                    row["model_version"]
                )
            })

        count = len(comparisons)

        mae = (
            sum(absolute_errors) / count
        )

        rmse = (
            sum(squared_errors) / count
        ) ** 0.5

        wape = (
            100 * sum(absolute_errors) / total_actual
            if total_actual > 0
            else None
        )

        return {
            "status": "evaluated",
            "matched_days": count,
            "metrics": {
                "MAE_kg": round(mae, 2),
                "RMSE_kg": round(rmse, 2),
                "WAPE_percent": (
                    round(wape, 2)
                    if wape is not None
                    else None
                )
            },
            "comparisons": comparisons
        }

    except SQLAlchemyError as error:
        raise HTTPException(
            status_code=503,
            detail=(
                "Accuracy monitoring database "
                "unavailable"
            )
        ) from error

    finally:
        if engine is not None:
            engine.dispose()
