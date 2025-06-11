import { pool } from '../utils/db.js';

export async function getCampsites(filters) {
  const {
    location,
    guests,
    checkin,
    checkout,
    sort,
    media = 'main'
  } = filters;

  const values = [];
  const conditions = [];

  let query = `
    SELECT
      cs.*,
      COUNT(DISTINCT b.id) AS bookings_count,
      COALESCE(rv.review_count, 0) AS review_count,
      COALESCE(ROUND(rv.avg_rating, 1), 0) AS avg_rating
    	FROM campsites cs LEFT JOIN bookings b ON b.campsite_id = cs.id AND b.status = 'confirmed'
    	LEFT JOIN (SELECT campsite_id, COUNT(*)   AS review_count, AVG(rating) AS avg_rating FROM reviews
      	GROUP BY campsite_id) rv ON rv.campsite_id = cs.id
  `;

  if (location) {
    values.push(`%${location.toLowerCase()}%`);
    conditions.push(`LOWER(cs.name) LIKE $${values.length}`);
  }
  if (guests) {
    values.push(guests);
    conditions.push(`cs.capacity >= $${values.length}`);
  }
  if (checkin && checkout) {
    values.push(checkin, checkout);
    conditions.push(`
      cs.id NOT IN (SELECT campsite_id FROM bookings WHERE status = 'confirmed'
          AND period && daterange($${values.length - 1}::date,$${values.length}::date, '[]')
      )
    `);
  }
  if (conditions.length) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += `
    GROUP BY cs.id, rv.review_count, rv.avg_rating
  `;
  if (sort === 'popular') {
    query += ` ORDER BY bookings_count DESC LIMIT 10`;
  } else {
    query += ` ORDER BY cs.created_at DESC`;
  }

  const { rows: campsites } = await pool.query(query, values);
  if (campsites.length === 0) return [];

  const ids = campsites.map(c => c.id);
  const { rows: amenRows } = await pool.query(
    `
      SELECT ca.campsite_id, a.name AS amenity
      FROM campsite_amenity ca
      JOIN amenities a
        ON ca.amenity_id = a.id
      WHERE ca.campsite_id = ANY($1)
    `,
    [ids]
  );
  const amenitiesMap = {};
  for (const { campsite_id, amenity } of amenRows) {
    amenitiesMap[campsite_id] ??= [];
    amenitiesMap[campsite_id].push(amenity);
  }

  let mediaQuery = `SELECT campsite_id, path FROM media WHERE campsite_id = ANY($1)`;
  if (media === 'main') {
    mediaQuery += ` AND review_id IS NULL AND message_id IS NULL`;
  }
  mediaQuery += ` ORDER BY uploaded_at DESC`;

  const { rows: mediaRows } = await pool.query(mediaQuery, [ids]);
  const mediaMap = {};
  for (const { campsite_id, path } of mediaRows) {
    mediaMap[campsite_id] ??= [];
    mediaMap[campsite_id].push(path);
  }
  for (const c of campsites) {
    c.amenities = amenitiesMap[c.id] || [];
    c.media     = mediaMap[c.id]     || [];
  }

  return campsites;
}
