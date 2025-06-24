export function isValidId(id) {
  return typeof id === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}
export function isIso(d){ return /^\d{4}-\d{2}-\d{2}$/.test(d); }