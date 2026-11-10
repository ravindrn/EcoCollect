
import pandas as pd

from monthly.evaluation import rolling_test, score_table
from monthly.selection import select_models

# Load actual monthly council records
df = pd.read_csv(
    "data/monthly_loads.csv",
    parse_dates=["month"]
)

df = df.sort_values("month").reset_index(drop=True)
df = df[df["status"] == "confirmed"].reset_index(drop=True)

if df.empty:
    raise ValueError("No confirmed monthly records")

if df["month"].duplicated().any():
    raise ValueError("Duplicate months found")

expected = pd.date_range(
    df["month"].min(),
    df["month"].max(),
    freq="MS"
)

missing = expected.difference(df["month"])

if len(missing) > 0:
    raise ValueError(f"Missing confirmed months: {missing}")

# Run the five methods
results = rolling_test(df)

# Calculate MAE and WAPE
scores = score_table(results)

# Automatically select methods
decisions = select_models(scores)

print("\nMODEL COMPARISON")
print(scores.to_string(index=False))

print("\nSELECTED METHODS")
print(decisions.to_string(index=False))
