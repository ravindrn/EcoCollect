
import warnings

import numpy as np
import pandas as pd

from statsmodels.tools.sm_exceptions import ConvergenceWarning

from monthly.methods import METHODS
from monthly.evaluation import rolling_test, score_table
from monthly.selection import select_models


SERIES = ("nondeg_loads", "deg_loads")


# =====================================================
# 1. SAFE FORECASTING FUNCTION
# =====================================================

def safe_forecast(method_name, history):
    """
    Generate a non-negative forecast.

    A convergence warning, fitting error, NaN or
    infinite prediction is treated as a failure.
    """

    if method_name not in METHODS:
        raise ValueError(
            f"Unknown forecasting method: {method_name}"
        )

    with warnings.catch_warnings():

        # Turn convergence warnings into errors
        warnings.simplefilter(
            "error",
            ConvergenceWarning
        )

        prediction = float(
            METHODS[method_name](history)
        )

    if not np.isfinite(prediction):
        raise ValueError(
            f"Invalid forecast from {method_name}"
        )

    return max(0.0, prediction)


# =====================================================
# 2. COMPLETE MONTHLY FORECASTING PIPELINE
# =====================================================

def run_monthly_pipeline(data):

    # 1. Copy and validate monthly data
    df = data.copy()

    required = {"month", "status", *SERIES}
    missing_columns = required - set(df.columns)

    if missing_columns:
        raise ValueError(
            f"Missing columns: {sorted(missing_columns)}"
        )
        # Use only confirmed council records
    df = df[
        df["status"] == "confirmed"
    ].copy().reset_index(drop=True)

    if df.empty:
        raise ValueError(
            "No confirmed records available"
        )

    # Convert month values into monthly timestamps
    df["month"] = pd.to_datetime(
        df["month"]
    ).dt.to_period("M").dt.to_timestamp()

    df = df.sort_values("month").reset_index(drop=True)

    # Reject duplicate months
    if df["month"].duplicated().any():
        raise ValueError("Duplicate months found")

    # Validate collection loads
    for col in SERIES:

        df[col] = pd.to_numeric(
            df[col],
            errors="raise"
        )

        if df[col].isna().any():
            raise ValueError(
                f"Missing values in {col}"
            )

        if not np.isfinite(df[col]).all():
            raise ValueError(
                f"Invalid numbers in {col}"
            )

        if (df[col] < 0).any():
            raise ValueError(
                f"Negative collection loads in {col}"
            )

    # 3. Check monthly continuity
    expected = pd.date_range(
        start=df["month"].min(),
        end=df["month"].max(),
        freq="MS"
    )

    missing_months = expected.difference(
        df["month"]
    )

    if len(missing_months) > 0:
        raise ValueError(
            f"Missing confirmed months: {missing_months}"
        )

    # 4. Run rolling historical backtesting
    results = rolling_test(df)

    if results.empty:
        raise ValueError(
            "Not enough history for backtesting"
        )

    # 5. Calculate model comparison scores
    scores = score_table(results)

    # 6. Choose the forecasting method
    # for each waste category
    decisions = select_models(scores)

    # 7. Identify next month
    next_month = (
        df["month"].max() + pd.offsets.MonthBegin(1)
    ).strftime("%Y-%m")

    # 8. Generate operational forecasts
    rows = []

    for _, decision in decisions.iterrows():

        series = decision["series"]
        selected_method = decision["chosen"]

        history = df[series].to_numpy(
            dtype=float
        )

        # Assume selected method succeeds initially
        actual_method = selected_method

        try:

            prediction = safe_forecast(
                selected_method,
                history
            )

        except Exception as error:

            # If Naive itself fails, don't hide the issue
            if selected_method == "naive":
                raise ValueError(
                    f"Naive forecast failed for {series}: "
                    f"{error}"
                ) from error

            # Fallback to Naive
            print(
                f"WARNING: {selected_method} failed "
                f"for {series}: {error}. "
                "Using Naive fallback."
            )

            actual_method = "naive"

            try:
                prediction = safe_forecast(
                    "naive",
                    history
                )
            except Exception as fallback_error:
                raise ValueError(
                    f"Both {selected_method} and Naive "
                    f"failed for {series}: {fallback_error}"
                ) from fallback_error

        # 9. Store forecast results
        rows.append({
            "forecast_month": next_month,
            "series": series,
            "method": actual_method,
            "forecast_loads": round(
                prediction,
                1
            ),
            "unit": "loads (not kg)"
        })

    forecast = pd.DataFrame(rows)

    # Keep the original return structure
    # so existing FastAPI code still works
    return {
        "scores": scores,
        "decisions": decisions,
        "forecast": forecast
    }
