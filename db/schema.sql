-- FanRewards API — database schema snapshot
-- Generated with: docker exec <postgres> pg_dump -U belong -d fan_rewards --schema-only --no-owner --no-privileges
-- This is a point-in-time snapshot for readability (like Rails' schema.rb).
-- Migrations in src/migrations/ remain the source of truth; regenerate this after schema changes.

--
-- PostgreSQL database dump
--

\restrict rGro25uu3GH3sbVe9n5571nR3VzrMv2uTInF6aCY9g6KrrOHHmJpuow1rvLQg9g

-- Dumped from database version 16.14
-- Dumped by pg_dump version 16.14

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
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: challenges_difficulty_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.challenges_difficulty_enum AS ENUM (
    'easy',
    'medium',
    'hard'
);


--
-- Name: reward_redemptions_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.reward_redemptions_status_enum AS ENUM (
    'pending',
    'fulfilled',
    'cancelled'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: challenge_completions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.challenge_completions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "userId" uuid NOT NULL,
    "challengeId" uuid NOT NULL,
    "pointsEarned" integer NOT NULL,
    "listenPercentage" integer NOT NULL,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: challenges; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.challenges (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    title character varying(255) NOT NULL,
    artist character varying(255) NOT NULL,
    description text NOT NULL,
    points integer NOT NULL,
    "durationSeconds" integer NOT NULL,
    difficulty public.challenges_difficulty_enum NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.migrations (
    id integer NOT NULL,
    "timestamp" bigint NOT NULL,
    name character varying NOT NULL
);


--
-- Name: migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.migrations_id_seq OWNED BY public.migrations.id;


--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.refresh_tokens (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "userId" uuid NOT NULL,
    "tokenHash" character varying(64) NOT NULL,
    "expiresAt" timestamp with time zone NOT NULL,
    "revokedAt" timestamp with time zone,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: reward_redemptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reward_redemptions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "userId" uuid NOT NULL,
    "rewardId" uuid NOT NULL,
    "pointsSpent" integer NOT NULL,
    status public.reward_redemptions_status_enum DEFAULT 'pending'::public.reward_redemptions_status_enum NOT NULL,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: rewards; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rewards (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    description text NOT NULL,
    "pointsCost" integer NOT NULL,
    "isAvailable" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    email character varying(255) NOT NULL,
    "passwordHash" character varying(255) NOT NULL,
    "displayName" character varying(100),
    "totalPoints" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: migrations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.migrations ALTER COLUMN id SET DEFAULT nextval('public.migrations_id_seq'::regclass);


--
-- Name: challenge_completions PK_02cdc0f2c385611ee53c90a38f8; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.challenge_completions
    ADD CONSTRAINT "PK_02cdc0f2c385611ee53c90a38f8" PRIMARY KEY (id);


--
-- Name: challenges PK_1e664e93171e20fe4d6125466af; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.challenges
    ADD CONSTRAINT "PK_1e664e93171e20fe4d6125466af" PRIMARY KEY (id);


--
-- Name: rewards PK_3d947441a48debeb9b7366f8b8c; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rewards
    ADD CONSTRAINT "PK_3d947441a48debeb9b7366f8b8c" PRIMARY KEY (id);


--
-- Name: refresh_tokens PK_7d8bee0204106019488c4c50ffa; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT "PK_7d8bee0204106019488c4c50ffa" PRIMARY KEY (id);


--
-- Name: migrations PK_8c82d7f526340ab734260ea46be; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT "PK_8c82d7f526340ab734260ea46be" PRIMARY KEY (id);


--
-- Name: users PK_a3ffb1c0c8416b9fc6f907b7433; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY (id);


--
-- Name: reward_redemptions PK_e02d178fa8c54295d8edc8781b3; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reward_redemptions
    ADD CONSTRAINT "PK_e02d178fa8c54295d8edc8781b3" PRIMARY KEY (id);


--
-- Name: IDX_5490172918e20aa466c63c9ac1; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_5490172918e20aa466c63c9ac1" ON public.reward_redemptions USING btree ("userId");


--
-- Name: IDX_610102b60fea1455310ccd299d; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_610102b60fea1455310ccd299d" ON public.refresh_tokens USING btree ("userId");


--
-- Name: IDX_954fe2b291d91c0e7114db4436; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_954fe2b291d91c0e7114db4436" ON public.rewards USING btree ("isAvailable");


--
-- Name: IDX_97672ac88f789774dd47f7c8be; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IDX_97672ac88f789774dd47f7c8be" ON public.users USING btree (email);


--
-- Name: IDX_ba78ce3a5acde2028ae204f1a6; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_ba78ce3a5acde2028ae204f1a6" ON public.users USING btree ("totalPoints");


--
-- Name: IDX_c25bc63d248ca90e8dcc1d92d0; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IDX_c25bc63d248ca90e8dcc1d92d0" ON public.refresh_tokens USING btree ("tokenHash");


--
-- Name: IDX_d4d11f8a530ef3b88b5e8161d2; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_d4d11f8a530ef3b88b5e8161d2" ON public.challenge_completions USING btree ("userId");


--
-- Name: IDX_da4132b85b217acdddb7878c20; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_da4132b85b217acdddb7878c20" ON public.challenge_completions USING btree ("challengeId");


--
-- Name: IDX_fac5687ac70047314a7fb12112; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_fac5687ac70047314a7fb12112" ON public.challenges USING btree ("isActive");


--
-- Name: reward_redemptions FK_5490172918e20aa466c63c9ac12; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reward_redemptions
    ADD CONSTRAINT "FK_5490172918e20aa466c63c9ac12" FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: refresh_tokens FK_610102b60fea1455310ccd299de; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT "FK_610102b60fea1455310ccd299de" FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: reward_redemptions FK_7405900a3e5b2843630b0a83cbe; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reward_redemptions
    ADD CONSTRAINT "FK_7405900a3e5b2843630b0a83cbe" FOREIGN KEY ("rewardId") REFERENCES public.rewards(id) ON DELETE CASCADE;


--
-- Name: challenge_completions FK_d4d11f8a530ef3b88b5e8161d23; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.challenge_completions
    ADD CONSTRAINT "FK_d4d11f8a530ef3b88b5e8161d23" FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: challenge_completions FK_da4132b85b217acdddb7878c20d; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.challenge_completions
    ADD CONSTRAINT "FK_da4132b85b217acdddb7878c20d" FOREIGN KEY ("challengeId") REFERENCES public.challenges(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict rGro25uu3GH3sbVe9n5571nR3VzrMv2uTInF6aCY9g6KrrOHHmJpuow1rvLQg9g

