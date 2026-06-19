--
-- PostgreSQL database dump
--

-- \restrict mEUQ2tT8xO5vYMncedReoZ1tSCwyerkBOZaUL01aL83c70pnZ3SjiGLVUIbHxKE

-- Dumped from database version 18.0
-- Dumped by pg_dump version 18.0

-- Started on 2026-06-19 14:29:14

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
-- TOC entry 219 (class 1259 OID 74425)
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_logs (
    created_at timestamp(6) with time zone NOT NULL,
    id uuid NOT NULL,
    user_id uuid,
    status character varying(20) NOT NULL,
    ip_address character varying(45),
    action character varying(100) NOT NULL,
    entity_id character varying(100),
    entity_name character varying(100) NOT NULL,
    username character varying(100),
    user_agent character varying(500),
    message text,
    metadata text,
    CONSTRAINT audit_logs_action_check CHECK (((action)::text = ANY ((ARRAY['LOGIN'::character varying, 'LOGOUT'::character varying, 'SIGN_UP'::character varying, 'REFRESH_TOKEN'::character varying, 'CHANGE_PASSWORD'::character varying, 'FORGOT_PASSWORD'::character varying, 'RESET_PASSWORD'::character varying, 'CREATE'::character varying, 'UPDATE'::character varying, 'DELETE'::character varying])::text[]))),
    CONSTRAINT audit_logs_entity_name_check CHECK (((entity_name)::text = ANY ((ARRAY['USER'::character varying, 'AUTH'::character varying, 'ORDER'::character varying, 'SUBSCRIPTION'::character varying, 'CATEGORY'::character varying, 'BOOK'::character varying, 'BOOK_ITEM'::character varying, 'RENTAL'::character varying, 'FINE'::character varying])::text[]))),
    CONSTRAINT audit_logs_status_check CHECK (((status)::text = ANY ((ARRAY['SUCCESS'::character varying, 'FAILED'::character varying])::text[])))
);


ALTER TABLE public.audit_logs OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 74440)
-- Name: events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.events (
    version integer NOT NULL,
    created_at timestamp(6) with time zone NOT NULL,
    end_time timestamp(6) without time zone,
    open_time timestamp(6) without time zone,
    start_time timestamp(6) without time zone,
    teasing_time timestamp(6) without time zone,
    updated_at timestamp(6) with time zone NOT NULL,
    created_by uuid,
    id uuid NOT NULL,
    updated_by uuid,
    status character varying(20) NOT NULL,
    banner_url character varying(500),
    location character varying(500) NOT NULL,
    name character varying(255) NOT NULL,
    CONSTRAINT events_status_check CHECK (((status)::text = ANY ((ARRAY['DRAFT'::character varying, 'TEASING'::character varying, 'ONSALE'::character varying, 'ENDED'::character varying, 'CANCELED'::character varying])::text[])))
);


ALTER TABLE public.events OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 107193)
-- Name: orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.orders (
    id uuid NOT NULL,
    created_at timestamp(6) with time zone NOT NULL,
    created_by uuid,
    updated_at timestamp(6) with time zone NOT NULL,
    updated_by uuid,
    customer_id uuid NOT NULL,
    event_id uuid NOT NULL,
    expired_at timestamp(6) without time zone,
    order_code character varying(10) NOT NULL,
    staff_id uuid NOT NULL,
    status character varying(30) NOT NULL,
    total_amount numeric(38,2) NOT NULL,
    version integer NOT NULL,
    CONSTRAINT orders_status_check CHECK (((status)::text = ANY ((ARRAY['PAID'::character varying, 'CANCELED'::character varying])::text[])))
);


ALTER TABLE public.orders OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 107209)
-- Name: payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payments (
    id uuid NOT NULL,
    created_at timestamp(6) with time zone NOT NULL,
    created_by uuid,
    updated_at timestamp(6) with time zone NOT NULL,
    updated_by uuid,
    amount numeric(38,2) NOT NULL,
    order_id uuid NOT NULL,
    payment_method character varying(30) NOT NULL,
    status character varying(30) NOT NULL,
    transaction_ref character varying(100),
    amount_received numeric(38,2),
    CONSTRAINT payments_payment_method_check CHECK (((payment_method)::text = ANY ((ARRAY['CASH'::character varying, 'BANK_TRANSFER'::character varying, 'VIETQR'::character varying])::text[]))),
    CONSTRAINT payments_status_check CHECK (((status)::text = ANY ((ARRAY['CONFIRMED'::character varying, 'WAITING_GATEWAY'::character varying, 'FAILED'::character varying])::text[])))
);


ALTER TABLE public.payments OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 131831)
-- Name: seat_layouts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.seat_layouts (
    id uuid NOT NULL,
    created_at timestamp(6) with time zone NOT NULL,
    created_by uuid,
    updated_at timestamp(6) with time zone NOT NULL,
    updated_by uuid,
    description character varying(500),
    layout_data jsonb NOT NULL,
    name character varying(150) NOT NULL,
    seat_count integer NOT NULL,
    status character varying(20) NOT NULL,
    used_cols integer NOT NULL,
    used_rows integer NOT NULL,
    venue_name character varying(150),
    version integer NOT NULL,
    workspace_cols integer NOT NULL,
    workspace_rows integer NOT NULL,
    CONSTRAINT seat_layouts_status_check CHECK (((status)::text = ANY ((ARRAY['DRAFT'::character varying, 'PUBLISHED'::character varying, 'ARCHIVED'::character varying])::text[])))
);


ALTER TABLE public.seat_layouts OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 74455)
-- Name: seats; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.seats (
    grid_column integer NOT NULL,
    grid_row integer NOT NULL,
    version integer NOT NULL,
    created_at timestamp(6) with time zone NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL,
    created_by uuid,
    event_id uuid NOT NULL,
    id uuid NOT NULL,
    ticket_class_id uuid NOT NULL,
    updated_by uuid,
    status character varying(20) NOT NULL,
    label character varying(30),
    CONSTRAINT seats_status_check CHECK (((status)::text = ANY ((ARRAY['AVAILABLE'::character varying, 'MAINTENANCE'::character varying, 'SOLD'::character varying, 'LOCKED'::character varying])::text[])))
);


ALTER TABLE public.seats OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 74470)
-- Name: ticket_classes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ticket_classes (
    price numeric(38,2) NOT NULL,
    version integer NOT NULL,
    created_at timestamp(6) with time zone NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL,
    created_by uuid,
    event_id uuid NOT NULL,
    id uuid NOT NULL,
    updated_by uuid,
    color_code character varying(20),
    name character varying(100) NOT NULL
);


ALTER TABLE public.ticket_classes OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 123639)
-- Name: tickets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tickets (
    id uuid NOT NULL,
    created_at timestamp(6) with time zone NOT NULL,
    created_by uuid,
    updated_at timestamp(6) with time zone NOT NULL,
    updated_by uuid,
    check_in_by uuid,
    check_in_time timestamp(6) without time zone,
    order_id uuid NOT NULL,
    price numeric(38,2) NOT NULL,
    seat_id uuid NOT NULL,
    seat_label character varying(20) NOT NULL,
    status character varying(30) NOT NULL,
    ticket_class_id uuid NOT NULL,
    version integer NOT NULL,
    CONSTRAINT tickets_status_check CHECK (((status)::text = ANY ((ARRAY['UNUSED'::character varying, 'USED'::character varying, 'CANCELED'::character varying])::text[])))
);


ALTER TABLE public.tickets OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 74482)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    created_at timestamp(6) with time zone NOT NULL,
    tokens_valid_from timestamp(6) with time zone,
    updated_at timestamp(6) with time zone NOT NULL,
    created_by uuid,
    id uuid NOT NULL,
    updated_by uuid,
    auth_provider character varying(20) NOT NULL,
    phone character varying(20) NOT NULL,
    role character varying(20) NOT NULL,
    status character varying(20) NOT NULL,
    username character varying(100),
    email character varying(255),
    full_name character varying(255) NOT NULL,
    google_id character varying(255),
    password_hash character varying(255),
    online_verified boolean DEFAULT false NOT NULL,
    CONSTRAINT users_auth_provider_check CHECK (((auth_provider)::text = ANY ((ARRAY['LOCAL'::character varying, 'GOOGLE'::character varying])::text[]))),
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['ADMIN'::character varying, 'STAFF'::character varying, 'CUSTOMER'::character varying])::text[]))),
    CONSTRAINT users_status_check CHECK (((status)::text = ANY ((ARRAY['ACTIVE'::character varying, 'INACTIVE'::character varying, 'LOCKED'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 4855 (class 2606 OID 74439)
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- TOC entry 4860 (class 2606 OID 74454)
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);


--
-- TOC entry 4886 (class 2606 OID 107208)
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- TOC entry 4891 (class 2606 OID 107222)
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- TOC entry 4903 (class 2606 OID 131850)
-- Name: seat_layouts seat_layouts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seat_layouts
    ADD CONSTRAINT seat_layouts_pkey PRIMARY KEY (id);


--
-- TOC entry 4863 (class 2606 OID 74469)
-- Name: seats seats_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seats
    ADD CONSTRAINT seats_pkey PRIMARY KEY (id);


--
-- TOC entry 4867 (class 2606 OID 74481)
-- Name: ticket_classes ticket_classes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_classes
    ADD CONSTRAINT ticket_classes_pkey PRIMARY KEY (id);


--
-- TOC entry 4897 (class 2606 OID 123654)
-- Name: tickets tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_pkey PRIMARY KEY (id);


--
-- TOC entry 4893 (class 2606 OID 148216)
-- Name: payments uk_payment_transaction_ref; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT uk_payment_transaction_ref UNIQUE (transaction_ref);


--
-- TOC entry 4865 (class 2606 OID 115451)
-- Name: seats uk_seat_event_position; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seats
    ADD CONSTRAINT uk_seat_event_position UNIQUE (event_id, grid_row, grid_column);


--
-- TOC entry 4899 (class 2606 OID 123658)
-- Name: tickets uk_ticket_seat; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT uk_ticket_seat UNIQUE (seat_id);


--
-- TOC entry 4888 (class 2606 OID 107244)
-- Name: orders ukdhk2umg8ijjkg4njg6891trit; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT ukdhk2umg8ijjkg4njg6891trit UNIQUE (order_code);


--
-- TOC entry 4873 (class 2606 OID 74505)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 4875 (class 2606 OID 74507)
-- Name: users users_google_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_google_id_key UNIQUE (google_id);


--
-- TOC entry 4877 (class 2606 OID 74501)
-- Name: users users_phone_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_phone_key UNIQUE (phone);


--
-- TOC entry 4879 (class 2606 OID 74499)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 4881 (class 2606 OID 74503)
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- TOC entry 4856 (class 1259 OID 74509)
-- Name: idx_audit_log_action; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_log_action ON public.audit_logs USING btree (action);


--
-- TOC entry 4857 (class 1259 OID 74510)
-- Name: idx_audit_log_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_log_created_at ON public.audit_logs USING btree (created_at);


--
-- TOC entry 4858 (class 1259 OID 74508)
-- Name: idx_audit_log_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_log_user_id ON public.audit_logs USING btree (user_id);


--
-- TOC entry 4882 (class 1259 OID 107240)
-- Name: idx_order_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_order_code ON public.orders USING btree (order_code);


--
-- TOC entry 4883 (class 1259 OID 107241)
-- Name: idx_order_customer; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_order_customer ON public.orders USING btree (customer_id);


--
-- TOC entry 4884 (class 1259 OID 107242)
-- Name: idx_order_event; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_order_event ON public.orders USING btree (event_id);


--
-- TOC entry 4889 (class 1259 OID 107245)
-- Name: idx_payment_order; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payment_order ON public.payments USING btree (order_id);


--
-- TOC entry 4900 (class 1259 OID 131852)
-- Name: idx_seat_layout_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_seat_layout_name ON public.seat_layouts USING btree (name);


--
-- TOC entry 4901 (class 1259 OID 131851)
-- Name: idx_seat_layout_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_seat_layout_status ON public.seat_layouts USING btree (status);


--
-- TOC entry 4861 (class 1259 OID 115449)
-- Name: idx_seats_event_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_seats_event_status ON public.seats USING btree (event_id, status);


--
-- TOC entry 4894 (class 1259 OID 123655)
-- Name: idx_ticket_order; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ticket_order ON public.tickets USING btree (order_id);


--
-- TOC entry 4895 (class 1259 OID 123656)
-- Name: idx_ticket_seat; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ticket_seat ON public.tickets USING btree (seat_id);


--
-- TOC entry 4868 (class 1259 OID 74512)
-- Name: idx_user_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_email ON public.users USING btree (email);


--
-- TOC entry 4869 (class 1259 OID 74511)
-- Name: idx_user_phone; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_phone ON public.users USING btree (phone);


--
-- TOC entry 4870 (class 1259 OID 74513)
-- Name: idx_user_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_role ON public.users USING btree (role);


--
-- TOC entry 4871 (class 1259 OID 74514)
-- Name: idx_user_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_status ON public.users USING btree (status);


-- Completed on 2026-06-19 14:29:14

--
-- PostgreSQL database dump complete
--

-- \unrestrict mEUQ2tT8xO5vYMncedReoZ1tSCwyerkBOZaUL01aL83c70pnZ3SjiGLVUIbHxKE

