const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Access tokens are short-lived JWTs, verified on every protected request.
const generateAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  });
};

const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

// Refresh tokens are opaque random values (not JWTs) so they carry no
// decodable information on their own; the server is the only place
// that can map one back to a user, via its hash in the database.
const generateRefreshTokenValue = () => crypto.randomBytes(40).toString('hex');

const hashRefreshToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

// Generates a 6-digit numeric one-time code, e.g. for email verification
// or password reset. Zero-padded so it's always exactly 6 digits.
const generateOTP = () => crypto.randomInt(0, 1000000).toString().padStart(6, '0');

// Hashes an OTP together with the userId it belongs to, so the same raw
// code issued to two different users at the same moment never produces
// the same stored hash — this lets us safely look tokens up scoped to
// (userId, code) without needing a global-uniqueness guarantee on the
// 6-digit code itself.
const hashOTP = (otp, userId) => crypto.createHash('sha256').update(`${otp}:${userId}`).digest('hex');

const getRefreshExpiryDate = () => {
  const days = Number(process.env.JWT_REFRESH_EXPIRES_DAYS) || 30;
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
};

module.exports = {
  generateAccessToken,
  verifyToken,
  generateRefreshTokenValue,
  hashRefreshToken,
  getRefreshExpiryDate,
  generateOTP,
  hashOTP,
};