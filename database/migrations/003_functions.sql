CREATE OR REPLACE FUNCTION fn_recommendations(
    uid uuid,
    lim int DEFAULT 10,
    price_tband numeric  DEFAULT 0.25  
) RETURNS TABLE (campsite_id uuid, score numeric)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  booked_ids uuid[] := '{}';
  median_paid numeric := 0;
BEGIN
  SELECT ARRAY_AGG(DISTINCT b.campsite_id), PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY cs.price)
  INTO booked_ids, median_paid
  FROM bookings  b
  JOIN campsites cs ON cs.id = b.campsite_id
  WHERE b.user_id = uid AND b.status='confirmed';

  RETURN QUERY
  WITH cand AS (
    SELECT *
    FROM campsites
    WHERE  id <> ALL(booked_ids)
  ),
  metrics AS (
    SELECT
      cs.id,COUNT(b.id) FILTER (WHERE b.status='confirmed') AS pop,
            COALESCE(AVG(r.rating),3)::numeric AS rating,
            CASE WHEN cs.price BETWEEN median_paid*(1-price_tband) AND median_paid*(1+price_tband)
                THEN 1 ELSE 0 END AS price_ok
    FROM cand cs
    LEFT JOIN bookings b ON b.campsite_id = cs.id
    LEFT JOIN reviews  r ON r.campsite_id = cs.id
    GROUP BY cs.id,  cs.price
  )
  SELECT id, 0.60 * (pop/ NULLIF((SELECT MAX(pop) FROM metrics),0))
    + 0.25 * (rating / 5.0)
    + 0.15 * price_ok AS score FROM metrics ORDER BY score DESC LIMIT lim;
END;
$$;