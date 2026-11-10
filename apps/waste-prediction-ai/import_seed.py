
"""
Import approved historical CSVs into an EMPTY
PostgreSQL development database.

Usage:
    uv run python import_seed.py --db-name waste_ai_dev
    uv run python import_seed.py --db-name waste_ai_dev --apply

Requires DATABASE_URL in .env to point to waste_ai_dev.
"""

import argparse
import csv
from datetime import date
from decimal import Decimal, InvalidOperation
from pathlib import Path

from sqlalchemy import text

from database import get_engine


BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data_seed"

TABLE_FILES = {
    "daily_collection_history": {
        "file": "daily_history.csv",
        "columns": ["date", "collected_kg", "source_type"],
        "key": "date",
    },
    "collection_calendar": {
        "file": "collection_calendar.csv",
        "columns": ["date", "working_day"],
        "key": "date",
    },
    "monthly_waste_loads": {
        "file": "monthly_history.csv",
        "columns": [
            "month",
            "nondeg_loads",
            "deg_loads",
            "status",
        ],
        "key": "month",
    },
}


def parse_number(value, field, row_number):
    try:
        number = Decimal(value.strip())
    except (InvalidOperation, AttributeError):
        raise ValueError(
            f"Row {row_number}: invalid {field}"
        )

    if not number.is_finite() or number < 0:
        raise ValueError(
            f"Row {row_number}: {field} must be "
            "a finite non-negative number"
        )

    return number


def load_csv(table, config):
    path = DATA_DIR / config["file"]

    if not path.is_file():
        raise FileNotFoundError(
            f"Missing CSV: {path}"
        )

    with path.open(
        "r", encoding="utf-8-sig", newline=""
    ) as file:
        reader = csv.DictReader(file)

        if reader.fieldnames != config["columns"]:
            raise ValueError(
                f"{path.name}: expected columns "
                f"{config['columns']}, "
                f"found {reader.fieldnames}"
            )

        rows = list(reader)

    if not rows:
        raise ValueError(
            f"{path.name} contains no data"
        )

    validated = []
    seen = set()

    for row_number, row in enumerate(rows, start=2):

        if any(value is None for value in row.values()):
            raise ValueError(
                f"{path.name}, row {row_number}: "
                "missing field"
            )

        if table == "daily_collection_history":
            record = {
                "date": date.fromisoformat(
                    row["date"].strip()
                ),
                "collected_kg": parse_number(
                    row["collected_kg"],
                    "collected_kg",
                    row_number,
                ),
                "source_type": row[
                    "source_type"
                ].strip(),
            }

            if not record["source_type"]:
                raise ValueError(
                    "source_type cannot be empty"
                )

        elif table == "collection_calendar":
            working_day = row["working_day"].strip()

            if working_day not in {"0", "1"}:
                raise ValueError(
                    f"Row {row_number}: "
                    "working_day must be 0 or 1"
                )

            record = {
                "date": date.fromisoformat(
                    row["date"].strip()
                ),
                "working_day": int(working_day),
            }

        else:
            record = {
                "month": date.fromisoformat(
                    row["month"].strip()
                ),
                "nondeg_loads": parse_number(
                    row["nondeg_loads"],
                    "nondeg_loads",
                    row_number,
                ),
                "deg_loads": parse_number(
                    row["deg_loads"],
                    "deg_loads",
                    row_number,
                ),
                "status": row["status"].strip(),
            }

            if not record["status"]:
                raise ValueError(
                    f"Row {row_number}: missing status"
                )

        key = record[config["key"]]

        if key in seen:
            raise ValueError(
                f"{path.name}: duplicate {config['key']} "
                f"value {key}"
            )

        seen.add(key)
        validated.append(record)

    return validated


def import_data(expected_database, apply_changes):
    # Validate every CSV before connecting to DB.
    datasets = {
        table: load_csv(table, config)
        for table, config in TABLE_FILES.items()
    }

    print("\nCSV VALIDATION PASSED")

    for table, rows in datasets.items():
        print(f"{table}: {len(rows)} records")

    engine = get_engine()

    try:
        with engine.begin() as connection:

            actual_database = connection.execute(
                text("SELECT current_database()")
            ).scalar_one()

            print("\nConnected database:", actual_database)

            if actual_database != expected_database:
                raise RuntimeError(
                    "DATABASE MISMATCH. Expected "
                    f"{expected_database}, connected to "
                    f"{actual_database}"
                )

            if actual_database == "waste_predction_db":
                raise RuntimeError(
                    "Refusing to import into the "
                    "original project database"
                )

            # This importer is intended for a fresh DB.
            for table in TABLE_FILES:
                count = connection.execute(
                    text(f"SELECT COUNT(*) FROM public.{table}")
                ).scalar_one()

                if count != 0:
                    raise RuntimeError(
                        f"{table} already has {count} rows. "
                        "Import aborted to prevent duplicates."
                    )

            if not apply_changes:
                print(
                    "\nDRY RUN PASSED: "
                    "No rows inserted."
                )
                return

            # Insert all three datasets in one transaction.
            # If any insert fails, PostgreSQL rolls back
            # the entire import.
            for table, config in TABLE_FILES.items():
                columns = config["columns"]

                column_sql = ", ".join(columns)
                values_sql = ", ".join(
                    f":{column}" for column in columns
                )

                query = text(
                    f"INSERT INTO public.{table} "
                    f"({column_sql}) VALUES ({values_sql})"
                )

                connection.execute(
                    query,
                    datasets[table],
                )

                print(
                    f"IMPORTED: {table} "
                    f"({len(datasets[table])} rows)"
                )

        print("\nSUCCESS: Historical import completed")

    finally:
        engine.dispose()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()

    parser.add_argument(
        "--db-name",
        required=True,
        help="Expected development database name",
    )

    parser.add_argument(
        "--apply",
        action="store_true",
        help="Actually insert validated records",
    )

    args = parser.parse_args()

    import_data(
        expected_database=args.db_name,
        apply_changes=args.apply,
    )
