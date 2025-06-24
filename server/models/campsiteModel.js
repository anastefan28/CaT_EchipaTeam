import { pool } from "../utils/db.js";


export async function getCampsites (filters = {}) {
  const { id, location, capacity, checkin, checkout, sort } = filters;

  const vals = [];
  const conds = [];

  if (id) {
    vals.push(id);
    conds.push(`cs.id = $${vals.length}`);
  }
  if (location) {
    vals.push(`%${location.toLowerCase()}%`);
    const idx = vals.length;
    conds.push(
      `(LOWER(cs.name) LIKE $${idx} OR LOWER(cs.county::text) LIKE $${idx})`
    );
  }
  if (capacity) {
    vals.push(capacity);
    conds.push(`cs.capacity >= $${vals.length}`);
  }
  if (checkin && checkout) {
    vals.push(checkin, checkout);
    conds.push(`
      cs.id NOT IN (SELECT campsite_id FROM bookings WHERE  status = 'confirmed'
          AND period && daterange($${vals.length - 1}::date,$${
      vals.length
    }::date, '[]'))
    `);
  }

  let q = `
    SELECT
      cs.*,
      COUNT(DISTINCT b.id) AS bookings_count,
      COALESCE(rv.review_count, 0) AS review_count,
      COALESCE(ROUND(rv.avg_rating, 1), 0) AS avg_rating,
      COALESCE(am.amenities, '{}'::text[]) AS amenities,
      COALESCE(m.media_ids, '{}'::uuid[])  AS media_ids
    FROM campsites cs
    LEFT JOIN bookings b ON b.campsite_id = cs.id AND b.status= 'confirmed'
    LEFT JOIN (SELECT campsite_id,COUNT(*) AS review_count,AVG(rating) AS avg_rating
      FROM reviews GROUP BY campsite_id) rv ON rv.campsite_id = cs.id
    LEFT JOIN LATERAL(SELECT array_agg(a.name ORDER BY a.name) AS amenities
      FROM campsite_amenity ca JOIN   amenities a ON a.id = ca.amenity_id
      WHERE  ca.campsite_id = cs.id) am ON TRUE
    LEFT JOIN LATERAL (SELECT array_agg(id ORDER BY uploaded_at DESC) AS media_ids
     FROM media WHERE campsite_id = cs.id AND review_id IS NULL AND message_id IS NULL LIMIT 1) m ON TRUE
  `;

  if (conds.length) q += ` WHERE ` + conds.join(" AND ");
  q += `
    GROUP BY cs.id, rv.review_count, rv.avg_rating,
             am.amenities, m.media_ids
  `;

  if(!id) {
    const SORT_SQL = {
      'popular': 'ORDER BY bookings_count DESC LIMIT 10',
      'price-low' : 'ORDER BY cs.price ASC',
      'price-high' : 'ORDER BY cs.price DESC',
      'rating' : 'ORDER BY rv.avg_rating DESC',
      'newest': 'ORDER BY cs.created_at DESC'
    };
    if(!sort) q+= ' ORDER BY cs.created_at DESC';
    else 
      q += ' ' + SORT_SQL[sort];
  }

  const { rows } = await pool.query(q, vals);
  return rows;
}

export async function createCampsite(camp) {
  const query = `
    INSERT INTO campsites (name, description, lat, lon, capacity, price, county, type)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *;
  `;
  const values = [
    camp.name,
    camp.description,
    camp.lat,
    camp.lon,
    camp.capacity,
    camp.price,
    camp.county,
    camp.type,
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
}

export async function deleteCampsiteById(id) {
  const result = await pool.query("DELETE FROM campsites WHERE id = $1", [id]);
  return result.rowCount > 0;
}

export async function findCampsiteById(id) {
  const result = await pool.query(
    `SELECT id, name, description, lat, lon, capacity, price, county, type
     FROM campsites WHERE id = $1`,
    [id]
  );
  return result.rows[0];
}

export async function updateCampsiteById(
  id,
  { name, description, lat, lon, capacity, price, county, type }
) {
  const query = `
    UPDATE campsites
    SET name = $1,
        description = $2,
        lat = $3,
        lon = $4,
        capacity = $5,
        price = $6,
        county = $7,
        type = $8
    WHERE id = $9
  `;
  const values = [
    name,
    description,
    lat,
    lon,
    capacity,
    price,
    county,
    type,
    id,
  ];
  await pool.query(query, values);
}
