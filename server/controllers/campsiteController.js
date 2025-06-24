
import { getCampsites, deleteCampsiteById, updateCampsiteById,
   createCampsite, findCampsiteById } from '../models/campsiteModel.js';
import { AppError } from '../utils/appError.js';
import { sendJson} from '../utils/json.js';
import {isValidId } from '../utils/valid.js';

export async function handleGetCampsites(req, res) {
  const campsites = await getCampsites(req.query);
  sendJson(res, 200, campsites);
}

export async function handleDeleteCampsite(req, res) {
  const id = req.params?.id || req.url.split("/").pop();
  if (!isValidId(id)) {
    throw new AppError("Invalid campsite id", 400);
  }
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

export async function handleGetCampsite(req, res) {
  const parts = req.url.split('/');
  const id = parts[3];
  if (!isValidId(id)) {
    throw new AppError('Invalid campsite id', 400);
  }
  try {
    const campsites = await getCampsites({ id });
    if (!campsites || campsites.length === 0) {
      throw new AppError('Campsite not found', 404);
    }
    sendJson(res, 200, campsites[0]);
  } catch (err) {
    console.error('Error fetching campsite:', err);
    throw new AppError('Internal Server Error', 500);
  }
}

export async function handleUpdateCampsite(req, res) {
  const id = req.params?.id || req.url.split("/").pop();
  if(!isValidId(id)) {
    throw new AppError("Invalid campsite id", 400);
  }
  try {
    const { name, description, lat, lon, capacity, price, county, type } =req.body;
    const existing = await findCampsiteById(id);
    if (!existing) {
      return sendJson(res, 404, { error: "Campsite not found." });
    }
    await updateCampsiteById(id, {
      name,
      description,
      lat,
      lon,
      capacity,
      price,
      county,
      type,
    });

    return sendJson(res, 200, {
      success: true,
      message: "Campsite updated successfully.",
    });
  } catch (err) {
    console.error("Update campsite error:", err);
    return sendJson(res, 500, { error: "Internal server error." });
  }
}

export async function handleCreateCampsite(req, res) {
  try {
    const { name, description, lat, lon, capacity, price, county, type } = req.body;
    const campsite = await createCampsite({
      name,
      description,
      lat,
      lon,
      capacity,
      price,
      county,
      type,
    });

    return sendJson(res, 201, campsite);
  } catch (err) {
    console.error("Create campsite error:", err);
    return sendJson(res, 500, { error: "Failed to create campsite." });
  }
}


