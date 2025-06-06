import { verifyJWT , getJWT} from "../utils/jwt.js";
import { getUserById } from "../models/userModel.js";
export async function handleMe(req, res) {
  try {
    const token = getJWT(req);
    const payload = verifyJWT(token);
    if (!payload) {
      console.error('Invalid token payload');
      res.writeHead(401);
      return res.end(JSON.stringify({ error: 'Invalid token' }));
    }

    const user = await getUserById(payload.id);
    if (!user) {
      res.writeHead(404);
      return res.end(JSON.stringify({ error: 'User not found' }));
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(user));

  } catch (err) {
    console.error('Error in handleMe:', err);
    res.writeHead(500);
    res.end(JSON.stringify({ error: 'Internal Server Error' }));
  }
}
