
BEGIN;

TRUNCATE TABLE
  media,
  messages, 
  reviews,
  bookings,
  campsite_amenity,
  amenities,
  campsites,
  users
CASCADE;

INSERT INTO users (email, username, password_hash, role) VALUES
  ('alice@example.com' , 'alice' , 'hash_pw_alice' , 'member'),
  ('bob@example.com'   , 'bob'   , 'hash_pw_bob'   , 'member'),
  ('carla@example.com' , 'carla' , 'hash_pw_carla' , 'member'),
  ('david@example.com' , 'david' , 'hash_pw_david' , 'member'),
  ('emma@example.com'  , 'emma'  , 'hash_pw_emma'  , 'member'),
  ('fred@example.com'  , 'fred'  , 'hash_pw_fred'  , 'member'),
  ('gina@example.com'  , 'gina'  , 'hash_pw_gina'  , 'member'),
  ('hugo@example.com'  , 'hugo'  , 'hash_pw_hugo'  , 'member'),
  ('irene@example.com' , 'irene' , 'hash_pw_irene' , 'member'),
  ('admin@example.com' , 'admin' , 'hash_pw_admin' , 'admin')
ON CONFLICT (email) DO NOTHING;


INSERT INTO campsites (name, description, lat, lon, capacity, price, county, type) VALUES
('Mountain View Campground', 'Stunning mountain views with hiking trails nearby.', 46.7700, 23.5800, 6, 45.00, 'Cluj', 'tent'),
('Lakeside Paradise',        'Peaceful lakefront camping with swimming and fishing.', 47.1600, 24.4900, 4, 55.00, 'Bistrița-Năsăud', 'rv'),
('Forest Retreat',           'Secluded forest setting with abundant wildlife.', 45.7500, 21.2300, 8, 38.00, 'Timiș',  'tent'),
('Desert Oasis Campground',  'Desert experience with stargazing and tours.', 44.4200, 26.1100, 2, 120.00, 'București', 'glamping'),
('Riverside Adventures',     'Camping with rafting and kayaking nearby.', 46.7700, 23.5800, 5, 85.00, 'Cluj', 'cabin'),
('Pine Valley Campsite',     'Quiet pine forest for relaxation.', 47.0000, 25.3000, 4, 42.00, 'Suceava',  'tent'),
('Ocean Breeze RV Park',     'Coastal camping with ocean views.', 44.1700, 28.6300, 6, 75.00, 'Constanța', 'rv'),
('Highland Meadows',         'High-altitude meadow camping.', 46.1300, 23.5800, 3, 50.00, 'Alba',  'tent')
ON CONFLICT DO NOTHING;

INSERT INTO amenities (name) VALUES
  ('Fire Pit'), ('Shower'), ('Electric Hook-up'),
  ('Wi-Fi'), ('Pet Friendly'), ('Wheelchair Access'),
  ('Picnic Tables')
ON CONFLICT DO NOTHING;


INSERT INTO campsite_amenity (campsite_id, amenity_id)
SELECT c.id, a.id
FROM   campsites c
JOIN   amenities a ON (
       (c.name = 'Mountain View Campground' AND a.name IN ('Fire Pit','Picnic Tables','Shower')) OR
       (c.name = 'Lakeside Paradise'        AND a.name IN ('Electric Hook-up','Shower','Pet Friendly')) OR
       (c.name = 'Forest Retreat'           AND a.name IN ('Fire Pit','Wi-Fi','Picnic Tables')) OR
       (c.name = 'Desert Oasis Campground'  AND a.name IN ('Electric Hook-up','Wi-Fi','Shower')) OR
       (c.name = 'Riverside Adventures'     AND a.name IN ('Electric Hook-up','Shower','Pet Friendly','Wi-Fi')) OR
       (c.name = 'Pine Valley Campsite'     AND a.name IN ('Fire Pit','Picnic Tables')) OR
       (c.name = 'Ocean Breeze RV Park'     AND a.name IN ('Electric Hook-up','Shower','Wi-Fi','Pet Friendly')) OR
       (c.name = 'Highland Meadows'         AND a.name IN ('Fire Pit','Picnic Tables','Wheelchair Access'))
)
ON CONFLICT DO NOTHING;


WITH cs AS (
  SELECT id AS campsite_id, name, ROW_NUMBER() OVER () AS rn FROM campsites
), u AS (
  SELECT id AS user_id, ROW_NUMBER() OVER () AS rn FROM users
)
INSERT INTO reviews (campsite_id, user_id, rating, body_md)
SELECT
  cs.campsite_id,
  u.user_id,
  3 + ((cs.rn + u.rn) % 3),                        
  format('Review %s for %s', u.rn, cs.name)
FROM cs
JOIN u ON u.rn <= 3
ON CONFLICT DO NOTHING;


WITH cs AS (
  SELECT id AS campsite_id, name FROM campsites
), u AS (
  SELECT id AS user_id, ROW_NUMBER() OVER () AS rn FROM users
)
INSERT INTO messages (campsite_id, user_id, body_md)
SELECT
  cs.campsite_id,
  u.user_id,
  format('Message %s in %s chat', u.rn, cs.name)
FROM cs
JOIN u ON u.rn BETWEEN 4 AND 6
ON CONFLICT DO NOTHING;


SET LOCAL media.base_path TO 'E:\Anul II\Semestrul II\Web\CaT_EchipaTeam\helpers\media';   


CREATE OR REPLACE FUNCTION public.slugify(txt text)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT regexp_replace(
           lower(translate(txt,
             ' ĂÂÎȘŞȚŢăâîșşțţÀÁÂÃÄÅÇÈÉÊËÌÍÎÏÑÒÓÔÕÖØÙÚÛÜÝŸàáâãäåçèéêëìíîïñòóôõöøùúûüýÿ',
             ' aaiissttaaaiissttaaaceeeeiiiinoooooouuuuyyaaaiissttaaaceeeeiiiinoooooouuuuyy')),
           '[^a-z0-9]+', '-', 'g');
$$;


DO $$
DECLARE
  c     RECORD;
  p1    text;
  p2    text;
BEGIN
  FOR c IN SELECT id, name FROM campsites LOOP
    p1 := current_setting('media.base_path') || '/photos/' || slugify(c.name) || '/photo_1.jpg';
    p2 := current_setting('media.base_path') || '/photos/' || slugify(c.name) || '/photo_2.jpg';

    INSERT INTO media (campsite_id, type, data)
    VALUES
      (c.id, 'image', pg_read_binary_file(p1)),
      (c.id, 'image', pg_read_binary_file(p2));
  END LOOP;
END $$;

DO $$
DECLARE
  rec  RECORD;
  v1   text;
  v2   text;
BEGIN
  FOR rec IN
      SELECT DISTINCT ON (r.campsite_id)
             r.id  AS review_id,
             r.campsite_id,
             c.name
      FROM   reviews r
      JOIN   campsites c ON c.id = r.campsite_id
      ORDER  BY r.campsite_id, r.created_at
  LOOP
      v1 := current_setting('media.base_path') || '/videos/' || slugify(rec.name) || '/video_1.mp4';
      v2 := current_setting('media.base_path') || '/videos/' || slugify(rec.name) || '/video_2.mp4';

      INSERT INTO media (campsite_id, review_id, type, data)
      VALUES
        (rec.campsite_id, rec.review_id, 'video', pg_read_binary_file(v1)),
        (rec.campsite_id, rec.review_id, 'video', pg_read_binary_file(v2));
  END LOOP;
END $$;

COMMIT;




