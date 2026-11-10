# Waste Prediction AI — Bope-Poddala

## Project Overview

Waste Prediction AI is a Python-based forecasting service developed for the Bope-Poddala waste management system.

It provides two forecasting capabilities:

1. **Daily waste forecasting:** Predicts collected waste quantities for the next seven days, measured in kilograms (kg).
2. **Monthly category forecasting:** Predicts degradable and non-degradable waste collection loads for the following available forecast month.

The module uses FastAPI to expose forecast data for integration with the main waste management system.

**Current status:** Local PostgreSQL-integrated research prototype. Not yet validated for production operation.

## Technologies

- Python 3.12
- FastAPI and Uvicorn
- Scikit-learn
- Pandas and NumPy
- Statsmodels
- Joblib
- SQLAlchemy and Psycopg
- PostgreSQL
- uv (Python dependency management)

Additional dependencies are defined in `pyproject.toml` and `uv.lock`.

## System Architecture

The intended integrated workflow is:

```text
Historical collection data
          |
          v
     PostgreSQL
          |
          v
  Forecast generation
          |
          v
     PostgreSQL
          |
          v
       FastAPI
          |
          v
  TypeScript backend
          |
          v
    Admin Dashboard
```

The forecasting process and API request handling are separate operations.

Forecasting scripts generate and save predictions. FastAPI database-backed endpoints retrieve the latest saved forecasts.

The team's Admin Dashboard will provide the final user interface. The independently developed React prototype is not required for backend integration.

## Forecasting Models

### Daily Forecasting

**Model:** Random Forest Regressor

**Output:** Next seven days of forecast collection quantities in kilograms.

Features include:

- Day of week
- Working-day indicator
- Lag-7
- Lag-14
- Rolling seven-day historical average

The existing saved model is located at:

`models/random_forest_v1.joblib`

Daily forecasting currently relies primarily on synthetic historical data.

Seven actual council audit measurements have been incorporated into the local historical database. This does not constitute sufficient real-world validation of the model.

### Monthly Forecasting

Monthly predictions are generated separately for:

- Degradable collection loads
- Non-degradable collection loads

The forecasting pipeline evaluates:

1. Naive
2. Mean3
3. Simple Exponential Smoothing (SES)
4. Ridge AR(1)
5. ARIMA

Evaluation uses rolling-origin testing, MAE and WAPE, followed by method selection and fallback handling.

The previously tested monthly dataset contained records through April 2026.

**Important:** Monthly collection loads must not be interpreted as kilograms.

## Project Structure

```text
waste-prediction-api/
|
|-- main.py
|-- forecast_api.py
|-- forecasting.py
|-- save_forecast.py
|-- save_monthly_forecast.py
|-- database.py
|-- config.py
|-- freshness.py
|
|-- monthly/
|   |-- methods.py
|   |-- evaluation.py
|   |-- selection.py
|   |-- pipeline.py
|
|-- models/
|-- data/
|-- tests (test_*.py)
|
|-- pyproject.toml
|-- uv.lock
|-- .python-version
|-- .env.example
|
|-- API_CONTRACT.md
|-- DATABASE_MAPPING.md
|-- DATABASE_REQUIREMENTS.md
|-- README.md
```

This is a simplified structure showing important project components. The repository may also contain supporting import utilities and local development scripts.

## Local Installation

### 1. Requirements

Install:

- Python 3.12
- uv
- PostgreSQL, or access to an existing PostgreSQL server

### 2. Install Python dependencies

Open the project directory and run:

```powershell
uv sync --locked
```

This uses the existing dependency configuration.

### 3. Configure environment variables

Create a local `.env` file using `.env.example` as a reference.

Example variables:

```env
DATABASE_URL=postgresql+psycopg://USERNAME:PASSWORD@HOST:5432/DATABASE_NAME
APP_MODE=prototype
MAX_MISSING_WORKING_DAYS=1
```

Replace placeholders with environment-specific values.

Never commit real database credentials to GitHub.

**Note:** `.env.example` must be created before publishing the repository if it does not already exist.

### 4. Database setup

The backend requires an accessible PostgreSQL database with the expected tables and data.

Local prototype tables include:

- `daily_collection_history`
- `collection_calendar`
- `daily_collection_history_replacements`
- `forecast_runs`
- `waste_predictions`
- `monthly_waste_loads`
- `monthly_forecast_runs`
- `monthly_forecast_predictions`

**The current repository does not have a verified automated database migration/setup procedure.**

A PostgreSQL schema backup, migration workflow or approved database initialization procedure is required for clean deployment.

Copying the Python project files alone does not transfer PostgreSQL tables and records.

## Running the FastAPI Server

For local development:

```powershell
uv run uvicorn main:app --reload
```

API documentation:

`http://127.0.0.1:8000/docs`

This is a development command. Production hosting requires a separate server deployment configuration.

## API Endpoints

### Database-Backed Integration APIs

These are the preferred endpoints for integration with the main system.

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/forecasts/daily` | Latest saved daily forecast |
| GET | `/forecasts/monthly` | Latest saved monthly category forecast |
| GET | `/forecasts/accuracy` | Available forecast accuracy information |

These endpoints retrieve information from PostgreSQL.

They do not automatically generate new forecasts on every API request.

Exact response schemas and error behaviour should be verified against the running service.

### Legacy CSV-Based Prototype APIs

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/predict/next-7-days` | Generate a CSV-based seven-day forecast |
| GET | `/predict/next-month-categories` | Generate a CSV-based monthly forecast |

The legacy daily endpoint requires:

`as_of_date=YYYY-MM-DD`

Example:

`/predict/next-7-days?as_of_date=2026-11-05`

These prototype endpoints are not the preferred integration interfaces.

For detailed endpoint information, see `API_CONTRACT.md`.

## Forecast Generation

### Daily Forecast

The daily forecasting script is:

`save_forecast.py`

To execute manually:

```powershell
uv run python save_forecast.py
```

The script:

1. Connects to PostgreSQL.
2. Loads daily collection history and calendar data.
3. Checks the freshness of historical records.
4. Loads the saved Random Forest model.
5. Generates a forecast for the next seven days.
6. Saves a new forecast run or reuses an existing run where applicable.

A previous local test successfully reused forecast run ID 3 for November 10, 2026.

### Monthly Forecast

Monthly forecast generation is handled by:

`save_monthly_forecast.py`

It reads monthly collection records, executes the monthly forecasting pipeline and stores results in PostgreSQL.

## Automation

The repository contains:

`run_daily_forecast.ps1`

This PowerShell script runs the daily Python forecasting job and records execution logs.

It has been tested manually on Windows.

**Automatic daily scheduling is not yet confirmed as enabled.**

For cloud deployment, a scheduled job must execute the daily forecasting script using the deployed Python environment and database configuration.

The scheduler must account for Sri Lanka local time (Asia/Colombo).

Monthly forecast scheduling should be configured separately where required.

## Testing

The repository contains standalone testing and diagnostic scripts, including:

```powershell
uv run python test_pipeline.py
uv run python test_api.py
uv run python test_invalid_monthly.py
uv run python test_missing_month.py
uv run python test_pipeline_fallback.py
```

Some tests may require configured local files or PostgreSQL access.

Tests should be reviewed and rerun before deployment. Previously reported successful tests do not guarantee production readiness.

## Data Sources and Quality

### Daily Collection History

The current daily forecasting model was trained using synthetic prototype data.

The local historical database contains predominantly synthetic records, with seven verified audit observations incorporated.

The latest observed historical date was October 24, 2026.

A November 10, 2026 forecasting run detected 11 missing scheduled working days.

Prototype mode allows forecasts to continue with warnings when the history is stale.

### Monthly Collection Records

Monthly forecasting uses council collection-load records.

The previously tested historical dataset ended in April 2026.

Newer confirmed records are required to generate current operational monthly forecasts.

## Security and Repository Rules

Do not commit:

- `.env`
- `.venv/`
- Database credentials
- Runtime logs
- Local caches
- Sensitive records or unapproved database exports

Review datasets and model artifacts before publishing.

The service requires an approved authentication and authorization design before deployment.

## Integration with the Main System

The final integration architecture is:

**FastAPI AI service → Main TypeScript backend → Admin Dashboard**

The AI service will be deployed separately or as a managed component of the main system.

The main backend will access the documented FastAPI forecast endpoints.

Integration responsibilities include:

- Defining the deployed API URL
- Authentication and authorization
- Shared or separate database decisions
- Data source mapping
- Forecast scheduling
- API error handling
- Monitoring and logging

The independently developed React frontend will remain outside this backend repository.

## Current Limitations

- Daily forecasting accuracy on real council data is not established.
- Historical daily data is mainly synthetic.
- Daily collection history is outdated.
- Monthly records require updating.
- Non-degradable monthly forecasts showed relatively high historical error.
- Automated retraining has not been implemented.
- Cloud deployment and scheduling have not been configured.
- Team backend integration remains pending.
- Production security, monitoring and operational validation remain incomplete.

## Project Status

**Locally implemented and tested:**

- Random Forest daily forecasting
- Monthly statistical forecasting
- PostgreSQL connections and persistence
- FastAPI forecast retrieval
- Local daily forecasting script execution
- Duplicate daily forecast run handling

**Still required for integration:**

- Verify and finalize database schema setup
- Verify API contracts and security
- Deploy the backend service
- Configure scheduled forecasting
- Connect the main TypeScript backend
- Establish real collection-data ingestion and model validation

---

**Project status: Research prototype with locally verified database-backed forecasting. Not yet production-ready.**