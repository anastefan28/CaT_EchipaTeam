import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

export function generateJWT(user) {
  return jwt.sign({
    sub: user.oauth_sub || user.id,
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
