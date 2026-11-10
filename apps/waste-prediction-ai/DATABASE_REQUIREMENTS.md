# Waste Prediction AI — PostgreSQL Integration Requirements

**Project:** Bope-Poddala Waste Prediction AI  
**Status:** Local PostgreSQL prototype implemented; shared-system integration pending  
**Backend:** Python, FastAPI, SQLAlchemy  
**Database:** PostgreSQL

## 1. Purpose

This document describes the database requirements for integrating the Waste Prediction AI module with the existing Bope-Poddala waste management system.

The AI module originally used local CSV files for daily and monthly forecasting.

PostgreSQL integration has since been implemented and tested locally. The current database-backed workflows support historical data retrieval, forecast generation, forecast persistence and API-based forecast retrieval.

Integration with the team's shared database and main TypeScript backend has not yet been completed.

Existing database schemas must be reviewed before any integration-related changes.

## 2. Daily Waste Forecasting

**Current database input:** `daily_collection_history`

**Legacy prototype input:** `data/history.csv`

Required logical fields:

| Field | Data type | Description |
|---|---|---|
| date | DATE | Collection date |
| collected_kg | NUMERIC | Total collected waste in kilograms |

Requirements:

- One daily total per collection date
- No negative collected weights
- Valid collection dates
- Historical records ordered chronologically for forecasting
- Consistent handling of missing dates
- Identification of scheduled working days and collection holidays
- Clear distinction between actual and synthetic records
- Updated historical records before operational forecasting

The Random Forest model was trained on synthetic data. Seven actual council audit measurements have been incorporated into the local historical database.

The current model has not been validated sufficiently using real operational data.

## 3. Collection Calendar

**Current database input:** `collection_calendar`

**Legacy prototype input:** `data/calendar.csv`

Required logical fields:

| Field | Data type | Description |
|---|---|---|
| date | DATE | Calendar date |
| working_day | INTEGER | 1 = scheduled collection day, 0 = non-collection day |

Requirements:

- Calendar must cover all future forecast dates
- Weekends, public holidays and Poya days must follow the applicable council collection schedule
- No duplicate calendar dates
- Collection schedule changes must be reflected
- Future calendar records must be maintained
- Daily forecasting requires coverage for the seven days following the forecast reference date

The local calendar database previously contained 457 records covering October 2026 through December 2027.

## 4. Monthly Category Forecasting

**Current database input:** `monthly_waste_loads`

**Legacy prototype input:** `data/monthly_loads.csv`

Required logical fields:

| Field | Data type | Description |
|---|---|---|
| month | DATE or YYYY-MM | Collection month |
| nondeg_loads | NUMERIC | Non-degradable collection loads |
| deg_loads | NUMERIC | Degradable collection loads |
| status | TEXT | Record confirmation status |

Requirements:

- One record per month
- No duplicate months
- No negative collection loads
- Confirmed records must form a continuous monthly sequence
- Only confirmed records may be used for operational forecasting
- Monthly source records must be updated regularly

**Important:** Monthly forecasts use collection loads, not kilograms.

The previously tested local dataset contained confirmed historical records through April 2026, producing forecasts for May 2026.

Newer confirmed records are required for current operational forecasts.

## 5. Forecast Output Storage

### Daily Forecast

Current tables:

- `forecast_runs`
- `waste_predictions`

Required information:

- Forecast reference date
- Predicted collection date
- Predicted kilograms
- Working-day indicator
- Model version
- Data provenance
- Forecast run identifier

The local workflow supports reusing an existing forecast run for the same reference date instead of inserting duplicates.

### Monthly Forecast

Current tables:

- `monthly_forecast_runs`
- `monthly_forecast_predictions`

Required information:

- Forecast month
- Waste category
- Predicted collection loads
- Selected forecasting method
- Actual forecasting method after fallback, where applicable
- Available evaluation metrics
- Forecast run identifier

Exact physical column names and database constraints must be verified against the existing PostgreSQL schema.

## 6. Historical Record Traceability

Existing local table:

`daily_collection_history_replacements`

Purpose:

Preserve information about historical data replacements when verified actual collection measurements replace synthetic prototype values.

Requirements:

- Protect verified actual measurements
- Record replacements where applicable
- Avoid accidental duplicate imports
- Preserve data provenance
- Do not overwrite operational records without authorization

## 7. Integration Workflow

Current database-backed daily workflow:

1. Read historical collection records from PostgreSQL.
2. Read collection calendar data.
3. Validate data and assess history freshness.
4. Load the trained Random Forest model.
5. Generate the next seven days of predictions.
6. Validate forecast outputs.
7. Save or reuse the forecast run in PostgreSQL.
8. Make saved predictions available through FastAPI.

Primary integration endpoints:

- `GET /forecasts/daily`
- `GET /forecasts/monthly`
- `GET /forecasts/accuracy`

The main TypeScript backend is expected to consume these endpoints for the Admin Dashboard.

## 8. Responsibilities

### Waste Prediction AI Module

- Historical input validation
- Feature engineering
- Model inference
- Model evaluation
- Daily and monthly prediction generation
- Data freshness checks
- Local database connection logic
- Forecast persistence within the AI module
- Forecast API endpoints
- Forecast-related error handling

### Main Backend / Integration Team

- Shared database architecture
- Authentication and authorization
- Integration with existing application modules
- Centralized access policies
- Admin Dashboard integration
- Deployment coordination

### Shared Responsibilities

- Input and output schemas
- Production data availability
- Data freshness and quality
- Database access permissions
- Scheduled execution
- Monitoring and error reporting
- Deployment architecture
- Database schema changes

## 9. Current Implementation Status

### Implemented and locally verified

- FastAPI backend
- PostgreSQL connectivity
- Daily history retrieval
- Collection calendar retrieval
- Random Forest daily forecasting
- Daily forecast persistence
- Monthly forecast persistence
- Database-backed forecast retrieval
- Local forecasting job execution
- Forecast run reuse behaviour

### Pending or requiring further verification

- Integration with the team's shared database
- TypeScript backend integration
- Cloud hosting
- Automatic cloud scheduling
- Production authentication and authorization
- Continuous ingestion of actual collection records
- Operational model validation
- Automatic model retraining
- Verification of deployment schema and constraints

## 10. Important Limitations

- The current daily model relies primarily on synthetic historical data.
- Real council measurements are insufficient to establish operational prediction accuracy.
- The latest daily history date observed was October 24, 2026.
- The November 10 run reported 11 missing scheduled working days.
- Prototype mode allows stale-history forecasts with warnings.
- Monthly non-degradable forecasting error was relatively high in previous evaluation.
- Monthly source records need updating.
- Cloud scheduling has not been configured.
- Automated model retraining has not been implemented.

## 11. Integration Principle

Do not modify existing PostgreSQL tables without reviewing the schema and agreeing on the proposed changes with the main backend and database team.

The local AI database structure should not automatically be assumed to match the shared production database structure.

All integration decisions must preserve existing application functionality, data integrity and security.

---

**Document status:** Updated local integration requirements draft. Final database schema, permissions, field mappings and deployment architecture require team verification.