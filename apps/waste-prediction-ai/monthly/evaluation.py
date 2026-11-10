
import numpy as np
import pandas as pd
import warnings

from statsmodels.tools.sm_exceptions import ConvergenceWarning
from monthly.methods import METHODS


# =====================================================
# 1. ROLLING BACKTESTING
# =====================================================

def rolling_test(
    data,
    series_cols=("nondeg_loads", "deg_loads"),
    first_origin="2025-07"
):
    rows = []

    start_date = pd.Timestamp(first_origin + "-01")

    for col in series_cols:

        y_all = data[col].to_numpy(dtype=float)
        months = pd.to_datetime(
            data["month"]
        ).reset_index(drop=True)

        for i in range(len(data)):

            # Start testing from the specified month
            if months.iloc[i] < start_date:
                continue

            # Only use observations before the test month
            # This prevents future data leakage
            historical_values = y_all[:i]

            # Evaluate all five forecasting methods
            for name, function in METHODS.items():

                try:

                    # Treat optimization convergence warnings
                    # as fitting failures
                    with warnings.catch_warnings():

                        warnings.simplefilter(
                            "error",
                            ConvergenceWarning
                        )

                        raw_prediction = float(
                            function(historical_values)
                        )

                    # Reject NaN and infinity
                    if not np.isfinite(raw_prediction):
                        raise ValueError(
                            "Non-finite prediction"
                        )

                    # Collection loads cannot be negative
                    # Apply the same non-negative rule
                    # used during operational forecasting
                    prediction = max(
                        0.0,
                        raw_prediction
                    )

                    error = None

                except Exception as exc:

                    # Record failed predictions
                    # instead of silently accepting them
                    prediction = np.nan
                    error = str(exc)

                # Store prediction and diagnostic information
                rows.append({
                    "series": col,
                    "month": months.iloc[i].strftime("%Y-%m"),
                    "method": name,
                    "actual": float(y_all[i]),
                    "pred": prediction,
                    "error": error
                })

    return pd.DataFrame(rows)


# =====================================================
# 2. MODEL EVALUATION — MAE, WAPE AND SCORE
# =====================================================

def score_table(results):

    rows = []

    for series, series_data in results.groupby("series"):

        # All historical months that must be tested
        expected_months = set(
            series_data["month"].unique()
        )

        total_months = len(expected_months)

        for method, group in series_data.groupby("method"):

            # Remove missing predictions
            valid = group.dropna(
                subset=["pred"]
            ).copy()

            # Keep only finite, non-negative predictions
            valid = valid[
                np.isfinite(valid["pred"])
                & (valid["pred"] >= 0)
            ]

            # Every method must successfully forecast
            # every required historical test month
            if (
                len(valid) != total_months
                or set(valid["month"]) != expected_months
            ):

                print(
                    f"SKIPPED: {method} for {series} "
                    "- incomplete or invalid predictions"
                )

                continue

            # Calculate absolute prediction errors
            errors = (
                valid["actual"] - valid["pred"]
            ).abs()

            # Mean Absolute Error
            mae = float(errors.mean())

            # Weighted Absolute Percentage Error
            denominator = valid["actual"].abs().sum()

            wape = (
                float(
                    errors.sum() / denominator * 100
                )
                if denominator > 0
                else np.nan
            )

            # Custom performance score
            # This is NOT a true accuracy percentage
            score = (
                round(
                    max(0, 100 - wape),
                    2
                )
                if np.isfinite(wape)
                else np.nan
            )

            rows.append({
                "series": series,
                "method": method,
                "test_months": total_months,
                "MAE_loads": round(mae, 2),
                "WAPE_%": (
                    round(wape, 2)
                    if np.isfinite(wape)
                    else np.nan
                ),
                "Score_100": score
            })

    # Stop if no method completed the evaluation
    if not rows:
        raise ValueError(
            "No methods completed all required test months"
        )

    # Return model comparison sorted by MAE
    return (
        pd.DataFrame(rows)
        .sort_values(
            ["series", "MAE_loads"],
            ascending=[True, True]
        )
        .reset_index(drop=True)
    )
