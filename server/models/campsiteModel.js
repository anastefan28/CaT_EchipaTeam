import { pool } from '../utils/db.js';


export async function getCampsites(filters) {
  const {
    region, type, minPrice, maxPrice, location, capacity,
    minRating, amenities, checkin, checkout, sortBy
  } = filters;

  const conditions = [];
  const values = [];
  let joins = '';

  if (region) {
    values.push(region);
    conditions.push(`region = $${values.length}`);
  }

  if (type) {
    values.push(type);
    conditions.push(`type = $${values.length}`);
  }

  if (minPrice !== undefined) {
    values.push(minPrice);
    conditions.push(`price >= $${values.length}`);
  }

  if (maxPrice !== undefined) {
    values.push(maxPrice);
    conditions.push(`price <= $${values.length}`);
  }

  if (location) {
    values.push(`%${location.toLowerCase()}%`);
    conditions.push(`LOWER(name) LIKE $${values.length}`);
  }

  if (capacity) {
    const match = capacity.match(/^(\d+)(?:\+|-(\d+))?$/);
    if (match) {
      const minCap = parseInt(match[1]);
      const maxCap = match[2] ? parseInt(match[2]) : null;
      values.push(minCap);
      conditions.push(`capacity >= $${values.length}`);
      if (maxCap) {
        values.push(maxCap);
        conditions.push(`capacity <= $${values.length}`);
      }
    }
  }

  if (minRating) {
    joins += `
      JOIN (
        SELECT campsite_id, AVG(rating) as avg_rating
        FROM reviews
        GROUP BY campsite_id
      ) r ON campsites.id = r.campsite_id`;
    values.push(minRating);
    conditions.push(`r.avg_rating >= $${values.length}`);
  }

  if (amenities && amenities.length) {
    joins += `
      JOIN campsite_amenity ca ON campsites.id = ca.campsite_id
      JOIN amenities a ON ca.amenity_id = a.id`;
    values.push(amenities);
    conditions.push(`a.name = ANY($${values.length})`);
  }

  if (checkin && checkout) {
    joins += `
      LEFT JOIN bookings b ON campsites.id = b.campsite_id
        AND NOT (b.checkout <= $${values.length + 1} OR b.checkin >= $${values.length + 2})`;
    values.push(checkin, checkout);
    conditions.push(`b.id IS NULL`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const orderClause = sortBy === 'price'
    ? 'ORDER BY price ASC'
    : sortBy === 'rating'
    ? 'ORDER BY r.avg_rating DESC'
    : 'ORDER BY created_at DESC';

  const query = `
    SELECT DISTINCT campsites.*
    FROM campsites
    ${joins}
    ${whereClause}
    ${orderClause}
  `;

  const result = await pool.query(query, values);
  return result.rows;
}
