
import argparse
from datetime import date

from sqlalchemy import text

from database import get_engine


# Council audit measurements (kg)
# Source: October 2025 one-week collection audit
ACTUAL_DATA = {
    "2025-10-08": 15190.0,
    "2025-10-09": 14455.0,
    "2025-10-10": 18833.0,
    "2025-10-13": 17153.0,
    "2025-10-14": 16898.0,
    "2025-10-15": 17319.0,
    "2025-10-16": 15073.0,
}


def import_actual_data(apply=False):

    engine = get_engine()

    try:
        # All operations are in one transaction.
        # Errors automatically roll back changes.
        with engine.begin() as connection:

            existing = []

            # ==================================
            # 1. CHECK EXISTING RECORDS
            # ==================================

            for date_string, actual_kg in ACTUAL_DATA.items():

                record_date = date.fromisoformat(
                    date_string
                )

                query = """
                    SELECT
                        date,
                        collected_kg,
                        source_type
                    FROM daily_collection_history
                    WHERE date = :date
                """

                # Lock rows during an actual import
                if apply:
                    query += " FOR UPDATE"

                record = connection.execute(
                    text(query),
                    {"date": record_date}
                ).mappings().first()

                if record is None:
                    raise ValueError(
                        f"Missing historical record: {date_string}"
                    )

                existing.append({
                    "date": record_date,
                    "previous_kg": float(
                        record["collected_kg"]
                    ),
                    "previous_source": record["source_type"],
                    "actual_kg": actual_kg
                })

            # ==================================
            # 2. DISPLAY COMPARISON
            # ==================================

            print("\nCOUNCIL ACTUAL DATA IMPORT")
            print("Mode:", "APPLY" if apply else "PREVIEW")
            print("-" * 65)

            for item in existing:
                print(
                    f"{item['date']} | "
                    f"Old: {item['previous_kg']:.1f} kg | "
                    f"Actual: {item['actual_kg']:.1f} kg | "
                    f"Source: {item['previous_source']}"
                )

            # Prevent accidental overwrite of
            # already imported actual measurements
            for item in existing:
                if item["previous_source"] != "synthetic":
                    raise ValueError(
                        "Import stopped: expected synthetic "
                        f"record on {item['date']}, found "
                        f"{item['previous_source']}"
                    )

            if not apply:
                print("\nPREVIEW PASSED")
                print("No database records were changed.")
                return

            # ==================================
            # 3. CREATE AUDIT BACKUP TABLE
            # ==================================

            connection.execute(
                text("""
                    CREATE TABLE IF NOT EXISTS
                    daily_collection_history_replacements (
                        id BIGINT GENERATED ALWAYS
                            AS IDENTITY PRIMARY KEY,

                        record_date DATE NOT NULL,

                        previous_kg DOUBLE PRECISION NOT NULL,
                        previous_source VARCHAR(20) NOT NULL,

                        replacement_kg DOUBLE PRECISION NOT NULL,
                        replacement_source VARCHAR(20) NOT NULL,

                        changed_at TIMESTAMPTZ NOT NULL
                            DEFAULT NOW()
                    )
                """)
            )

            # ==================================
            # 4. BACKUP AND UPDATE EACH DATE
            # ==================================

            updated = 0

            for item in existing:

                connection.execute(
                    text("""
                        INSERT INTO
                        daily_collection_history_replacements (
                            record_date,
                            previous_kg,
                            previous_source,
                            replacement_kg,
                            replacement_source
                        )
                        VALUES (
                            :record_date,
                            :previous_kg,
                            :previous_source,
                            :replacement_kg,
                            'actual'
                        )
                    """),
                    {
                        "record_date": item["date"],
                        "previous_kg": item["previous_kg"],
                        "previous_source": item["previous_source"],
                        "replacement_kg": item["actual_kg"]
                    }
                )

                result = connection.execute(
                    text("""
                        UPDATE daily_collection_history
                        SET
                            collected_kg = :actual_kg,
                            source_type = 'actual'
                        WHERE date = :record_date
                          AND source_type = 'synthetic'
                    """),
                    {
                        "record_date": item["date"],
                        "actual_kg": item["actual_kg"]
                    }
                )

                if result.rowcount != 1:
                    raise RuntimeError(
                        "Update failed for "
                        f"{item['date']}"
                    )

                updated += 1

            if updated != len(ACTUAL_DATA):
                raise RuntimeError(
                    "Incomplete import. Transaction rolled back."
                )

        print("\n====================================")
        print("PASS: ACTUAL DATA IMPORT COMPLETED")
        print("Updated records:", updated)
        print("Original synthetic values backed up.")
        print("====================================")

    finally:
        engine.dispose()


if __name__ == "__main__":

    parser = argparse.ArgumentParser()

    parser.add_argument(
        "--apply",
        action="store_true",
        help="Apply changes to PostgreSQL"
    )

    args = parser.parse_args()

    import_actual_data(apply=args.apply)
