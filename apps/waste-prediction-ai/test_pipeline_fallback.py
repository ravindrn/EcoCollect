
import pandas as pd
from unittest.mock import patch

from monthly import pipeline


# Load the original council dataset
df = pd.read_csv("data/monthly_loads.csv")


# Save the real model selection function
original_select_models = pipeline.select_models


# Force SES to be selected for testing
def force_ses_selection(scores):

    decisions = original_select_models(scores)

    decisions = decisions.copy()

    decisions.loc[
        decisions["series"] == "deg_loads",
        "chosen"
    ] = "SES"

    return decisions


# Simulate failure only during operational forecasting
original_safe_forecast = pipeline.safe_forecast


def simulate_failure(method_name, history):

    if method_name == "SES":
        raise RuntimeError("Simulated SES failure")

    return original_safe_forecast(method_name, history)


with patch.object(
    pipeline,
    "select_models",
    side_effect=force_ses_selection
), patch.object(
    pipeline,
    "safe_forecast",
    side_effect=simulate_failure
):

    result = pipeline.run_monthly_pipeline(df)


forecast = result["forecast"]

print("\nFORECAST RESULTS")
print(forecast.to_string(index=False))


# Verify the operational forecast used Naive
deg = forecast.loc[
    forecast["series"] == "deg_loads"
].iloc[0]

assert deg["method"] == "naive", (
    "Fallback failed: expected Naive"
)

assert deg["forecast_loads"] == 44.5, (
    "Fallback produced an unexpected value"
)

print("\nPASS: End-to-end fallback works")
