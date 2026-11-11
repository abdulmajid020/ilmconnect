-- =====================================================================
-- 000002: SPATIAL DATABASE EXTENSION & TEACHER LOCATIONS (POSTGIS)
-- =====================================================================

-- 1. Enable PostGIS Extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Drop any legacy/incomplete teacher_locations table to ensure clean schema
DROP TABLE IF EXISTS teacher_locations CASCADE;

-- 3. Teacher Physical Teaching Locations Table
CREATE TABLE teacher_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_profile_id UUID NOT NULL REFERENCES teacher_profiles(id) ON DELETE CASCADE,
    location_name VARCHAR(150) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) DEFAULT 'Accra',
    region VARCHAR(100) DEFAULT 'Greater Accra',
    location_type VARCHAR(50) DEFAULT 'MADRASSA', -- 'MADRASSA', 'MOSQUE', 'ISLAMIC_CENTER', 'HOME_STUDY'
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    location GEOGRAPHY(POINT, 4326),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. Automatic Trigger to synchronize geography POINT from lat/long
CREATE OR REPLACE FUNCTION set_teacher_location_geom()
RETURNS TRIGGER AS $$
BEGIN
    NEW.location := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_teacher_location_geom ON teacher_locations;
CREATE TRIGGER trg_set_teacher_location_geom
BEFORE INSERT OR UPDATE OF latitude, longitude ON teacher_locations
FOR EACH ROW
EXECUTE FUNCTION set_teacher_location_geom();

-- 5. GiST Spatial Indexing for lightning-fast radius searches (ST_DWithin)
CREATE INDEX idx_teacher_locations_geography ON teacher_locations USING GIST (location);
CREATE INDEX idx_teacher_locations_teacher ON teacher_locations (teacher_profile_id);
