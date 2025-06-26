CREATE OR REPLACE FUNCTION fn_recommendations(
    uid uuid,
    lim int DEFAULT 10,
    price_tband numeric DEFAULT 0.25
) RETURNS TABLE (campsite_id uuid, score numeric)
LANGUAGE plpgsql
AS $$
DECLARE
  booked_ids uuid[] := '{}';
  median_paid numeric := 0;
  common_type text := NULL;
  common_amenities text[] := '{}';
BEGIN
  SELECT 
    ARRAY_AGG(DISTINCT b.campsite_id),
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY cs.price)
  INTO booked_ids, median_paid
  FROM bookings b
  JOIN campsites cs ON cs.id = b.campsite_id
  WHERE b.user_id = uid AND b.status = 'confirmed';

  SELECT mode() WITHIN GROUP (ORDER BY cs.type)
  INTO common_type
  FROM bookings b
  JOIN campsites cs ON cs.id = b.campsite_id
  WHERE b.user_id = uid AND b.status = 'confirmed';

  SELECT ARRAY(
    SELECT DISTINCT a.name
    FROM bookings b
    JOIN campsite_amenity ca ON b.campsite_id = ca.campsite_id
    JOIN amenities a ON a.id = ca.amenity_id
    WHERE b.user_id = uid AND b.status = 'confirmed'
  )
  INTO common_amenities;

  RETURN QUERY
  WITH cand AS (
    SELECT * FROM campsites WHERE id <> ALL(booked_ids)
  ),
  amenities_per_candidate AS (
    SELECT cs.id AS campsite_id, ARRAY_AGG(DISTINCT a.name) AS amenities
    FROM cand cs
    LEFT JOIN campsite_amenity ca ON ca.campsite_id = cs.id
    LEFT JOIN amenities a ON a.id = ca.amenity_id
    GROUP BY cs.id
  ),
  metrics AS (
    SELECT
      cs.id,
      COUNT(b.id) FILTER (WHERE b.status = 'confirmed') AS pop,
      COALESCE(AVG(r.rating), 3)::numeric AS rating,
      CASE 
        WHEN cs.price BETWEEN median_paid * (1 - price_tband) AND median_paid * (1 + price_tband)
        THEN 1 ELSE 0 END AS price_ok,
      CASE 
        WHEN cs.type = common_type::campsite_type THEN 1 ELSE  0 END AS type_match,
      COALESCE(
        CARDINALITY(
          ARRAY(
            SELECT UNNEST(apc.amenities) INTERSECT SELECT UNNEST(common_amenities)
          )
        )::numeric
        /
        NULLIF(
          CARDINALITY(
            ARRAY(
              SELECT UNNEST(apc.amenities) UNION SELECT UNNEST(common_amenities)
            )
          ),
          0
        ),
        0
      ) AS amenity_sim
    FROM cand cs
    LEFT JOIN bookings b ON b.campsite_id = cs.id
    LEFT JOIN reviews r ON r.campsite_id = cs.id
    JOIN amenities_per_candidate apc ON apc.campsite_id = cs.id
    GROUP BY cs.id, cs.price, cs.type, apc.amenities
  )
  SELECT id,
    0.40 * (pop / NULLIF((SELECT MAX(pop) FROM metrics), 0)) +
    0.20 * (rating / 5.0) +
    0.15 * price_ok +
    0.10 * type_match +
    0.15 * amenity_sim AS score
  FROM metrics
  ORDER BY score DESC
  LIMIT lim;
END;
$$;
