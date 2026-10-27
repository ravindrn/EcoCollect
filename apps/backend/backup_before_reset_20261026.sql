--
-- PostgreSQL database dump
--

\restrict U9UwMoabn1hDL5IA1UfPs1KoEZb03fohMSb8xVY77inz1b7tLCR50ot9Zu7tJnf

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
-- Name: AnnouncementPriority; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."AnnouncementPriority" AS ENUM (
    'NORMAL',
    'IMPORTANT',
    'URGENT'
);


ALTER TYPE public."AnnouncementPriority" OWNER TO postgres;

--
-- Name: AnnouncementStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."AnnouncementStatus" AS ENUM (
    'DRAFT',
    'PUBLISHED',
    'ARCHIVED'
);


ALTER TYPE public."AnnouncementStatus" OWNER TO postgres;

--
-- Name: ComplaintCategory; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ComplaintCategory" AS ENUM (
    'OVERFLOW',
    'MISSED_PICKUP',
    'ILLEGAL_DUMPING',
    'BURNING',
    'DAMAGED_BIN',
    'OTHER'
);


ALTER TYPE public."ComplaintCategory" OWNER TO postgres;

--
-- Name: ComplaintStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ComplaintStatus" AS ENUM (
    'OPEN',
    'IN_PROGRESS',
    'RESOLVED',
    'REJECTED'
);


ALTER TYPE public."ComplaintStatus" OWNER TO postgres;

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
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO postgres;

--
-- Name: announcements; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.announcements (
    id uuid NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    priority public."AnnouncementPriority" DEFAULT 'NORMAL'::public."AnnouncementPriority" NOT NULL,
    status public."AnnouncementStatus" DEFAULT 'DRAFT'::public."AnnouncementStatus" NOT NULL,
    published_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.announcements OWNER TO postgres;

--
-- Name: areas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.areas (
    id uuid NOT NULL,
    name text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.areas OWNER TO postgres;

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
    updated_at timestamp(3) without time zone NOT NULL,
    area_id uuid
);


ALTER TABLE public.citizen_profiles OWNER TO postgres;

--
-- Name: community_comments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.community_comments (
    id uuid NOT NULL,
    content text NOT NULL,
    update_id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.community_comments OWNER TO postgres;

--
-- Name: community_reactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.community_reactions (
    id uuid NOT NULL,
    update_id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.community_reactions OWNER TO postgres;

--
-- Name: community_updates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.community_updates (
    id uuid NOT NULL,
    content text NOT NULL,
    user_id uuid NOT NULL,
    area_id uuid NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.community_updates OWNER TO postgres;

--
-- Name: complaints; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.complaints (
    id uuid NOT NULL,
    reporter_id uuid NOT NULL,
    category public."ComplaintCategory" NOT NULL,
    status public."ComplaintStatus" DEFAULT 'OPEN'::public."ComplaintStatus" NOT NULL,
    description text NOT NULL,
    photo_url text,
    latitude double precision,
    longitude double precision,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.complaints OWNER TO postgres;

--
-- Name: health_checks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.health_checks (
    id text NOT NULL,
    "checkedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.health_checks OWNER TO postgres;

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
-- Name: vehicle_locations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.vehicle_locations (
    id uuid NOT NULL,
    vehicle_id uuid NOT NULL,
    latitude double precision NOT NULL,
    longitude double precision NOT NULL,
    speed double precision,
    heading double precision,
    recorded_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.vehicle_locations OWNER TO postgres;

--
-- Name: vehicles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.vehicles (
    id uuid NOT NULL,
    plate_number text NOT NULL,
    name text,
    driver_id uuid,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.vehicles OWNER TO postgres;

--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
57a747b2-6877-4957-8dcb-1ec947529c82	18a510c5f54a0d7055b5686cadecfd9be4589021ce2bdbf229fdf0470518cd27	2026-10-19 12:00:53.752584+05:30	20261014163529_init	\N	\N	2026-10-19 12:00:53.743717+05:30	1
33b927a8-aee5-4eb4-9c17-d24530ee4078	4f07001f78ce550f7280ad407ecc1b6d9e959037b9b65165f5a8ee8b75b94d26	2026-10-19 12:00:53.786189+05:30	20261014172842_add_user_and_citizen_profile	\N	\N	2026-10-19 12:00:53.753034+05:30	1
29522e11-7ac9-4b79-9f27-2595303868ff	ace55db2e55689004f364f7a4cd65b5d4a5b8022eb98d4c9d6098a1a1f934ed8	2026-10-19 12:00:53.80075+05:30	20261018072800_add_area_model	\N	\N	2026-10-19 12:00:53.786587+05:30	1
b2f4ab36-348a-4d7e-8176-80c521c34ec6	1db9652cd726cb9825731da2389ca0c4c67f2018b181e5e1bea3e731da0ad61e	2026-10-19 12:00:53.810941+05:30	20261018155525_add_announcements	\N	\N	2026-10-19 12:00:53.801122+05:30	1
2c0b64e2-9f5d-4f92-8604-cee548b48028	58e7d2127b36a81dbf8e7b329fbc1d53125a55d8ec7364c120c875c24b2d33a7	2026-10-19 12:00:53.850811+05:30	20261018235545_add_community_updates	\N	\N	2026-10-19 12:00:53.811418+05:30	1
44eba9fc-20b9-480b-aaf5-dbc647445257	368f62406523b88ac8ade6488530e3a2d6239d53e26cc683645da5080c1cea7e	2026-10-20 10:01:53.623298+05:30	20261020043153_add_complaints	\N	\N	2026-10-20 10:01:53.539735+05:30	1
5def1463-f676-449b-85ad-2660ed464e77	ed12c66560e6f681eb4958c527fe9d53bf97622e2db3386761e8f3659b9f1798	2026-10-21 20:25:10.193774+05:30	20261021145510_add_vehicles_and_locations	\N	\N	2026-10-21 20:25:10.109426+05:30	1
9d00d896-a30d-4109-bf28-a036c3741494	18b8058b70a62127de1e137ea0d01b97799cf52654476845e950203a1fad0ef1	\N	20261020054346_add_complaints	A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20261020054346_add_complaints\n\nDatabase error code: 42710\n\nDatabase error:\nERROR: type "ComplaintStatus" already exists\n\nDbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42710), message: "type \\"ComplaintStatus\\" already exists", detail: None, hint: None, position: None, where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("typecmds.c"), line: Some(1177), routine: Some("DefineEnum") }\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name="20261020054346_add_complaints"\n             at schema-engine\\connectors\\sql-schema-connector\\src\\apply_migration.rs:113\n   1: schema_commands::commands::apply_migrations::Applying migration\n           with migration_name="20261020054346_add_complaints"\n             at schema-engine\\commands\\src\\commands\\apply_migrations.rs:95\n   2: schema_core::state::ApplyMigrations\n             at schema-engine\\core\\src\\state.rs:255	\N	2026-10-26 16:05:22.017124+05:30	0
\.


--
-- Data for Name: announcements; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.announcements (id, title, description, priority, status, published_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: areas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.areas (id, name, is_active, created_at, updated_at) FROM stdin;
af799869-48bc-4d01-8e50-03744b5db291	Area A	t	2026-10-19 19:25:58.712	2026-10-19 19:25:58.712
cd50d9fe-cd43-48d6-932d-495db2e0b375	Area B	t	2026-10-19 19:25:58.712	2026-10-19 19:25:58.712
39c561ec-a9d1-4b26-8423-30afad62af5a	Area C	t	2026-10-19 19:25:58.712	2026-10-19 19:25:58.712
01dd7f75-bb05-48ed-9834-50290e45d902	Area D	t	2026-10-19 19:25:58.712	2026-10-19 19:25:58.712
5ae184cd-59a9-46fc-a6a4-94c893944aed	Area E	t	2026-10-19 19:25:58.712	2026-10-19 19:25:58.712
\.


--
-- Data for Name: citizen_profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.citizen_profiles (id, user_id, full_name, phone, address, ward_division, created_at, updated_at, area_id) FROM stdin;
1369a080-1e5c-4a87-b77b-08993e4340fd	fed2f400-eec2-48fc-a754-8f5c73c0aa69	Ravindu Nadeesha	+94767049291	\N	\N	2026-10-19 14:04:55.52	2026-10-19 14:04:55.52	af799869-48bc-4d01-8e50-03744b5db291
65fe042b-cfc4-4d38-adda-14ace8ab74aa	2207c886-135c-487c-8c50-b03e79af1057	test	0767049391	\N	\N	2026-10-19 18:01:01.148	2026-10-19 18:01:01.148	39c561ec-a9d1-4b26-8423-30afad62af5a
\.


--
-- Data for Name: community_comments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.community_comments (id, content, update_id, user_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: community_reactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.community_reactions (id, update_id, user_id, created_at) FROM stdin;
\.


--
-- Data for Name: community_updates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.community_updates (id, content, user_id, area_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: complaints; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.complaints (id, reporter_id, category, status, description, photo_url, latitude, longitude, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: health_checks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.health_checks (id, "checkedAt") FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, password_hash, role, is_active, created_at, updated_at) FROM stdin;
fed2f400-eec2-48fc-a754-8f5c73c0aa69	ravinducoc123@gmail.com	$argon2id$v=19$m=65536,p=1,t=3$Exq0ebUAhlbSOGglzGC3Pw$Ii9N/I5xevkqdLNjI2X3q7wlJeI7J+mjnpoXfA5jMbQ	CITIZEN	t	2026-10-19 14:04:55.52	2026-10-19 14:04:55.52
2207c886-135c-487c-8c50-b03e79af1057	test@test.com	$argon2id$v=19$m=65536,p=1,t=3$/cMOSMDsN3Mh3n0q2lFAJA$wj66bapD1GNfKeyVg5LjPP5Dkp+GVvck099PSq9onDI	CITIZEN	t	2026-10-19 18:01:01.148	2026-10-19 18:01:01.148
53a8e0ef-7775-4194-80bb-cefac7ec8176	admin@ecocollect.lk	$argon2id$v=19$m=65536,p=1,t=3$sxuXWewUUxle5ai5lbCURA$+jexCvvBEZaMIzod0aMGn3mOm4wPsghtL09uD7pgI6k	ADMIN	t	2026-10-20 04:27:15.356	2026-10-20 04:27:15.356
\.


--
-- Data for Name: vehicle_locations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.vehicle_locations (id, vehicle_id, latitude, longitude, speed, heading, recorded_at) FROM stdin;
987c9206-985a-4626-b7dc-f475434de29f	4280a617-c8c7-4a09-8658-2d5ade6860be	6.9	79.905	22.16815214013385	0	2026-10-21 14:43:07.543
a3e072d1-2e33-4a9b-bc61-63315a8ec6da	4280a617-c8c7-4a09-8658-2d5ade6860be	6.901039558454089	79.90489073800367	20.469405942002513	12	2026-10-21 14:43:37.543
7f21a2ce-21fe-49cb-94e9-706343612fde	4280a617-c8c7-4a09-8658-2d5ade6860be	6.90203368321538	79.90456772728822	31.3982133906451	24	2026-10-21 14:44:07.543
d7d0cc54-3273-40d2-8f0c-b3a2002a089a	4280a617-c8c7-4a09-8658-2d5ade6860be	6.902938926261463	79.90404508497188	27.299828012920074	36	2026-10-21 14:44:37.543
cd9c8970-3b0b-4201-81ea-234762c2a20b	4280a617-c8c7-4a09-8658-2d5ade6860be	6.903715724127387	79.9033456530318	34.17022522375417	48	2026-10-21 14:45:07.543
7330a606-4902-4b42-80c3-39e17297643c	4280a617-c8c7-4a09-8658-2d5ade6860be	6.904330127018922	79.9025	32.755413648776724	59.99999999999999	2026-10-21 14:45:37.543
a1aab6df-049a-4942-847d-5cb4e2f4874a	4280a617-c8c7-4a09-8658-2d5ade6860be	6.904755282581476	79.90154508497189	23.422767050006435	72	2026-10-21 14:46:07.543
e4504a74-41bc-4a19-9e5b-178eff056dbc	4280a617-c8c7-4a09-8658-2d5ade6860be	6.904972609476841	79.90052264231635	29.704846039959833	84	2026-10-21 14:46:37.543
a95b1713-4989-44b7-9fb0-0e321cadc948	4280a617-c8c7-4a09-8658-2d5ade6860be	6.904972609476841	79.89947735768366	31.180409423675265	96	2026-10-21 14:47:07.543
dd103a58-e7bb-42d5-ada1-253547403354	4280a617-c8c7-4a09-8658-2d5ade6860be	6.904755282581476	79.89845491502813	24.800974054991414	108	2026-10-21 14:47:37.543
3b3bb081-5aa3-457e-8df7-e4f64e276be4	4280a617-c8c7-4a09-8658-2d5ade6860be	6.904330127018922	79.89750000000001	23.229953368999595	119.99999999999999	2026-10-21 14:48:07.543
119e4867-7eeb-4754-b622-f2fc22a5837e	4280a617-c8c7-4a09-8658-2d5ade6860be	6.903715724127387	79.8966543469682	32.406705692201555	132	2026-10-21 14:48:37.543
cd0b8435-1700-4693-af0c-23662632f247	4280a617-c8c7-4a09-8658-2d5ade6860be	6.902938926261463	79.89595491502813	22.03704436110867	144	2026-10-21 14:49:07.543
3e51a951-b884-452f-804f-c3cfedf66294	4280a617-c8c7-4a09-8658-2d5ade6860be	6.90203368321538	79.89543227271179	25.33716440019834	156	2026-10-21 14:49:37.543
cf1faf8c-6a43-42e9-b828-46949f68271e	4280a617-c8c7-4a09-8658-2d5ade6860be	6.901039558454089	79.89510926199634	22.20228021208441	168	2026-10-21 14:50:07.543
9de414f7-91b7-49fd-b39f-0fae966cdd9e	4280a617-c8c7-4a09-8658-2d5ade6860be	6.9	79.89500000000001	34.45359742397177	180	2026-10-21 14:50:37.543
ce84fc82-87dc-486d-be5c-358437963bcc	4280a617-c8c7-4a09-8658-2d5ade6860be	6.898960441545912	79.89510926199634	32.17460771785918	192	2026-10-21 14:51:07.543
bbd0335b-417e-4df4-9c78-3f5fd6af498c	4280a617-c8c7-4a09-8658-2d5ade6860be	6.897966316784621	79.89543227271179	21.270010188085205	204	2026-10-21 14:51:37.543
aec0e000-07e0-40dc-b63e-157925403cd9	4280a617-c8c7-4a09-8658-2d5ade6860be	6.897061073738538	79.89595491502813	29.821220324117625	216	2026-10-21 14:52:07.543
3b3a8dd9-7549-4701-bf34-9c26f535f865	4280a617-c8c7-4a09-8658-2d5ade6860be	6.896284275872613	79.8966543469682	23.43369162176847	228	2026-10-21 14:52:37.543
c4d58199-c19b-4258-9e4b-57a39b686bc4	4280a617-c8c7-4a09-8658-2d5ade6860be	6.895669872981078	79.89750000000001	23.126096113349583	239.99999999999997	2026-10-21 14:53:07.543
2ef9b4dc-32be-4bc7-a154-bfe448de568c	4280a617-c8c7-4a09-8658-2d5ade6860be	6.8952447174185245	79.89845491502813	33.155954363368465	252	2026-10-21 14:53:37.543
7e7bb64e-3523-451a-ba83-001380f1c4aa	4280a617-c8c7-4a09-8658-2d5ade6860be	6.895027390523159	79.89947735768366	20.98530549360253	264	2026-10-21 14:54:07.543
d1fc3768-7504-4ab8-9227-d92792f8dde9	4280a617-c8c7-4a09-8658-2d5ade6860be	6.895027390523159	79.90052264231635	29.881496454712263	276.00000000000006	2026-10-21 14:54:37.543
1479e708-fa8d-487d-be70-4c2a4b5045d4	4280a617-c8c7-4a09-8658-2d5ade6860be	6.8952447174185245	79.90154508497189	26.952253236596068	288	2026-10-21 14:55:07.543
e2503673-fd33-4bd8-a60d-1a376071bd9f	4280a617-c8c7-4a09-8658-2d5ade6860be	6.895669872981078	79.9025	25.242319457311158	300.00000000000006	2026-10-21 14:55:37.543
a23f08c7-73fa-453e-83ab-bcb2d0a21b99	4280a617-c8c7-4a09-8658-2d5ade6860be	6.896284275872613	79.9033456530318	29.59174492691756	312	2026-10-21 14:56:07.543
a029ea79-ff41-41e0-a455-3806acefbce3	4280a617-c8c7-4a09-8658-2d5ade6860be	6.897061073738538	79.90404508497188	20.951846094943946	324	2026-10-21 14:56:37.543
adbe0a3c-fa9c-49c2-aa67-53d0b839c92c	4280a617-c8c7-4a09-8658-2d5ade6860be	6.897966316784621	79.90456772728822	26.562792832627323	336	2026-10-21 14:57:07.543
a15448bf-8dd6-4b28-b2de-0a49fcbec0d4	4280a617-c8c7-4a09-8658-2d5ade6860be	6.898960441545912	79.90489073800367	20.941747614488055	348	2026-10-21 14:57:37.543
3fdc5e2c-f481-4fbc-a7d7-f0bdf0edec8a	9ebef2b5-a202-4065-8834-3be6a384fde5	6.90998240549801	79.90994485986906	37.450801649404085	45	2026-10-21 14:43:07.543
018b73ed-af2d-4ca9-b008-ac61c5fbd10e	9ebef2b5-a202-4065-8834-3be6a384fde5	6.910239997857253	79.910308735919	33.254160188703324	45	2026-10-21 14:43:37.543
b2a34383-7d87-4935-99cf-4c8bc549ff62	9ebef2b5-a202-4065-8834-3be6a384fde5	6.910435765319118	79.91034051791571	30.099423858896788	45	2026-10-21 14:44:07.543
d1cf9e46-6d9d-4a44-8cc2-e0fb1c39d330	9ebef2b5-a202-4065-8834-3be6a384fde5	6.910500537044716	79.91049857578281	28.796851504324092	45	2026-10-21 14:44:37.543
633fcb45-2690-495c-b35a-c58a62e81195	9ebef2b5-a202-4065-8834-3be6a384fde5	6.910779846204368	79.91074940286207	26.173768961523905	45	2026-10-21 14:45:07.543
80d34478-066a-4aed-a971-5550ca97aaf3	9ebef2b5-a202-4065-8834-3be6a384fde5	6.9108695522778385	79.9111415894146	26.752024220345877	45	2026-10-21 14:45:37.543
48b7de3d-677f-4e20-bb46-9963e52c18ce	9ebef2b5-a202-4065-8834-3be6a384fde5	6.911311144348405	79.91108820681177	32.5729998907772	45	2026-10-21 14:46:07.543
dd14c905-b835-4cf0-a1cc-1d2fe5ff9e74	9ebef2b5-a202-4065-8834-3be6a384fde5	6.911533647262821	79.91153173503328	30.003223430863173	45	2026-10-21 14:46:37.543
6d41e815-7d7b-4dac-a4fd-5e5b50403d14	9ebef2b5-a202-4065-8834-3be6a384fde5	6.911748796308966	79.91152012837757	29.319378523606836	45	2026-10-21 14:47:07.543
5ff22533-6078-4eb0-994c-008066639bc7	9ebef2b5-a202-4065-8834-3be6a384fde5	6.911834049925874	79.91178410986609	25.605715921800073	45	2026-10-21 14:47:37.543
15ca51a3-f0ea-4867-a163-2fc68ae11686	9ebef2b5-a202-4065-8834-3be6a384fde5	6.912129363176358	79.91207718486125	30.2198191825443	45	2026-10-21 14:48:07.543
56a52739-950c-4585-9e6e-2a5cf2ff3139	9ebef2b5-a202-4065-8834-3be6a384fde5	6.91210347959124	79.91233737791651	31.265029961624094	45	2026-10-21 14:48:37.543
fed3850f-fc15-4f38-8f68-301498b49a13	9ebef2b5-a202-4065-8834-3be6a384fde5	6.912392637690303	79.91249624151311	27.92641449532445	45	2026-10-21 14:49:07.543
bd6b72f3-2118-41f2-8b8c-515a085b011e	9ebef2b5-a202-4065-8834-3be6a384fde5	6.912495824960544	79.91248796724844	38.66549539105039	45	2026-10-21 14:49:37.543
932ca0db-6573-48b3-8eac-d597ad69a789	9ebef2b5-a202-4065-8834-3be6a384fde5	6.9128332012176115	79.912883298422	25.06197575229133	45	2026-10-21 14:50:07.543
0ad5eff3-a94a-45e7-9bb1-f6dddb45c6bb	9ebef2b5-a202-4065-8834-3be6a384fde5	6.91294963682561	79.91304022526607	36.80684491179497	45	2026-10-21 14:50:37.543
45e18a1f-9d49-4cfe-8689-5aded7938928	9ebef2b5-a202-4065-8834-3be6a384fde5	6.913335552892527	79.91308118483288	37.068315405067224	45	2026-10-21 14:51:07.543
2de14c46-3d01-4a3c-aeb2-646509d434b8	9ebef2b5-a202-4065-8834-3be6a384fde5	6.91338426214391	79.91352063372196	31.52031954712122	45	2026-10-21 14:51:37.543
cec6cf24-66fd-443c-8ebb-ea2e08d9bfe8	9ebef2b5-a202-4065-8834-3be6a384fde5	6.913671148319496	79.91348299248739	28.06540831519938	45	2026-10-21 14:52:07.543
f5725fba-8e12-402f-9d11-0e76d930a55d	9ebef2b5-a202-4065-8834-3be6a384fde5	6.913731804493497	79.91378748055764	35.31022660023372	45	2026-10-21 14:52:37.543
a6661fd6-7a0b-4a4d-a72b-3d6f9478acc6	9ebef2b5-a202-4065-8834-3be6a384fde5	6.9139292787169575	79.9139049831305	36.04267028090118	45	2026-10-21 14:53:07.543
c82dd7fd-6e86-42c6-b30e-4470b7c0376e	9ebef2b5-a202-4065-8834-3be6a384fde5	6.914191909954072	79.91421173889555	26.922989774967256	45	2026-10-21 14:53:37.543
ee0f036e-3e92-471b-b83a-31e2b99e5e29	9ebef2b5-a202-4065-8834-3be6a384fde5	6.914488591624979	79.91428762519817	30.949637689854885	45	2026-10-21 14:54:07.543
47177b53-e323-4c79-8d11-189ef9436234	9ebef2b5-a202-4065-8834-3be6a384fde5	6.914641236742767	79.91455238533867	27.26995138563695	45	2026-10-21 14:54:37.543
eb3e2769-4472-4105-80ff-67beddeced9a	9ebef2b5-a202-4065-8834-3be6a384fde5	6.914771632281062	79.91483739320768	25.142602284681065	45	2026-10-21 14:55:07.543
dd5767d3-21c7-41b1-962e-1b37f77508ac	9ebef2b5-a202-4065-8834-3be6a384fde5	6.914995791645619	79.91504802687788	34.0318315759159	45	2026-10-21 14:55:37.543
898dbcf5-aa22-4f1e-acf3-6276a6c5e91f	9ebef2b5-a202-4065-8834-3be6a384fde5	6.9153477051663454	79.91511590696669	38.63259586473551	45	2026-10-21 14:56:07.543
79d72bdf-8063-4901-aede-5e4eaeb07960	9ebef2b5-a202-4065-8834-3be6a384fde5	6.915329607948402	79.91547647015146	28.323131311437123	45	2026-10-21 14:56:37.543
51a8c267-6b6a-49d4-a018-3026ebb0c3e2	9ebef2b5-a202-4065-8834-3be6a384fde5	6.915640075827545	79.91567754360486	29.81398617518263	45	2026-10-21 14:57:07.543
7b3949f1-d73d-4086-8e2d-2feb28a2d07b	9ebef2b5-a202-4065-8834-3be6a384fde5	6.915903046081578	79.91567032469203	27.267650142608478	45	2026-10-21 14:57:37.543
\.


--
-- Data for Name: vehicles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.vehicles (id, plate_number, name, driver_id, is_active, created_at, updated_at) FROM stdin;
4280a617-c8c7-4a09-8658-2d5ade6860be	WP-KA-1234	Truck 1 — Bope	\N	t	2026-10-21 14:58:07.457	2026-10-21 14:58:07.457
9ebef2b5-a202-4065-8834-3be6a384fde5	WP-KA-5678	Truck 2 — Poddala	\N	t	2026-10-21 14:58:07.531	2026-10-21 14:58:07.531
\.


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: announcements announcements_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_pkey PRIMARY KEY (id);


--
-- Name: areas areas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.areas
    ADD CONSTRAINT areas_pkey PRIMARY KEY (id);


--
-- Name: citizen_profiles citizen_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.citizen_profiles
    ADD CONSTRAINT citizen_profiles_pkey PRIMARY KEY (id);


--
-- Name: community_comments community_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.community_comments
    ADD CONSTRAINT community_comments_pkey PRIMARY KEY (id);


--
-- Name: community_reactions community_reactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.community_reactions
    ADD CONSTRAINT community_reactions_pkey PRIMARY KEY (id);


--
-- Name: community_updates community_updates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.community_updates
    ADD CONSTRAINT community_updates_pkey PRIMARY KEY (id);


--
-- Name: complaints complaints_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.complaints
    ADD CONSTRAINT complaints_pkey PRIMARY KEY (id);


--
-- Name: health_checks health_checks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.health_checks
    ADD CONSTRAINT health_checks_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: vehicle_locations vehicle_locations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicle_locations
    ADD CONSTRAINT vehicle_locations_pkey PRIMARY KEY (id);


--
-- Name: vehicles vehicles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT vehicles_pkey PRIMARY KEY (id);


--
-- Name: announcements_status_published_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX announcements_status_published_at_idx ON public.announcements USING btree (status, published_at);


--
-- Name: areas_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX areas_name_key ON public.areas USING btree (name);


--
-- Name: citizen_profiles_area_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX citizen_profiles_area_id_idx ON public.citizen_profiles USING btree (area_id);


--
-- Name: citizen_profiles_user_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX citizen_profiles_user_id_key ON public.citizen_profiles USING btree (user_id);


--
-- Name: citizen_profiles_ward_division_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX citizen_profiles_ward_division_idx ON public.citizen_profiles USING btree (ward_division);


--
-- Name: community_comments_update_id_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX community_comments_update_id_created_at_idx ON public.community_comments USING btree (update_id, created_at);


--
-- Name: community_comments_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX community_comments_user_id_idx ON public.community_comments USING btree (user_id);


--
-- Name: community_reactions_update_id_user_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX community_reactions_update_id_user_id_key ON public.community_reactions USING btree (update_id, user_id);


--
-- Name: community_reactions_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX community_reactions_user_id_idx ON public.community_reactions USING btree (user_id);


--
-- Name: community_updates_area_id_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX community_updates_area_id_created_at_idx ON public.community_updates USING btree (area_id, created_at);


--
-- Name: community_updates_user_id_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX community_updates_user_id_created_at_idx ON public.community_updates USING btree (user_id, created_at);


--
-- Name: complaints_category_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX complaints_category_idx ON public.complaints USING btree (category);


--
-- Name: complaints_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX complaints_created_at_idx ON public.complaints USING btree (created_at);


--
-- Name: complaints_reporter_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX complaints_reporter_id_idx ON public.complaints USING btree (reporter_id);


--
-- Name: complaints_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX complaints_status_idx ON public.complaints USING btree (status);


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
-- Name: vehicle_locations_vehicle_id_recorded_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX vehicle_locations_vehicle_id_recorded_at_idx ON public.vehicle_locations USING btree (vehicle_id, recorded_at);


--
-- Name: vehicles_is_active_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX vehicles_is_active_idx ON public.vehicles USING btree (is_active);


--
-- Name: vehicles_plate_number_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX vehicles_plate_number_key ON public.vehicles USING btree (plate_number);


--
-- Name: citizen_profiles citizen_profiles_area_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.citizen_profiles
    ADD CONSTRAINT citizen_profiles_area_id_fkey FOREIGN KEY (area_id) REFERENCES public.areas(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: citizen_profiles citizen_profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.citizen_profiles
    ADD CONSTRAINT citizen_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: community_comments community_comments_update_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.community_comments
    ADD CONSTRAINT community_comments_update_id_fkey FOREIGN KEY (update_id) REFERENCES public.community_updates(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: community_comments community_comments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.community_comments
    ADD CONSTRAINT community_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: community_reactions community_reactions_update_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.community_reactions
    ADD CONSTRAINT community_reactions_update_id_fkey FOREIGN KEY (update_id) REFERENCES public.community_updates(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: community_reactions community_reactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.community_reactions
    ADD CONSTRAINT community_reactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: community_updates community_updates_area_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.community_updates
    ADD CONSTRAINT community_updates_area_id_fkey FOREIGN KEY (area_id) REFERENCES public.areas(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: community_updates community_updates_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.community_updates
    ADD CONSTRAINT community_updates_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: complaints complaints_reporter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.complaints
    ADD CONSTRAINT complaints_reporter_id_fkey FOREIGN KEY (reporter_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: vehicle_locations vehicle_locations_vehicle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicle_locations
    ADD CONSTRAINT vehicle_locations_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: vehicles vehicles_driver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT vehicles_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict U9UwMoabn1hDL5IA1UfPs1KoEZb03fohMSb8xVY77inz1b7tLCR50ot9Zu7tJnf

