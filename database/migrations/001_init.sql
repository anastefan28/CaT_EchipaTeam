
CREATE TYPE user_role AS ENUM ('member', 'admin');
CREATE TYPE campsite_type AS ENUM ('tent', 'rv', 'cabin', 'glamping');

CREATE TYPE county_name AS ENUM (
  'Alba', 'Arad', 'Argeș', 'Bacău', 'Bihor', 'Bistrița-Năsăud', 'Botoșani', 'Brăila',
  'Brașov', 'București', 'Buzău', 'Caraș-Severin', 'Călărași', 'Cluj', 'Constanța', 'Covasna',
  'Dâmbovița', 'Dolj', 'Galați', 'Giurgiu', 'Gorj', 'Harghita', 'Hunedoara', 'Ialomița',
  'Iași', 'Ilfov', 'Maramureș', 'Mehedinți', 'Mureș', 'Neamț', 'Olt', 'Prahova',
  'Sălaj', 'Satu Mare', 'Sibiu', 'Suceava', 'Teleorman', 'Timiș', 'Tulcea', 'Vaslui', 'Vâlcea', 'Vrancea'
);
CREATE TYPE media_type AS ENUM ('image', 'video', 'audio');

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  username TEXT,
  password_hash TEXT,         
  oauth_provider TEXT,          
  oauth_sub TEXT,           
  role user_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp,
  confirmed BOOLEAN DEFAULT FALSE,
  confirmation_token TEXT
);

CREATE TABLE campsites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  lat NUMERIC(9,6) NOT NULL CHECK (lat BETWEEN -90  AND 90),
  lon NUMERIC(9,6) NOT NULL CHECK (lon BETWEEN -180 AND 180),
  capacity INT CHECK (capacity > 0),
  price NUMERIC(8,2) CHECK (price >= 0),
  county county_name  NOT NULL DEFAULT 'Iași',
  type campsite_type NOT NULL DEFAULT 'tent',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT current_timestamp
);

CREATE INDEX idx_campsites_latlon ON campsites (lat, lon);   
CREATE INDEX idx_campsites_county ON campsites (county);
CREATE INDEX idx_campsites_type ON campsites (type);
CREATE INDEX idx_campsites_price ON campsites (price);

CREATE TABLE amenities (
  id   SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL
);

CREATE TABLE campsite_amenity (
  campsite_id UUID REFERENCES campsites(id) ON DELETE CASCADE,
  amenity_id INT REFERENCES amenities(id) ON DELETE CASCADE,
  PRIMARY KEY (campsite_id, amenity_id)
);

CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  campsite_id UUID REFERENCES campsites(id)  ON DELETE CASCADE,
  period DATERANGE  NOT NULL,
  guests INT CHECK (guests > 0),
  status TEXT NOT NULL DEFAULT 'confirmed',    
  created_at  TIMESTAMPTZ NOT NULL DEFAULT current_timestamp
);

ALTER TABLE bookings
  ADD CONSTRAINT no_overlaps
  EXCLUDE USING GIST
    (campsite_id WITH =,  period WITH &&)  WHERE (status = 'confirmed');

CREATE INDEX ON bookings (user_id);
CREATE INDEX ON bookings USING GIST (period);


CREATE TABLE reviews (
  id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campsite_id UUID REFERENCES campsites(id)  ON DELETE CASCADE,
  user_id  UUID REFERENCES users(id) ON DELETE CASCADE,
  rating INT CHECK (rating BETWEEN 1 AND 5),
  body_md TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp,
  UNIQUE (campsite_id, user_id)             
);

CREATE INDEX ON reviews (campsite_id);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campsite_id UUID REFERENCES campsites(id)  ON DELETE CASCADE,
  user_id UUID REFERENCES users(id)      ON DELETE CASCADE,
  body_md TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp
);

CREATE INDEX ON messages (campsite_id, created_at);

CREATE TABLE media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campsite_id UUID REFERENCES campsites(id)  ON DELETE CASCADE,
  review_id UUID REFERENCES reviews(id)    ON DELETE CASCADE,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  type media_type NOT NULL,
  mime TEXT,
  data BYTEA NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp
);
CREATE INDEX ON media (campsite_id);
CREATE INDEX ON media (review_id);

