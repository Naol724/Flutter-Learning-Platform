const crypto = require('crypto');

/**
 * Generate a secure 6-digit OTP using crypto.randomInt
 * @returns {string} 6-digit numeric code
 */
const generateSecureOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

/**
 * Generate OTP with 10-minute expiration
 * @returns {object} OTP and expiration time
 */
const generateOTPWith10MinExpiration = () => {
  const otp = generateSecureOTP();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  return {
    otp,
    expiresAt,
    expiresIn: '10 minutes'
  };
};

/**
 * Validate if a string is a valid 6-digit OTP
 * @param {string} otp - OTP to validate
 * @returns {boolean} True if valid 6-digit OTP
 */
const validateOTP = (otp) => {
  return /^\d{6}$/.test(otp);
};

/**
 * Check if OTP has expired
 * @param {Date} expiryDate - OTP expiration date
 * @returns {boolean} True if expired
 */
const isOTPExpired = (expiryDate) => {
  return new Date() > new Date(expiryDate);
};

module.exports = {
  generateSecureOTP,
  generateOTPWith10MinExpiration,
  validateOTP,
  isOTPExpired
};
