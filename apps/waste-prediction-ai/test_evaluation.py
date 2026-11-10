
import pandas as pd

from monthly.evaluation import rolling_test, score_table


# Load monthly council data
df = pd.read_csv(
    "data/monthly_loads.csv",
    parse_dates=["month"]
)

# Sort by month
df = df.sort_values("month").reset_index(drop=True)

# Keep confirmed records only
df = df[df["status"] == "confirmed"].reset_index(drop=True)

if df.empty:
    raise ValueError("No confirmed records found")

if df["month"].duplicated().any():
    raise ValueError("Duplicate months found")

expected = pd.date_range(
    df["month"].min(),
    df["month"].max(),
    freq="MS"
)

missing = expected.difference(df["month"])

if len(missing) > 0:
    raise ValueError(f"Missing months: {missing}")

# Run rolling backtesting
results = rolling_test(df)

# Calculate evaluation scores
scores = score_table(results)

print("\nMODEL COMPARISON")
print(scores.to_string(index=False))
