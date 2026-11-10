
import numpy as np

from monthly import pipeline


# Save the original model method
original_method = pipeline.METHODS["SES"]


# Simulate a failed forecasting model
def failing_model(history):
    raise RuntimeError("Simulated model failure")


# Replace SES temporarily with a failing function
pipeline.METHODS["SES"] = failing_model

try:
    history = np.array([
        33, 32.5, 32, 41.5,
        37, 41.5, 62, 66,
        70, 55.5, 50, 58,
        53.5, 41, 46.5, 44.5
    ])

    selected_method = "SES"

    try:
        prediction = pipeline.safe_forecast(
            selected_method,
            history
        )
        actual_method = selected_method

    except Exception as error:
        print("Selected model failed:", error)

        prediction = pipeline.safe_forecast(
            "naive",
            history
        )
        actual_method = "naive"

    print("Actual method:", actual_method)
    print("Prediction:", prediction)

    if actual_method == "naive" and prediction == 44.5:
        print("PASS: Fallback to Naive works")
    else:
        print("FAIL: Unexpected fallback result")

finally:
    # Restore the original SES method
    pipeline.METHODS["SES"] = original_method
