
from save_monthly_forecast import (
    calculate_input_hash,
    load_monthly_data,
    generate_monthly_forecast,
)
from database import get_engine


def main():
    engine = get_engine()

    try:
        # 1. Read the existing PostgreSQL records
        original = load_monthly_data(engine)

        # 2. Calculate the original fingerprint
        original_hash = calculate_input_hash(original)

        # 3. Simulate an Admin correction in memory
        corrected = original.copy()

        confirmed = corrected[
            corrected["status"] == "confirmed"
        ]

        latest_month = confirmed["month"].max()

        mask = (
            (corrected["month"] == latest_month)
            & (corrected["status"] == "confirmed")
        )

        old_value = float(
            corrected.loc[mask, "deg_loads"].iloc[0]
        )

        corrected.loc[mask, "deg_loads"] = (
            old_value + 5
        )

        # 4. Calculate the corrected fingerprint
        corrected_hash = calculate_input_hash(corrected)

        # 5. Verify the fingerprint changed
        assert original_hash != corrected_hash, (
            "ERROR: Hash did not change after correction"
        )

        print("\nPASS: Monthly correction detected")
        print("Corrected month:", latest_month.date())
        print("Original degradable loads:", old_value)
        print("Corrected degradable loads:", old_value + 5)

        # 6. Run the forecast using corrected data
        result = generate_monthly_forecast(corrected)

        print("\nUPDATED FORECAST")
        print(
            result["forecast"].to_string(index=False)
        )

        # 7. Do not save the test forecast
        print("\nPASS: Test completed without modifying PostgreSQL")

    finally:
        engine.dispose()


if __name__ == "__main__":
    main()
