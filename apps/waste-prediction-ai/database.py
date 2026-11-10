
import os

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url


load_dotenv()


def get_engine():
    database_url = os.getenv("DATABASE_URL")

    if not database_url:
        raise RuntimeError(
            "DATABASE_URL is not configured"
        )

    # Validate the URL without displaying its credentials
    url = make_url(database_url)

    if url.get_backend_name() != "postgresql":
        raise ValueError(
            "DATABASE_URL must use PostgreSQL"
        )

    return create_engine(
        url,
        pool_pre_ping=True,
        connect_args={"connect_timeout": 5}
    )


def check_database_connection():
    engine = get_engine()

    try:
        with engine.connect() as connection:
            result = connection.execute(
                text("SELECT 1")
            )
            return result.scalar_one() == 1
    finally:
        engine.dispose()


if __name__ == "__main__":
    try:
        if check_database_connection():
            print("PASS: PostgreSQL connection successful")
    except Exception as error:
        print(
            "Database connection unavailable:",
            type(error).__name__
        )
