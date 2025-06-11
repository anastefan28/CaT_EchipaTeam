
CREATE TYPE user_role       AS ENUM ('member', 'admin');
CREATE TYPE campsite_type   AS ENUM ('tent', 'rv', 'cabin', 'glamping', 'mixed');
CREATE TYPE region_code     AS ENUM (
  'RO-NV',  -- North-West
  'RO-C',   -- Centre
  'RO-S',   -- South
  'RO-E',   -- East
  'OTHER'  
);
CREATE TYPE media_type AS ENUM ('image', 'video', 'audio');

CREATE TABLE users (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email          TEXT UNIQUE NOT NULL,
  username       TEXT,
  password_hash  TEXT,         
  oauth_provider TEXT,          
  oauth_sub      TEXT,           
  role           user_role NOT NULL DEFAULT 'member',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT current_timestamp
);

CREATE TABLE campsites (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  lat         NUMERIC(9,6) NOT NULL CHECK (lat BETWEEN -90  AND 90),
  lon         NUMERIC(9,6) NOT NULL CHECK (lon BETWEEN -180 AND 180),
  capacity    INT    CHECK (capacity > 0),
  price       NUMERIC(8,2) CHECK (price >= 0),
  region      region_code   NOT NULL DEFAULT 'OTHER',
  type        campsite_type NOT NULL DEFAULT 'tent',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT current_timestamp
);

CREATE INDEX idx_campsites_latlon   ON campsites (lat, lon);   
CREATE INDEX idx_campsites_region   ON campsites (region);
CREATE INDEX idx_campsites_type     ON campsites (type);
CREATE INDEX idx_campsites_price    ON campsites (price);

CREATE OR REPLACE VIEW campsites_view AS
SELECT id, name, description,
       lat, lon,
       capacity, price, region, type, created_at
FROM   campsites;

CREATE TABLE amenities (
  id   SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL
);

CREATE TABLE campsite_amenity (
  campsite_id UUID REFERENCES campsites(id) ON DELETE CASCADE,
  amenity_id  INT  REFERENCES amenities(id) ON DELETE CASCADE,
  PRIMARY KEY (campsite_id, amenity_id)
);
INSERT INTO amenities (name) VALUES
  ('Fire Pit'), ('Shower'), ('Electric Hook-up'),
  ('Wi-Fi'), ('Pet Friendly'), ('Wheelchair Access'),
  ('Picnic Tables')
ON CONFLICT DO NOTHING;

CREATE TABLE bookings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id)      ON DELETE CASCADE,
  campsite_id UUID REFERENCES campsites(id)  ON DELETE CASCADE,
  period      DATERANGE  NOT NULL,
  guests      INT CHECK (guests > 0),
  status      TEXT NOT NULL DEFAULT 'confirmed',    -- confirmed | cancelled
  created_at  TIMESTAMPTZ NOT NULL DEFAULT current_timestamp
);

ALTER TABLE bookings
  ADD CONSTRAINT no_overlaps
  EXCLUDE USING GIST (campsite_id WITH =, period WITH &&)
  WHERE (status = 'confirmed');

CREATE INDEX ON bookings (user_id);
CREATE INDEX ON bookings USING GIST (period);


CREATE TABLE reviews (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campsite_id UUID REFERENCES campsites(id)  ON DELETE CASCADE,
  user_id     UUID REFERENCES users(id)      ON DELETE CASCADE,
  rating      INT CHECK (rating BETWEEN 1 AND 5),
  body_md     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT current_timestamp,
  UNIQUE (campsite_id, user_id)             
);

CREATE INDEX ON reviews (campsite_id);

CREATE TABLE messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campsite_id UUID REFERENCES campsites(id)  ON DELETE CASCADE,
  user_id     UUID REFERENCES users(id)      ON DELETE CASCADE,
  body_md     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT current_timestamp
);

CREATE INDEX ON messages (campsite_id, created_at);

CREATE TABLE media (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campsite_id UUID REFERENCES campsites(id)  ON DELETE CASCADE,
  review_id   UUID REFERENCES reviews(id)    ON DELETE CASCADE,
  message_id  UUID REFERENCES messages(id) ON DELETE CASCADE,
  type        media_type NOT NULL,
  mime        TEXT NOT NULL,
  path        TEXT NOT NULL,                 
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp
);

CREATE INDEX ON media (campsite_id);
CREATE INDEX ON media (review_id);

INSERT INTO campsites (name, description, lat, lon, capacity, price, region, type) VALUES
('Mountain View Campground', 'Stunning mountain views with hiking trails nearby.', 46.7700, 23.5800, 6, 45.00, 'RO-NV', 'tent'),
('Lakeside Paradise', 'Peaceful lakefront camping with swimming and fishing.', 47.1600, 24.4900, 4, 55.00, 'RO-NV', 'rv'),
('Forest Retreat', 'Secluded forest setting with abundant wildlife.', 45.7500, 21.2300, 8, 38.00, 'RO-C', 'tent'),
('Desert Oasis Campground', 'Desert experience with stargazing and tours.', 44.4200, 26.1100, 2, 120.00, 'RO-S', 'glamping'),
('Riverside Adventures', 'Camping with rafting and kayaking nearby.', 46.7700, 23.5800, 5, 85.00, 'RO-E', 'cabin'),
('Pine Valley Campsite', 'Quiet pine forest for relaxation.', 47.0000, 25.3000, 4, 42.00, 'RO-C', 'tent'),
('Ocean Breeze RV Park', 'Coastal camping with ocean views.', 44.1700, 28.6300, 6, 75.00, 'RO-E', 'rv'),
('Highland Meadows', 'High-altitude meadow camping.', 46.1300, 23.5800, 3, 50.00, 'RO-C', 'tent');



INSERT INTO campsite_amenity (campsite_id, amenity_id)
SELECT c.id, a.id FROM (SELECT id, name FROM campsites) c, (SELECT id, name FROM amenities) a
WHERE c.name = 'Mountain View Campground' AND a.name IN ('Fire Pit', 'Picnic Tables', 'Shower');

INSERT INTO campsite_amenity (campsite_id, amenity_id)
SELECT c.id, a.id FROM (SELECT id, name FROM campsites) c, (SELECT id, name FROM amenities) a
WHERE c.name = 'Lakeside Paradise' AND a.name IN ('Electric Hook-up', 'Shower', 'Pet Friendly');

INSERT INTO campsite_amenity (campsite_id, amenity_id)
SELECT c.id, a.id FROM (SELECT id, name FROM campsites) c, (SELECT id, name FROM amenities) a
WHERE c.name = 'Forest Retreat' AND a.name IN ('Fire Pit', 'Wi-Fi', 'Picnic Tables');

INSERT INTO campsite_amenity (campsite_id, amenity_id)
SELECT c.id, a.id FROM (SELECT id, name FROM campsites) c, (SELECT id, name FROM amenities) a
WHERE c.name = 'Desert Oasis Campground' AND a.name IN ('Electric Hook-up', 'Wi-Fi', 'Shower');

INSERT INTO campsite_amenity (campsite_id, amenity_id)
SELECT c.id, a.id FROM (SELECT id, name FROM campsites) c, (SELECT id, name FROM amenities) a
WHERE c.name = 'Riverside Adventures' AND a.name IN ('Electric Hook-up', 'Shower', 'Pet Friendly', 'Wi-Fi');

INSERT INTO campsite_amenity (campsite_id, amenity_id)
SELECT c.id, a.id FROM (SELECT id, name FROM campsites) c, (SELECT id, name FROM amenities) a
WHERE c.name = 'Pine Valley Campsite' AND a.name IN ('Fire Pit', 'Picnic Tables');

INSERT INTO campsite_amenity (campsite_id, amenity_id)
SELECT c.id, a.id FROM (SELECT id, name FROM campsites) c, (SELECT id, name FROM amenities) a
WHERE c.name = 'Ocean Breeze RV Park' AND a.name IN ('Electric Hook-up', 'Shower', 'Wi-Fi', 'Pet Friendly');

INSERT INTO campsite_amenity (campsite_id, amenity_id)
SELECT c.id, a.id FROM (SELECT id, name FROM campsites) c, (SELECT id, name FROM amenities) a
WHERE c.name = 'Highland Meadows' AND a.name IN ('Fire Pit', 'Picnic Tables', 'Wheelchair Access');
