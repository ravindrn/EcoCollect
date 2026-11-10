--
-- PostgreSQL database dump
--

\restrict 5aqRA6TU8h4zY3PpYKDaya1ozueiGsqQMvJas0HC6JrgkvHS5imUPE6ektyeodQ

-- Dumped from database version 18.6
-- Dumped by pg_dump version 18.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: collection_calendar; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.collection_calendar (
    date date NOT NULL,
    working_day integer NOT NULL,
    CONSTRAINT collection_calendar_working_day_check CHECK ((working_day = ANY (ARRAY[0, 1])))
);


--
-- Name: daily_collection_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.daily_collection_history (
    date date NOT NULL,
    collected_kg double precision NOT NULL,
    source_type character varying(20) NOT NULL,
    CONSTRAINT daily_collection_history_collected_kg_check CHECK ((collected_kg >= (0)::double precision)),
    CONSTRAINT daily_collection_history_source_type_check CHECK (((source_type)::text = ANY (ARRAY[('actual'::character varying)::text, ('synthetic'::character varying)::text])))
);


--
-- Name: daily_collection_history_replacements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.daily_collection_history_replacements (
    id bigint NOT NULL,
    record_date date NOT NULL,
    previous_kg double precision NOT NULL,
    previous_source character varying(20) NOT NULL,
    replacement_kg double precision NOT NULL,
    replacement_source character varying(20) CONSTRAINT daily_collection_history_replacemen_replacement_source_not_null NOT NULL,
    changed_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: daily_collection_history_replacements_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.daily_collection_history_replacements ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.daily_collection_history_replacements_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: forecast_runs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.forecast_runs (
    id bigint NOT NULL,
    forecast_as_of date NOT NULL,
    model_version character varying(50) NOT NULL,
    data_source character varying(50) NOT NULL,
    status character varying(20) DEFAULT 'completed'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT forecast_runs_status_check CHECK (((status)::text = ANY (ARRAY[('completed'::character varying)::text, ('failed'::character varying)::text])))
);


--
-- Name: forecast_runs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.forecast_runs ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.forecast_runs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: monthly_forecast_predictions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.monthly_forecast_predictions (
    id bigint NOT NULL,
    run_id bigint NOT NULL,
    category character varying(30) NOT NULL,
    selected_method character varying(50) NOT NULL,
    actual_method character varying(50) NOT NULL,
    predicted_loads double precision NOT NULL,
    unit character varying(10) DEFAULT 'loads'::character varying NOT NULL,
    CONSTRAINT monthly_forecast_predictions_category_check CHECK (((category)::text = ANY (ARRAY[('deg_loads'::character varying)::text, ('nondeg_loads'::character varying)::text]))),
    CONSTRAINT monthly_forecast_predictions_predicted_loads_check CHECK ((predicted_loads >= (0)::double precision)),
    CONSTRAINT monthly_forecast_predictions_unit_check CHECK (((unit)::text = 'loads'::text))
);


--
-- Name: monthly_forecast_predictions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.monthly_forecast_predictions ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.monthly_forecast_predictions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: monthly_forecast_runs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.monthly_forecast_runs (
    id bigint NOT NULL,
    forecast_month date NOT NULL,
    data_through_month date NOT NULL,
    data_source character varying(50) NOT NULL,
    status character varying(20) DEFAULT 'completed'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    input_hash character varying(64),
    CONSTRAINT monthly_forecast_runs_status_check CHECK (((status)::text = ANY (ARRAY[('completed'::character varying)::text, ('failed'::character varying)::text])))
);


--
-- Name: monthly_forecast_runs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.monthly_forecast_runs ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.monthly_forecast_runs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: monthly_waste_loads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.monthly_waste_loads (
    month date NOT NULL,
    nondeg_loads double precision NOT NULL,
    deg_loads double precision NOT NULL,
    status character varying(20) NOT NULL,
    CONSTRAINT monthly_waste_loads_deg_loads_check CHECK ((deg_loads >= (0)::double precision)),
    CONSTRAINT monthly_waste_loads_nondeg_loads_check CHECK ((nondeg_loads >= (0)::double precision))
);


--
-- Name: waste_predictions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.waste_predictions (
    id bigint NOT NULL,
    run_id bigint NOT NULL,
    target_date date NOT NULL,
    predicted_kg double precision NOT NULL,
    working_day integer NOT NULL,
    unit character varying(10) DEFAULT 'kg'::character varying NOT NULL,
    CONSTRAINT waste_predictions_predicted_kg_check CHECK ((predicted_kg >= (0)::double precision)),
    CONSTRAINT waste_predictions_unit_check CHECK (((unit)::text = 'kg'::text)),
    CONSTRAINT waste_predictions_working_day_check CHECK ((working_day = ANY (ARRAY[0, 1])))
);


--
-- Name: waste_predictions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.waste_predictions ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.waste_predictions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: collection_calendar collection_calendar_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.collection_calendar
    ADD CONSTRAINT collection_calendar_pkey PRIMARY KEY (date);


--
-- Name: daily_collection_history daily_collection_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_collection_history
    ADD CONSTRAINT daily_collection_history_pkey PRIMARY KEY (date);


--
-- Name: daily_collection_history_replacements daily_collection_history_replacements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_collection_history_replacements
    ADD CONSTRAINT daily_collection_history_replacements_pkey PRIMARY KEY (id);


--
-- Name: forecast_runs forecast_runs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.forecast_runs
    ADD CONSTRAINT forecast_runs_pkey PRIMARY KEY (id);


--
-- Name: monthly_forecast_predictions monthly_forecast_predictions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.monthly_forecast_predictions
    ADD CONSTRAINT monthly_forecast_predictions_pkey PRIMARY KEY (id);


--
-- Name: monthly_forecast_predictions monthly_forecast_predictions_run_id_category_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.monthly_forecast_predictions
    ADD CONSTRAINT monthly_forecast_predictions_run_id_category_key UNIQUE (run_id, category);


--
-- Name: monthly_forecast_runs monthly_forecast_runs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.monthly_forecast_runs
    ADD CONSTRAINT monthly_forecast_runs_pkey PRIMARY KEY (id);


--
-- Name: monthly_waste_loads monthly_waste_loads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.monthly_waste_loads
    ADD CONSTRAINT monthly_waste_loads_pkey PRIMARY KEY (month);


--
-- Name: waste_predictions waste_predictions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.waste_predictions
    ADD CONSTRAINT waste_predictions_pkey PRIMARY KEY (id);


--
-- Name: waste_predictions waste_predictions_run_id_target_date_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.waste_predictions
    ADD CONSTRAINT waste_predictions_run_id_target_date_key UNIQUE (run_id, target_date);


--
-- Name: monthly_forecast_predictions monthly_forecast_predictions_run_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.monthly_forecast_predictions
    ADD CONSTRAINT monthly_forecast_predictions_run_id_fkey FOREIGN KEY (run_id) REFERENCES public.monthly_forecast_runs(id) ON DELETE CASCADE;


--
-- Name: waste_predictions waste_predictions_run_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.waste_predictions
    ADD CONSTRAINT waste_predictions_run_id_fkey FOREIGN KEY (run_id) REFERENCES public.forecast_runs(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict 5aqRA6TU8h4zY3PpYKDaya1ozueiGsqQMvJas0HC6JrgkvHS5imUPE6ektyeodQ

