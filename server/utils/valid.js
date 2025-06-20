export function isValidId(id) {
    if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
        return false;
    }
    return true;    
}

export const MAX_SIZE = 5 * 1024 * 1024;       
export function isIso(d){ return /^\d{4}-\d{2}-\d{2}$/.test(d); }

