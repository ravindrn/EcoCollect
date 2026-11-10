
import pandas as pd
from monthly.pipeline import run_monthly_pipeline

# Load original monthly records
df = pd.read_csv("data/monthly_loads.csv")

# Make a separate test copy
test_df = df[df["month"] != "2025-03"].copy()

try:
    run_monthly_pipeline(test_df)
    print("FAIL: Missing month was accepted")

except ValueError as error:
    if "Missing confirmed months" in str(error):
        print("PASS: Missing month was detected")
        print("Error:", error)
    else:
        print("FAIL: Different validation error:", error)
