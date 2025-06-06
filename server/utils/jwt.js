import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import cookie from 'cookie';

dotenv.config();

export function generateJWT(user) {
  return jwt.sign({
    id: user.id,
    email: user.email,
    name: user.username,
    role: user.role ,
    oauth: !!user.oauth_provider
  }, process.env.JWT_SECRET, {
    expiresIn: '1h'
  });
}

export function verifyJWT(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

export function getJWT(req){
  const cookies = cookie.parse(req.headers.cookie || '');
  const token = cookies.token;
  return token;
}
