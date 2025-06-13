import { parse } from 'url';
import { handlePostBooking } from '../controllers/bookingController.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { protectRoute } from '../middlewares/protect.js';
import { sendJson } from '../utils/json.js';

export async function bookingRoute(req,res){
  const { pathname } = parse(req.url,true);
  if (req.method==='POST' && pathname==='/api/bookings')
    return asyncHandler(protectRoute(handlePostBooking))(req,res);

  sendJson(res,405,{error:'Method Not Allowed'});
}