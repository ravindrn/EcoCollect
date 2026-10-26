--
-- PostgreSQL database dump
--

\restrict M1aB0X3yLRLB6Ya9gaKi9PGOVzxDXdbaMHDjBrIFnkPHGjTcDMlUKZNatLQlhxh

-- Dumped from database version 16.15
-- Dumped by pg_dump version 16.15

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: postgis; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;


--
-- Name: EXTENSION postgis; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION postgis IS 'PostGIS geometry and geography spatial types and functions';


--
-- Name: Role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."Role" AS ENUM (
    'CITIZEN',
    'DRIVER',
    'ADMIN'
);


ALTER TYPE public."Role" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: citizen_profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.citizen_profiles (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    full_name text NOT NULL,
    phone text,
    address text,
    ward_division text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.citizen_profiles OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    email text NOT NULL,
    password_hash text NOT NULL,
    role public."Role" DEFAULT 'CITIZEN'::public."Role" NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Data for Name: citizen_profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.citizen_profiles (id, user_id, full_name, phone, address, ward_division, created_at, updated_at) FROM stdin;
9032e64e-c66d-43fb-b072-7ae12dc9402e	463af20b-1fe4-4e06-8ab9-4722012ef510	Test User	\N	\N	Bope	2026-10-15 14:37:21.594	2026-10-15 14:37:21.594
036f924d-9fa5-4936-b121-b1b7dd450345	d3d872ac-7833-44d9-b278-a1ddf1866330	Test	0700000000	\N	Bope	2026-10-15 14:53:29.149	2026-10-15 14:53:29.149
cf4da6f3-2db0-4ddd-b663-f84f0ea19c5f	712a3da3-7e62-4f5c-b4ab-4a202fef20c5	Ravindu	0767049291	\N	Bope	2026-10-15 15:16:19.691	2026-10-15 15:16:19.691
249bab6a-3710-4799-9937-b4b4bb4c11f8	2b17ff7b-0a89-4d68-b98e-0d4a1724170a	Test	0710000000	\N	Bope	2026-10-16 13:54:53.793	2026-10-16 13:54:53.793
\.


--
-- Data for Name: spatial_ref_sys; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.spatial_ref_sys (srid, auth_name, auth_srid, srtext, proj4text) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, password_hash, role, is_active, created_at, updated_at) FROM stdin;
463af20b-1fe4-4e06-8ab9-4722012ef510	test@example.com	$argon2id$v=19$m=65536,p=1,t=3$8Guzu18J9pbwPYW9SJVhqg$8k/Tw9EROH9hg4XTLxkLJfk367LrbOBSYHmuBfS/MqY	CITIZEN	t	2026-10-15 14:37:21.594	2026-10-15 14:37:21.594
d3d872ac-7833-44d9-b278-a1ddf1866330	test@gmail.com	$argon2id$v=19$m=65536,p=1,t=3$GyEDc8GNYZ6SL2a0fPNl/w$W/3ivOuabdWTWzIAPO/5yL5HDUKR4rOkNxx2uyTJbhs	CITIZEN	t	2026-10-15 14:53:29.149	2026-10-15 14:53:29.149
712a3da3-7e62-4f5c-b4ab-4a202fef20c5	ravinducoc123@gmail.com	$argon2id$v=19$m=65536,p=1,t=3$Aj+Sju9OXS95sYzLIWsd1A$f9FK8yC/z3pYt3gE/HwSIcPhnN8MyHiwU0WjazTDp2M	CITIZEN	t	2026-10-15 15:16:19.691	2026-10-15 15:16:19.691
2b17ff7b-0a89-4d68-b98e-0d4a1724170a	test@test.com	$argon2id$v=19$m=65536,p=1,t=3$7fwox8yFmu5tBAK9LKr3Jg$d3f/oEgm1csLEQNFoVCorka79uWDPJzzlQnWuuphIcg	CITIZEN	t	2026-10-16 13:54:53.793	2026-10-16 13:54:53.793
\.


--
-- Name: citizen_profiles citizen_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.citizen_profiles
    ADD CONSTRAINT citizen_profiles_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: citizen_profiles_user_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX citizen_profiles_user_id_key ON public.citizen_profiles USING btree (user_id);


--
-- Name: citizen_profiles_ward_division_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX citizen_profiles_ward_division_idx ON public.citizen_profiles USING btree (ward_division);


--
-- Name: users_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_created_at_idx ON public.users USING btree (created_at);


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: users_role_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_role_idx ON public.users USING btree (role);


--
-- Name: citizen_profiles citizen_profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.citizen_profiles
    ADD CONSTRAINT citizen_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict M1aB0X3yLRLB6Ya9gaKi9PGOVzxDXdbaMHDjBrIFnkPHGjTcDMlUKZNatLQlhxh

