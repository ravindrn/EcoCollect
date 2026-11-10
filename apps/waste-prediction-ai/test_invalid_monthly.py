
import pandas as pd
from monthly.pipeline import run_monthly_pipeline

# Load original council data
df = pd.read_csv("data/monthly_loads.csv")

# Create a copy for testing
test_df = df.copy()

# Introduce an invalid negative value
test_df.loc[0, "deg_loads"] = -10

try:
    run_monthly_pipeline(test_df)
    print("FAIL: Invalid data was accepted")

except ValueError as error:
    print("PASS: Invalid data was rejected")
    print("Error:", error)
