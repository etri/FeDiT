--
-- PostgreSQL database dump
--

-- Dumped from database version 12.13 (Ubuntu 12.13-1.pgdg18.04+1)
-- Dumped by pg_dump version 12.3

-- Started on 2023-09-14 10:36:27


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

SET default_tablespace = '';

SET default_table_access_method = heap;

ALTER DATABASE mirrorlake SET TIMEZONE='UTC';

--
-- TOC entry 209 (class 1259 OID 24675)
-- Name: access_policy; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.access_policy (
    access_policy_id text NOT NULL,
    creation_time timestamp with time zone,
    creator_id text,
    modification_time timestamp with time zone,
    read_passcode text,
    write_passcode text
);


ALTER TABLE public.access_policy OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 33127)
-- Name: behavior_models; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.behavior_models (
    behavior_model_id text,
    digital_twin_id text,
    behavior_model_name text,
    description text,
    create_time timestamp with time zone,
    creator_id text,
    modification_time timestamp with time zone,
    url text
);


ALTER TABLE public.behavior_models OWNER TO postgres;

--
-- TOC entry 202 (class 1259 OID 24621)
-- Name: catalog; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.catalog (
    digital_twin_id text,
    digital_twin_name text,
    description text,
    owner text,
    tag text,
    point_of_access text,
    creation_time timestamp without time zone,
    creator_id text,
    modification_time timestamp without time zone,
    location text,
    number_of_dt_objs integer,
    number_of_services integer,
    number_of_simulations integer,
    total_number_of_sensors integer,
    total_number_of_controllers integer,
    total_number_of_visual_models integer,
    subscription_id text
);


ALTER TABLE public.catalog OWNER TO postgres;

--
-- TOC entry 210 (class 1259 OID 24683)
-- Name: control_data; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.control_data (
    control_data_id text,
    controller_id text,
    control_data_creator text,
    control_creation_time timestamp with time zone,
    control_execution_time timestamp with time zone,
    control_command jsonb,
    control_delivery_result text,
    control_execution_result text,
    control_delivery_time timestamp with time zone
);


ALTER TABLE public.control_data OWNER TO postgres;

--
-- TOC entry 208 (class 1259 OID 24669)
-- Name: controllers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.controllers (
    controller_id text,
    controller_name text,
    description text,
    install_location jsonb,
    digital_twin_id text,
    owner text,
    creation_time timestamp with time zone,
    creator_id text,
    modification_time timestamp with time zone,
    control_access_type text,
    control_access_url text,
    acknowledgement_type text,
    delivery_timeout integer,
    execution_timeout text,
    timeout_notification text,
    tags text[],
    data_model_id text,
    install_time text
);


ALTER TABLE public.controllers OWNER TO postgres;

--
-- TOC entry 206 (class 1259 OID 24653)
-- Name: data_models; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.data_models (
    data_model_id text NOT NULL,
    data_model_name text NOT NULL,
    description text,
    creator_id text NOT NULL,
    create_time timestamp with time zone NOT NULL,
    modifier_id text,
    modification_time timestamp with time zone,
    url text NOT NULL,
    data_model json NOT NULL,
    data_type text NOT NULL,
    data_unit json,
    digital_twin_id text
);


ALTER TABLE public.data_models OWNER TO postgres;

--
-- TOC entry 212 (class 1259 OID 24705)
-- Name: digital_object_data; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.digital_object_data (
    digital_object_data_id text,
    mirrorlake_id text,
    location jsonb,
    data jsonb,
    digital_twin_id text,
    digital_object_id text,
    rowtime timestamp with time zone
);


ALTER TABLE public.digital_object_data OWNER TO postgres;

--
-- TOC entry 211 (class 1259 OID 24698)
-- Name: digital_objects; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.digital_objects (
    digital_object_id text,
    digital_object_name text,
    description text,
    access_url text,
    access_protocol text,
    creation_time timestamp with time zone,
    creator_id text,
    modification_time timestamp with time zone,
    install_location jsonb,
    member_sensor_count integer,
    member_controller_count integer,
    member_sensor_ids text[],
    member_controller_ids text[],
    member_data_model_id text,
    member_visual_model_id text,
    member_behavior_model_id text,
    digital_twin_id text,
    time_sync_cond jsonb,
    spatial_sync_cond jsonb,
    preliminary_field jsonb,
    tags text[]
);


ALTER TABLE public.digital_objects OWNER TO postgres;

--
-- TOC entry 215 (class 1259 OID 24723)
-- Name: digital_twins; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.digital_twins (
    digital_twin_id text,
    digital_twin_name text,
    point_of_access text,
    description text,
    creation_time timestamp with time zone,
    creator_id text,
    modification_time timestamp with time zone,
    location jsonb,
    number_of_digital_objects integer,
    number_of_subscriptions integer,
    number_of_services integer,
    number_of_simulations integer,
    number_of_sensors integer,
    number_of_controllers integer,
    number_of_visual_models integer,
    number_of_data_models integer,
    number_of_behavior_models integer,
    tags text[],
    owner text
);


ALTER TABLE public.digital_twins OWNER TO postgres;

--
-- TOC entry 207 (class 1259 OID 24661)
-- Name: intelligencemodel; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.intelligencemodel (
    intelligence_model_id text NOT NULL,
    intelligence_model_name text NOT NULL,
    description text,
    creator_id text NOT NULL,
    create_time timestamp without time zone NOT NULL,
    modifier_id text,
    modification_time timestamp without time zone,
    url text NOT NULL
);


ALTER TABLE public.intelligencemodel OWNER TO postgres;


--
-- TOC entry 217 (class 1259 OID 24969)
-- Name: relations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.relations (
    parent_id text,
    resource_id text[],
    type integer
);


ALTER TABLE public.relations OWNER TO postgres;

--
-- TOC entry 205 (class 1259 OID 24647)
-- Name: sensor_data; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sensor_data (
    digital_twin_id text,
    sensor_id text,
    location jsonb,
    data jsonb,
    rowtime timestamp with time zone
);


ALTER TABLE public.sensor_data OWNER TO postgres;

--
-- TOC entry 203 (class 1259 OID 24627)
-- Name: sensors; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sensors (
    sensor_id text,
    sensor_name text,
    owner text,
    description text,
    install_location jsonb,
    data_source_type text,
    data_source_url text,
    internal_delivery_mode text,
    data_model_id text,
    data_interval integer,
    digital_twin_id text,
    creation_time timestamp with time zone,
    creator_id text,
    modification_time timestamp with time zone,
    customized_data_source text,
    additional_config jsonb,
    data_source_format text,
    tags text[],
    install_time timestamp with time zone
);


ALTER TABLE public.sensors OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 41310)
-- Name: services; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.services (
    service_id text,
    service_name text,
    description text,
    creation_time timestamp with time zone,
    modification_time timestamp with time zone,
    service_access_url text,
    "authorization" text,
    service_request_param text,
    service_response_info text,
    response_format_type text,
    interface_type text,
    error_info text,
    digital_twin_id text,
    creator_id text,
    tags text[],
    preliminary_field jsonb
);


ALTER TABLE public.services OWNER TO postgres;

--
-- TOC entry 214 (class 1259 OID 24717)
-- Name: simulation_data; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.simulation_data (
    simulation_data_id text,
    simulation_id text,
    input_data jsonb,
    result_data jsonb,
    trigger_time timestamp with time zone,
    result_time timestamp with time zone
);


ALTER TABLE public.simulation_data OWNER TO postgres;

--
-- TOC entry 213 (class 1259 OID 24711)
-- Name: simulations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.simulations (
    simulation_id text,
    digital_twin_id text,
    simulation_name text,
    description text,
    creation_time timestamp with time zone,
    creator_id text,
    modification_time timestamp with time zone,
    simulation_subject text[],
    simulation_access_url text,
    time_step integer,
    simulation_type text,
    simulation_attribute text[],
    resource_type text,
    include_input text,
    tags text[],
    "authorization" text,
    simulation_request_param jsonb,
    response_format_type text,
    interface_type text,
    error_info jsonb,
    preliminary_field jsonb,
    simulation_response_info jsonb
);


ALTER TABLE public.simulations OWNER TO postgres;

--
-- TOC entry 204 (class 1259 OID 24633)
-- Name: subscriptions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.subscriptions (
    subscription_id text NOT NULL,
    digital_twin_id text,
    subscription_name text,
    description text,
    creation_time timestamp with time zone,
    creator_id text,
    modification_time timestamp with time zone,
    subscription_subject text[],
    subscription_protocol text,
    expiration_time timestamp with time zone,
    expiration_count integer,
    fail_count integer,
    notification_url text[],
    tags text[]
);


ALTER TABLE public.subscriptions OWNER TO postgres;

--
-- TOC entry 218 (class 1259 OID 33111)
-- Name: visual_models; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.visual_models (
    visual_model_id text NOT NULL,
    digital_twin_id text NOT NULL,
    visual_model_name text NOT NULL,
    description text,
    subject text,
    creation_time timestamp with time zone,
    creator_id text,
    modification_time timestamp with time zone,
    access_url text,
    visual_datafile_format text,
    visual_datafile_size integer,
    visual_datafile_path text,
    tags text[]
);


ALTER TABLE public.visual_models OWNER TO postgres;

--
-- TOC entry 2866 (class 2606 OID 24682)
-- Name: access_policy accesspolicy_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.access_policy
    ADD CONSTRAINT accesspolicy_pkey PRIMARY KEY (access_policy_id);


--
-- TOC entry 2862 (class 2606 OID 24660)
-- Name: data_models datamodel_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.data_models
    ADD CONSTRAINT datamodel_pkey PRIMARY KEY (data_model_id);


--
-- TOC entry 2864 (class 2606 OID 24668)
-- Name: intelligencemodel intelligencemodel_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.intelligencemodel
    ADD CONSTRAINT intelligencemodel_pkey PRIMARY KEY (intelligence_model_id);


--
-- TOC entry 2860 (class 2606 OID 24640)
-- Name: subscriptions subscription_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscription_pkey PRIMARY KEY (subscription_id);


--
-- TOC entry 2868 (class 2606 OID 33118)
-- Name: visual_models visual_models_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visual_models
    ADD CONSTRAINT visual_models_pkey PRIMARY KEY (visual_model_id);


-- Completed on 2023-09-14 10:36:27

--
-- PostgreSQL database dump complete
--

CREATE TABLE public.do_compositions
(
    compose_id text NOT NULL,
    digital_twin_id text,
    digital_object_id text,
    sensor_id text,
    rowtime timestamp without time zone,
    CONSTRAINT do_compositions_pkey PRIMARY KEY (compose_id)
)