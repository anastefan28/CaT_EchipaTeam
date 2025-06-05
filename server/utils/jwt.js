import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

export function generateJWT(user) {
  return jwt.sign(
    {
      sub: user.sub,
      name: user.name,
      email: user.email,
    },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
}

export function verifyJWT(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}
