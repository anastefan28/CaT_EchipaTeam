import { getCampsites, deleteCampsiteById } from "../models/campsiteModel.js";
import { sendJson } from "../utils/json.js";

export async function handleGetCampsites(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const filters = {
    location: url.searchParams.get("location")?.trim() || undefined,
    guests: url.searchParams.get("guests")
      ? parseInt(url.searchParams.get("guests"))
      : undefined,
    checkin: url.searchParams.get("checkin") || undefined,
    checkout: url.searchParams.get("checkout") || undefined,
    sort: url.searchParams.get("sort") || "newest",
  };
  const errors = [];

  if (filters.location && filters.location.length > 100)
    errors.push("location must be ≤ 100 characters");

  if (
    filters.guests &&
    (!Number.isInteger(filters.guests) ||
      filters.guests < 1 ||
      filters.guests > 20)
  )
    errors.push("guests must be an integer between 1 and 20");

  const bothDates = filters.checkin && filters.checkout;
  if (bothDates) {
    if (!isIsoDate(filters.checkin) || !isIsoDate(filters.checkout))
      errors.push("dates must be yyyy-mm-dd");
    else if (filters.checkin > filters.checkout)
      errors.push("checkout must be after checkin");
  } else if (filters.checkin || filters.checkout) {
    errors.push("both checkin and checkout must be provided together");
  }
  if (filters.sort) {
    const validSorts = [
      "popular",
      "price-low",
      "price-high",
      "rating",
      "newest",
    ];
    if (!validSorts.includes(filters.sort)) {
      errors.push(`sort must be one of: ${validSorts.join(", ")}`);
    }
  }
  if (errors.length) {
    return sendJson(res, 400, { errors });
  }

  const campsites = await getCampsites(filters);
  sendJson(res, 200, campsites);
}
function isIsoDate(str) {
  // yyyy-mm-dd
  return /^\d{4}-\d{2}-\d{2}$/.test(str);
}


export async function handleDeleteCampsite(req, res) {
  const id = req.params?.id || req.url.split("/").pop();

  try {
    const deleted = await deleteCampsiteById(id);

    if (!deleted) {
      return sendJson(res, 404, { error: "Campsite not found" });
    }

    return sendJson(res, 200, {
      success: true,
      message: "Campsite deleted successfully",
    });
  } catch (err) {
    console.error("Delete campsite error:", err);
    return sendJson(res, 500, { error: "Internal server error" });
  }
}
