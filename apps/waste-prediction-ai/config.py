
import os
from dotenv import load_dotenv

load_dotenv()

APP_MODE = os.getenv(
    "APP_MODE",
    "prototype"
).strip().lower()

if APP_MODE not in {"prototype", "production"}:
    raise ValueError(
        "APP_MODE must be 'prototype' or 'production'"
    )

MAX_MISSING_WORKING_DAYS = 1
