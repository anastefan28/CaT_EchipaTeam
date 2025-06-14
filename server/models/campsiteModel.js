import { pool } from '../utils/db.js';

export async function getCampsites (filters = {}) {
  const { id, location, guests, checkin, checkout, sort } = filters;

  const vals = [];
  const conds = [];

  if (id) {
    vals.push(id);
    conds.push(`cs.id = $${vals.length}`);
  }
  if (location) {
  vals.push(`%${location.toLowerCase()}%`);
  const idx = vals.length;          
  conds.push(`(LOWER(cs.name) LIKE $${idx} OR LOWER(cs.county::text) LIKE $${idx})`);
  }
  if (guests) {
    vals.push(guests);
    conds.push(`cs.capacity >= $${vals.length}`);
  }
  if (checkin && checkout) {
    vals.push(checkin, checkout);
    conds.push(`
      cs.id NOT IN (SELECT campsite_id FROM bookings WHERE  status = 'confirmed'
          AND period && daterange($${vals.length - 1}::date,$${vals.length}::date, '[]'))
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

  if (conds.length) q += ` WHERE ` + conds.join(' AND ');
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
