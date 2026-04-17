-- First Island Chain Military Database Schema
-- SQLite / PostgreSQL compatible

CREATE TABLE IF NOT EXISTS countries (
    code        TEXT PRIMARY KEY,          -- ISO-3166 alpha-2, e.g. 'US','JP','KR','TW','PH'
    name_en     TEXT NOT NULL,
    name_local  TEXT
);

CREATE TABLE IF NOT EXISTS bases (
    id              TEXT PRIMARY KEY,      -- e.g. 'US-KADENA'
    name            TEXT NOT NULL,
    name_local      TEXT,
    country         TEXT NOT NULL REFERENCES countries(code),
    branch          TEXT NOT NULL,         -- Army / Navy / Air Force / Marines / Space / Coast Guard / Joint
    type            TEXT,                  -- Airbase / Naval / Army / Joint / Missile / Radar / Logistics
    location        TEXT,                  -- city/prefecture/state
    latitude        REAL,
    longitude       REAL,
    operator        TEXT,                  -- tenant command
    role            TEXT,
    notable_units   TEXT,                  -- JSON array serialized as TEXT
    established     INTEGER
);

CREATE TABLE IF NOT EXISTS weapons (
    id                TEXT PRIMARY KEY,    -- e.g. 'US-F35A'
    name              TEXT NOT NULL,
    category          TEXT NOT NULL,       -- Fighter / Bomber / Tank / Destroyer / SSBN / SAM / SSM / UAV / ISR / Radar / Artillery / IFV / Helicopter
    branch            TEXT NOT NULL,
    country           TEXT NOT NULL REFERENCES countries(code),
    origin            TEXT,                -- country of origin
    role              TEXT,
    quantity          INTEGER,
    in_service_since  INTEGER,
    status            TEXT,                -- Active / Retiring / Planned / Ordered
    range_km          REAL,
    notes             TEXT
);

CREATE INDEX IF NOT EXISTS idx_bases_country  ON bases(country);
CREATE INDEX IF NOT EXISTS idx_bases_branch   ON bases(branch);
CREATE INDEX IF NOT EXISTS idx_weapons_country ON weapons(country);
CREATE INDEX IF NOT EXISTS idx_weapons_branch  ON weapons(branch);
CREATE INDEX IF NOT EXISTS idx_weapons_category ON weapons(category);
