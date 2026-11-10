# Waste Prediction AI — API Contract

**Project:** Bope-Poddala Waste Prediction AI  
**Backend:** Python + FastAPI  
**Database:** PostgreSQL  
**Version:** 1.1 — Integration Draft  
**Current status:** Synthetic-data prototype; not production-ready

## 1. Base URL

Local development:

`http://127.0.0.1:8000`

API documentation:

`http://127.0.0.1:8000/docs`

The deployed base URL will be configured during system integration.

## 2. Primary Integration APIs

These endpoints retrieve forecasts saved in PostgreSQL. They are intended for integration with the team's TypeScript backend and Admin Dashboard.

### 2.1 Daily Waste Forecast

**Method:** GET  
**Endpoint:** `/forecasts/daily`

**Purpose:** Retrieve the latest saved seven-day daily waste forecast.

Example request:

`GET /forecasts/daily`

Example response (shortened from a previously tested forecast):

```json
{
  "run_id": 3,
  "forecast_as_of": "2026-11-10",
  "model_version": "rf_v1",
  "data_source": "SYNTHETIC_PROTOTYPE",
  "predictions": [
    {
      "date": "2026-11-11",
      "predicted_kg": 17011.6,
      "working_day": 1,
      "unit": "kg"
    }
  ]
}
```

The complete forecast contains seven predicted days.

**Unit:** kilograms (kg).

**Important:** This endpoint reads existing database forecasts. It does not generate a new forecast for every API request.

### 2.2 Monthly Category Forecast

**Method:** GET  
**Endpoint:** `/forecasts/monthly`

**Purpose:** Retrieve the latest saved monthly category forecasts.

Waste categories:

- Degradable waste
- Non-degradable waste

**Unit:** collection loads, not kilograms.

Previously tested forecast based on records through April 2026:

- May 2026 — Degradable: 44.5 loads
- May 2026 — Non-degradable: 7.0 loads

Monthly predictions depend on the available council monthly records. The latest saved forecast is not necessarily for the current calendar month.

**Exact JSON schema:** To be verified against the live endpoint response before integration.

### 2.3 Forecast Accuracy Monitoring

**Method:** GET  
**Endpoint:** `/forecasts/accuracy`

**Purpose:** Retrieve available information about forecast accuracy.

Accuracy evaluation requires eligible predictions and corresponding actual waste measurements.

The endpoint may report insufficient data when these matched records are unavailable.

**Exact JSON schema:** To be verified against the live endpoint response before integration.

## 3. Forecast Generation

Forecast generation and forecast retrieval are separate operations.

### 3.1 Daily Forecast Generation

**Script:** `save_forecast.py`

Run locally:

`uv run python save_forecast.py`

Responsibilities:

1. Connect to PostgreSQL.
2. Read historical collection data.
3. Read collection calendar data.
4. Check historical data freshness.
5. Load the saved Random Forest model.
6. Generate predictions for the next seven days.
7. Save or reuse the forecast run in PostgreSQL.

Database tables include:

- `daily_collection_history`
- `collection_calendar`
- `forecast_runs`
- `waste_predictions`

Daily automatic execution requires a scheduler on the deployment environment. Cloud scheduling has not yet been configured.

### 3.2 Monthly Forecast Generation

**Script:** `save_monthly_forecast.py`

Responsibilities:

1. Read monthly council collection records.
2. Run the monthly forecasting pipeline.
3. Evaluate eligible forecasting methods.
4. Select a forecasting method for each category.
5. Save monthly forecast results to PostgreSQL.

Related database tables:

- `monthly_waste_loads`
- `monthly_forecast_runs`
- `monthly_forecast_predictions`

Automatic monthly execution has not yet been configured.

## 4. Legacy Prototype APIs

These endpoints are retained for development and testing.

### 4.1 CSV-Based Daily Forecast

**Method:** GET  
**Endpoint:** `/predict/next-7-days`

Required query parameter:

`as_of_date=YYYY-MM-DD`

Example:

`GET /predict/next-7-days?as_of_date=2026-11-05`

This endpoint:

- Reads historical and calendar CSV files loaded by the application.
- Uses the saved Random Forest model.
- Generates a seven-day forecast.
- Saves the result as a local CSV file.
- Returns predictions as JSON.

### 4.2 CSV-Based Monthly Forecast

**Method:** GET  
**Endpoint:** `/predict/next-month-categories`

No query parameters required.

Response fields:

- `scores`
- `selected_methods`
- `predictions`
- `unit`
- `data_source`

This endpoint runs the monthly pipeline using local CSV data.

**These legacy CSV endpoints are not the preferred integration interfaces.**

## 5. Error Handling

For legacy CSV endpoints:

- HTTP 400 — Invalid historical reference or monthly input data.
- HTTP 404 — Required monthly CSV file not found.
- HTTP 422 — Missing or invalid required query parameter.
- HTTP 500 — Unexpected server error.

Database-backed endpoints may return errors for unavailable database connections, missing saved forecasts, or insufficient monitoring data.

**Exact HTTP status codes and response schemas for database-backed endpoints must be verified against the implementation.**

## 6. Data Quality and Limitations

Daily forecasting currently uses a synthetic-data prototype.

Known limitations:

- Most daily historical records are synthetic.
- Seven actual council audit observations were incorporated.
- Daily historical data was last reported through October 24, 2026.
- The November 10 forecasting run identified 11 missing scheduled working days.
- Prototype mode permits forecasting with stale historical data while reporting warnings.
- Daily predictions have not yet been validated sufficiently for live operational decision-making.

Monthly forecasts use council monthly collection-load records, which require operational verification.

Daily and monthly forecast units must not be mixed.

## 7. System Integration

Intended architecture:

**Scheduled AI forecasting job → PostgreSQL → FastAPI → TypeScript backend → Admin Dashboard**

The TypeScript backend will consume the database-backed FastAPI endpoints.

The separately developed React prototype frontend is not required for final integration.

Before deployment, the team must agree on:

- Hosted API base URL
- Authentication and authorization
- Network access and CORS requirements
- PostgreSQL hosting and credentials
- API error handling
- Daily and monthly scheduling
- Historical data updates and freshness
- Monitoring and deployment procedures

## 8. Deployment Status

**Currently verified:**

- Python and FastAPI run locally.
- PostgreSQL connection works.
- Daily forecast generation runs locally.
- Existing daily forecasts can be retrieved from PostgreSQL.
- Local PowerShell forecasting script executes successfully.
- Forecast duplicate-run protection has been observed.

**Not yet confirmed as production-ready:**

- Cloud deployment
- Cloud automatic scheduler
- Production-grade authentication
- Real daily collection-data pipeline
- Production model validation
- Final TypeScript backend integration
- Deployment-specific API response and error verification

## 9. Testing

Previously reported testing includes:

- Daily prediction API regression
- Monthly prediction API regression
- Invalid historical date handling
- Missing query parameter handling
- Monthly negative-value rejection
- Missing-month detection
- Monthly method selection
- Model fitting failure handling
- Naive fallback testing

These results should be rerun and verified in the deployment environment.

---

**Document status:** Draft for backend integration review. Final API response schemas, error responses, and deployment configuration require verification before release.