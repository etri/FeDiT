--
-- PostgreSQL database dump
--

-- Dumped from database version 12.13 (Ubuntu 12.13-1.pgdg18.04+1)
-- Dumped by pg_dump version 15.2


CREATE DATABASE federated_digital_twin;

ALTER DATABASE federated_digital_twin OWNER TO postgres;

\connect federated_digital_twin

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
-- TOC entry 3113 (class 0 OID 0)
-- Name: federated_digital_twin; Type: DATABASE PROPERTIES; Schema: -; Owner: postgres
--

ALTER DATABASE federated_digital_twin SET "TimeZone" TO 'UTC';

--


CREATE TABLE public.country_codes (
    code_number text NOT NULL,
    description text
);


ALTER TABLE public.country_codes OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 41464)
-- Name: digital_object_control_result; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.digital_object_control_result (
    digital_twin_id text,
    digital_object_id text,
    digital_object_control_result_id text,
    digital_object_control_data_id text,
    control_execution_time timestamp with time zone,
    control_execution_result text,
);


ALTER TABLE public.digital_object_control_result OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 41458)
-- Name: digital_object_controllers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.digital_object_controllers (
    digital_twin_id text,
    digital_object_control_data_id text,
    controller_id text,
    control_data_creator text,
    control_creation_time timestamp with time zone,
    control_delivery_time timestamp with time zone,
    control_delivery_result text,
    control_command jsonb,
);


ALTER TABLE public.digital_object_controllers OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 41452)
-- Name: digital_object_data; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.digital_object_data (
    digital_twin_id text,
    digital_object_id text,
    rowtime timestamp with time zone,
    data jsonb,
    federated_digital_twin_id text,
    location text
);


ALTER TABLE public.digital_object_data OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 41446)
-- Name: digital_objects; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.digital_objects (
    digital_twin_id text,
    digital_object_id text,
    digital_object_name text,
    description text,
    tags text[],
    creation_time timestamp with time zone,
    modification_time timestamp with time zone,
    digital_object_data_access_type text,
    digital_object_data_access_url text,
    digital_object_control_url text,
    digital_object_data_model json,
    digital_object_data_interval integer,
    digital_object_control_request_model jsonb,
    do_metadata jsonb,
    preliminary_field jsonb,
    subject text[],
    federated_digital_twin_id text,
    digital_object_data_source_type text,
    digital_object_data_source_url text
);


ALTER TABLE public.digital_objects OWNER TO postgres;

--
-- TOC entry 203 (class 1259 OID 41343)
-- Name: digital_twins; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.digital_twins (
    federated_digital_twin_id text,
    digital_twin_id text,
    digital_twin_name text,
    description text,
    owner text,
    tags text[],
    creation_time timestamp with time zone,
    creator_id text,
    modification_time timestamp with time zone,
    point_of_access text,
    contact_point text,
    subject text[],
    location jsonb,
    member_digital_objects_ids text[],
    number_of_digital_objects integer,
    number_of_services integer,
    number_of_simulations integer
);


ALTER TABLE public.digital_twins OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 41481)
-- Name: fdo_compositions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.fdo_compositions (
    compose_id text NOT NULL,
    federated_digital_twin_id text,
    federated_digital_object_id text,
    digital_object_id text,
    rowtime timestamp with time zone,
    digital_object_count integer
);


ALTER TABLE public.fdo_compositions OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 41533)
-- Name: fdo_sync_compositions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.fdo_sync_compositions (
    compose_id text,
    federated_digital_twin_id text,
    federated_digital_object_id text,
    time_sync integer,
    spatial_sync text,
    rowtime timestamp with time zone
);


ALTER TABLE public.fdo_sync_compositions OWNER TO postgres;

--
-- TOC entry 215 (class 1259 OID 41422)
-- Name: federated_augment_models; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.federated_augment_models (
    model_seq text,
    model_nm text,
    model_derp text,
    model_algrm text,
    learning_bgng_dt timestamp with time zone,
    learning_end_dt timestamp with time zone,
    model_status text,
    sdt_yn text,
    index_trgt_col text,
    input_output_info text
);


ALTER TABLE public.federated_augment_models OWNER TO postgres;

--
-- TOC entry 207 (class 1259 OID 41373)
-- Name: federated_control_result; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.federated_control_result (
    federated_digital_object_control_result_id text,
    federated_digital_object_control_data_id text,
    federated_digital_object_id text,
    digital_object_id text,
    federated_digital_object_control_execution_time timestamp with time zone,
    federated_digital_object_control_execution_result text
);


ALTER TABLE public.federated_control_result OWNER TO postgres;

--
-- TOC entry 206 (class 1259 OID 41367)
-- Name: federated_controls; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.federated_controls (
    federated_digital_object_control_data_id text,
    federated_digital_object_id text,
    federated_digital_object_control_data_creator text,
    federated_digital_object_control_creation_time timestamp with time zone,
    federated_digital_object_control_delivery_time timestamp with time zone,
    federated_digital_object_control_delivery_result text,
    federated_digital_object_control_command jsonb
);


ALTER TABLE public.federated_controls OWNER TO postgres;

--
-- TOC entry 211 (class 1259 OID 41397)
-- Name: federated_data_models; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.federated_data_models (
    federated_digital_twin_id text,
    data_model_id text,
    data_model_name text,
    description text,
    creation_time timestamp with time zone,
    creator_id text,
    modification_time timestamp with time zone,
    data_model_url text,
    data_model jsonb
);


ALTER TABLE public.federated_data_models OWNER TO postgres;

--
-- TOC entry 205 (class 1259 OID 41361)
-- Name: federated_digital_object_data; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.federated_digital_object_data (
    federated_digital_twin_id text,
    federated_digital_object_id text,
    rowtime timestamp with time zone,
    data jsonb,
    location text
);


ALTER TABLE public.federated_digital_object_data OWNER TO postgres;

--
-- TOC entry 237 (class 1259 OID 49492)
-- Name: federated_digital_object_window_data_1; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.federated_digital_object_window_data_1 (
    federated_digital_twin_id text,
    federated_digital_object_id text,
    rowtime timestamp with time zone,
    location text,
    data jsonb
);


ALTER TABLE public.federated_digital_object_window_data_1 OWNER TO postgres;

--
-- TOC entry 238 (class 1259 OID 49499)
-- Name: federated_digital_object_window_data_10; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.federated_digital_object_window_data_10 (
    federated_digital_twin_id text,
    federated_digital_object_id text,
    rowtime timestamp with time zone,
    location text,
    data jsonb
);


ALTER TABLE public.federated_digital_object_window_data_10 OWNER TO postgres;

--
-- TOC entry 239 (class 1259 OID 49506)
-- Name: federated_digital_object_window_data_60; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.federated_digital_object_window_data_60 (
    federated_digital_twin_id text,
    federated_digital_object_id text,
    rowtime timestamp with time zone,
    location text,
    data jsonb
);


ALTER TABLE public.federated_digital_object_window_data_60 OWNER TO postgres;

--
-- TOC entry 204 (class 1259 OID 41355)
-- Name: federated_digital_objects; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.federated_digital_objects (
    federated_digital_object_id text,
    federated_digital_twin_id text,
    federated_digital_object_name text,
    description text,
    tags text[],
    access_url text,
    access_protocol text,
    creation_time timestamp with time zone,
    creator_id text,
    modification_time timestamp with time zone,
    location jsonb,
    time_sync_cond jsonb,
    spatial_sync_cond jsonb,
    member_digital_twin_object_count integer,
    member_digital_twin_object_ids text[],
    data_model_id text,
    preliminary_field jsonb
);


ALTER TABLE public.federated_digital_objects OWNER TO postgres;

--
-- TOC entry 202 (class 1259 OID 41337)
-- Name: federated_digital_twins; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.federated_digital_twins (
    federated_digital_twin_id text,
    federated_digital_twin_name text,
    description text,
    owner text,
    tags text[],
    point_of_access text,
    creation_time timestamp with time zone,
    creator_id text,
    modification_time timestamp with time zone,
    location jsonb,
    number_of_federated_digital_objects integer,
    number_of_subscriptions integer,
    number_of_services integer,
    number_of_simulations integer,
    number_of_digital_twins integer,
    number_of_visual_models integer
);


ALTER TABLE public.federated_digital_twins OWNER TO postgres;

--
-- TOC entry 214 (class 1259 OID 41416)
-- Name: federated_fidelities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.federated_fidelities (
    federated_digital_twin_id text,
    fidelity_id text,
    fidelity_name text,
    description text,
    creation_time timestamp with time zone,
    creator_id text,
    modification_time timestamp with time zone,
    fidelity_subject text,
    fidelity_type text,
    data_unit_transform_info text,
    input_output_info text,
    unit_type text,
    unit_code_1 text,
    unit_code_2 text,
    unit_formula text,
    interpolate_type text,
    resample_type text,
    resample_interval text
);


ALTER TABLE public.federated_fidelities OWNER TO postgres;

--
-- TOC entry 208 (class 1259 OID 41379)
-- Name: federated_services; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.federated_services (
    federated_digital_twin_id text,
    service_id text,
    service_name text,
    description text,
    tags text[],
    creation_time timestamp with time zone,
    creator_id text,
    modification_time timestamp with time zone,
    service_access_url text,
    service_request_param text,
    service_response_info text,
    response_format_type text,
    interface_type text,
    error_info text,
    "authorization" text,
    preliminary_field jsonb
);


ALTER TABLE public.federated_services OWNER TO postgres;

--
-- TOC entry 210 (class 1259 OID 41391)
-- Name: federated_simulation_data; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.federated_simulation_data (
    simulation_data_id text,
    simulation_id text,
    input_data jsonb,
    result_data jsonb,
    trigger_time timestamp with time zone,
    result_time timestamp with time zone
);


ALTER TABLE public.federated_simulation_data OWNER TO postgres;

--
-- TOC entry 216 (class 1259 OID 41428)
-- Name: federated_simulations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.federated_simulations (
    federated_digital_twin_id text,
    simulation_id text,
    simulation_name text,
    description text,
    tags text[],
    creation_time timestamp with time zone,
    creator_id text,
    modification_time timestamp with time zone,
    simulation_subject text[],
    simulation_access_url text,
    "authorization" text,
    simulation_request_param jsonb,
    simulation_response_info jsonb,
    response_format_type text,
    interface_type text,
    error_info jsonb,
    time_step integer,
    simulation_type text,
    simulation_attribute text[],
    resource_type text,
    include_input text,
    preliminary_field jsonb,
    simulation_state text
);


ALTER TABLE public.federated_simulations OWNER TO postgres;

--
-- TOC entry 209 (class 1259 OID 41385)
-- Name: federated_subscriptions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.federated_subscriptions (
    federated_digital_twin_id text,
    subscription_id text,
    subscription_name text,
    description text,
    creation_time timestamp with time zone,
    creator_id text,
    modification_time timestamp with time zone,
    subscription_subject text[],
    subscription_protocol text,
    notification_url text[],
    expiration_time timestamp with time zone,
    expiration_count integer,
    fail_count integer,
    tags text[],
    filtering_action_list text,
    filtering_condition_list text
);


ALTER TABLE public.federated_subscriptions OWNER TO postgres;

--
-- TOC entry 213 (class 1259 OID 41409)
-- Name: federated_validations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.federated_validations (
    federated_digital_twin_id text,
    validation_id text,
    validation_name text,
    description text,
    creation_time timestamp with time zone,
    creator_id text,
    modification_time timestamp with time zone,
    validation_rule text,
    validation_subject text,
    validation_engine_address text,
    validation_type text,
    explainable text,
    validation_result_history text,
    notificaitonurl text,
    input_output_info text,
    rule_value text,
    outlier_type text,
    outlier_rule_value text
);


ALTER TABLE public.federated_validations OWNER TO postgres;

--
-- TOC entry 212 (class 1259 OID 41403)
-- Name: federated_visual_models; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.federated_visual_models (
    federated_digital_twin_id text,
    visual_model_id text,
    visual_model_name text,
    description text,
    tags text[],
    creation_time timestamp with time zone,
    creator_id text,
    modification_time timestamp with time zone,
    access_url text,
    file_format text,
    file_size integer,
    location jsonb
);


ALTER TABLE public.federated_visual_models OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 41708)
-- Name: object_classification_facility; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.object_classification_facility (
    code_number character varying(5) NOT NULL,
    classification_type_name character varying(255)
);


ALTER TABLE public.object_classification_facility OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 41703)
-- Name: object_classification_product; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.object_classification_product (
    code_number character varying(6) NOT NULL,
    classification_type_name character varying(255)
);


ALTER TABLE public.object_classification_product OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 41695)
-- Name: object_classification_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.object_classification_types (
    code_number integer NOT NULL,
    classification_type_name character varying(255),
    description text
);


ALTER TABLE public.object_classification_types OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 41539)
-- Name: relations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.relations (
    parent_id text,
    resource_id text[],
    type integer
);


ALTER TABLE public.relations OWNER TO postgres;

--
-- TOC entry 218 (class 1259 OID 41440)
-- Name: services; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.services (
    digital_twin_id text,
    service_id text,
    service_name text,
    description text,
    tags text[],
    subject text,
    creation_time timestamp with time zone,
    modification_time timestamp with time zone,
    service_access_url text,
    "authorization" text,
    service_request_param jsonb,
    service_response_info jsonb,
    response_format_type text,
    interface_type text,
    error_info jsonb,
    preliminary_field jsonb,
    federated_digital_twin_id text
);


ALTER TABLE public.services OWNER TO postgres;

--
-- TOC entry 240 (class 1259 OID 50183)
-- Name: simulation_data; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.simulation_data (
    simulation_data_id text,
    simulation_id text,
    input_data jsonb,
    result_data jsonb,
    trigger_time timestamp with time zone,
    result_time timestamp with time zone,
    federated_digital_twin_id text,
    digital_twin_id text
);


ALTER TABLE public.simulation_data OWNER TO postgres;

--
-- TOC entry 217 (class 1259 OID 41434)
-- Name: simulations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.simulations (
    digital_twin_id text,
    simulation_id text,
    simulation_name text,
    description text,
    tags text[],
    subject text,
    creation_time timestamp with time zone,
    modification_time timestamp with time zone,
    simulation_access_url text,
    "authorization" text,
    simulation_request_param jsonb,
    simulation_response_info jsonb,
    response_format_type text,
    interface_type text,
    error_info jsonb,
    preliminary_field jsonb,
    federated_digital_twin_id text
);


ALTER TABLE public.simulations OWNER TO postgres;

--
-- TOC entry 230 (class 1259 OID 41714)
-- Name: twin_classification_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.twin_classification_types (
    code_number text NOT NULL,
    classification_type text,
    description text
);


ALTER TABLE public.twin_classification_types OWNER TO postgres;

--
-- TOC entry 234 (class 1259 OID 41746)
-- Name: twin_public_resource_categorie_c; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.twin_public_resource_categorie_c (
    code_number integer NOT NULL,
    classification_type_name text,
    description text
);


ALTER TABLE public.twin_public_resource_categorie_c OWNER TO postgres;

--
-- TOC entry 235 (class 1259 OID 41754)
-- Name: twin_public_resource_categorie_k; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.twin_public_resource_categorie_k (
    code_number integer NOT NULL,
    classification_type_name text,
    description text
);


ALTER TABLE public.twin_public_resource_categorie_k OWNER TO postgres;

--
-- TOC entry 236 (class 1259 OID 41762)
-- Name: twin_public_resource_categorie_n; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.twin_public_resource_categorie_n (
    code_number integer NOT NULL,
    classification_type_name text,
    description text
);


ALTER TABLE public.twin_public_resource_categorie_n OWNER TO postgres;

--
-- TOC entry 233 (class 1259 OID 41738)
-- Name: twin_public_resource_major_categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.twin_public_resource_major_categories (
    code_number text NOT NULL,
    classification_type_name text,
    description text
);


ALTER TABLE public.twin_public_resource_major_categories OWNER TO postgres;

--
-- TOC entry 232 (class 1259 OID 41730)
-- Name: twin_standard_industry_categorie_c; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.twin_standard_industry_categorie_c (
    code_number integer NOT NULL,
    classification_type_name text,
    description text
);


ALTER TABLE public.twin_standard_industry_categorie_c OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 41722)
-- Name: twin_standard_industry_major_categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.twin_standard_industry_major_categories (
    code_number text NOT NULL,
    classification_type_name text,
    description text
);


ALTER TABLE public.twin_standard_industry_major_categories OWNER TO postgres;

--
-- TOC entry 2957 (class 2606 OID 41638)
-- Name: country_codes country_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.country_codes
    ADD CONSTRAINT country_codes_pkey PRIMARY KEY (code_number);


--
-- TOC entry 2955 (class 2606 OID 41488)
-- Name: fdo_compositions do_compositions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fdo_compositions
    ADD CONSTRAINT do_compositions_pkey PRIMARY KEY (compose_id);


--
-- TOC entry 2963 (class 2606 OID 41712)
-- Name: object_classification_facility object_classification_facility_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.object_classification_facility
    ADD CONSTRAINT object_classification_facility_pkey PRIMARY KEY (code_number);


--
-- TOC entry 2961 (class 2606 OID 41707)
-- Name: object_classification_product object_classification_product_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.object_classification_product
    ADD CONSTRAINT object_classification_product_pkey PRIMARY KEY (code_number);


--
-- TOC entry 2959 (class 2606 OID 41702)
-- Name: object_classification_types object_classification_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.object_classification_types
    ADD CONSTRAINT object_classification_types_pkey PRIMARY KEY (code_number);


--
-- TOC entry 2965 (class 2606 OID 41721)
-- Name: twin_classification_types twin_classification_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.twin_classification_types
    ADD CONSTRAINT twin_classification_types_pkey PRIMARY KEY (code_number);


--
-- TOC entry 2973 (class 2606 OID 41753)
-- Name: twin_public_resource_categorie_c twin_public_resource_categorie_c_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.twin_public_resource_categorie_c
    ADD CONSTRAINT twin_public_resource_categorie_c_pkey PRIMARY KEY (code_number);


--
-- TOC entry 2975 (class 2606 OID 41761)
-- Name: twin_public_resource_categorie_k twin_public_resource_categorie_k_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.twin_public_resource_categorie_k
    ADD CONSTRAINT twin_public_resource_categorie_k_pkey PRIMARY KEY (code_number);


--
-- TOC entry 2977 (class 2606 OID 41769)
-- Name: twin_public_resource_categorie_n twin_public_resource_categorie_n_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.twin_public_resource_categorie_n
    ADD CONSTRAINT twin_public_resource_categorie_n_pkey PRIMARY KEY (code_number);


--
-- TOC entry 2971 (class 2606 OID 41745)
-- Name: twin_public_resource_major_categories twin_public_resource_major_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.twin_public_resource_major_categories
    ADD CONSTRAINT twin_public_resource_major_categories_pkey PRIMARY KEY (code_number);


--
-- TOC entry 2969 (class 2606 OID 41737)
-- Name: twin_standard_industry_categorie_c twin_standard_industry_categorie_c_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.twin_standard_industry_categorie_c
    ADD CONSTRAINT twin_standard_industry_categorie_c_pkey PRIMARY KEY (code_number);


--
-- TOC entry 2967 (class 2606 OID 41729)
-- Name: twin_standard_industry_major_categories twin_standard_industry_major_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.twin_standard_industry_major_categories
    ADD CONSTRAINT twin_standard_industry_major_categories_pkey PRIMARY KEY (code_number);



CREATE INDEX index_federated_digital_object ON public.federated_digital_objects USING btree (federated_digital_twin_id, federated_digital_object_id, creation_time);

CREATE INDEX index_federated_digital_objects ON public.federated_digital_object_data USING btree (federated_digital_twin_id, federated_digital_object_id, rowtime);

CREATE INDEX index_digital_object ON public.digital_objects USING btree (federated_digital_twin_id, digital_twin_id, digital_object_id, creation_time);

CREATE INDEX index_digital_objects ON public.digital_object_data USING btree (federated_digital_twin_id, digital_twin_id, digital_object_id, rowtime);



--
-- TOC entry 2978 (class 1259 OID 49498)
-- Name: index_federated_digital_objectswindow_data_1; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX index_federated_digital_objectswindow_data_1 ON public.federated_digital_object_window_data_1 USING btree (federated_digital_twin_id, federated_digital_object_id, rowtime);


--
-- TOC entry 2979 (class 1259 OID 49505)
-- Name: index_federated_digital_objectswindow_data_10; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX index_federated_digital_objectswindow_data_10 ON public.federated_digital_object_window_data_10 USING btree (federated_digital_twin_id, federated_digital_object_id, rowtime);


--
-- TOC entry 2980 (class 1259 OID 49512)
-- Name: index_federated_digital_objectswindow_data_60; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX index_federated_digital_objectswindow_data_60 ON public.federated_digital_object_window_data_60 USING btree (federated_digital_twin_id, federated_digital_object_id, rowtime);


--
-- TOC entry 3114 (class 0 OID 0)
-- Dependencies: 6
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;
GRANT ALL ON SCHEMA public TO PUBLIC;


-- Completed on 2024-02-22 14:39:30

--
-- PostgreSQL database dump complete
--

