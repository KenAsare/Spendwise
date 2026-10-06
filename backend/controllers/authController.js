const bcrypt = require('bcrypt');
const { User, RefreshToken, PasswordResetToken, EmailVerificationToken } = require('../models');
const {
  generateAccessToken,
  generateRefreshTokenValue,
  hashRefreshToken,
  getRefreshExpiryDate,
  generateOTP,
  hashOTP,
} = require('../utils/jwt');
const { sendPasswordResetEmail, sendVerificationEmail } = require('../utils/email');

const SALT_ROUNDS = 10;
const OTP_EXPIRY_MINUTES = 15;

const sanitizeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  currency: user.currency,
  isVerified: user.isVerified,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

// Creates a new access+refresh token pair for a user, storing the
// refresh token's hash in the database so it can be looked up and revoked.
const issueTokens = async (user) => {
  const accessToken = generateAccessToken({ id: user.id });
  const refreshTokenValue = generateRefreshTokenValue();

  await RefreshToken.create({
    userId: user.id,
    tokenHash: hashRefreshToken(refreshTokenValue),
    expiresAt: getRefreshExpiryDate(),
  });

  return { accessToken, refreshToken: refreshTokenValue };
};

// Generates a fresh 6-digit email verification code, stores its hash,
// and sends (or logs, in dev mode) it. Never throws — a failed email
// should never block registration or a resend request from responding.
const issueVerificationEmail = async (user) => {
  try {
    await EmailVerificationToken.destroy({ where: { userId: user.id } });

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await EmailVerificationToken.create({
      userId: user.id,
      tokenHash: hashOTP(otp, user.id),
      expiresAt,
    });

    await sendVerificationEmail(user.email, otp);
  } catch (error) {
    console.error('Failed to send verification email:', error.message);
  }
};

// POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existing = await User.findOne({ where: { email: email.toLowerCase().trim() } });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists',
      });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
    });

    const tokens = await issueTokens(user);

    // Fire-and-forget: don't make the user wait on email delivery.
    issueVerificationEmail(user);

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: { user: sanitizeUser(user), ...tokens },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email: email.toLowerCase().trim() } });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const tokens = await issueTokens(user);

    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      data: { user: sanitizeUser(user), ...tokens },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/refresh
const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token is required',
      });
    }

    const tokenHash = hashRefreshToken(refreshToken);
    const stored = await RefreshToken.findOne({ where: { tokenHash } });

    if (!stored) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token. Please log in again.',
      });
    }

    if (stored.expiresAt < new Date()) {
      await stored.destroy();
      return res.status(401).json({
        success: false,
        message: 'Session expired. Please log in again.',
      });
    }

    const user = await User.findByPk(stored.userId);
    if (!user) {
      await stored.destroy();
      return res.status(401).json({
        success: false,
        message: 'User no longer exists',
      });
    }

    await stored.destroy();
    const tokens = await issueTokens(user);

    res.status(200).json({
      success: true,
      message: 'Token refreshed',
      data: tokens,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/logout
const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      const tokenHash = hashRefreshToken(refreshToken);
      await RefreshToken.destroy({ where: { tokenHash } });
    }
  } catch (error) {
    // Even if revocation fails, still report success — the token
    // will simply expire naturally.
  }

  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
};

// POST /api/auth/forgot-password
// Always responds with the same generic message whether or not the email
// exists, so this endpoint can't be used to discover registered emails.
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    const genericMessage = {
      success: true,
      message: 'If an account with that email exists, a reset code has been sent.',
    };

    const user = await User.findOne({ where: { email: email.toLowerCase().trim() } });
    if (!user) {
      return res.status(200).json(genericMessage);
    }

    await PasswordResetToken.destroy({ where: { userId: user.id } });

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await PasswordResetToken.create({
      userId: user.id,
      tokenHash: hashOTP(otp, user.id),
      expiresAt,
    });

    await sendPasswordResetEmail(user.email, otp);

    res.status(200).json(genericMessage);
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/reset-password
// Takes the email (to identify the account — the user isn't logged in
// during this flow), the OTP code, and the new password, all at once.
const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, password } = req.body;

    if (!email || !otp || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email, code, and new password are all required',
      });
    }
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters',
      });
    }

    const user = await User.findOne({ where: { email: email.toLowerCase().trim() } });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired code. Please request a new one.',
      });
    }

    const tokenHash = hashOTP(otp, user.id);
    const stored = await PasswordResetToken.findOne({ where: { userId: user.id, tokenHash } });

    if (!stored || stored.expiresAt < new Date()) {
      if (stored) await stored.destroy();
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired code. Please request a new one.',
      });
    }

    user.password = await bcrypt.hash(password, SALT_ROUNDS);
    await user.save();
    await stored.destroy();

    // Revoke every existing session — forces out anyone who may have had
    // a stolen refresh token, the moment the real owner resets their password.
    await RefreshToken.destroy({ where: { userId: user.id } });

    res.status(200).json({
      success: true,
      message: 'Password reset successfully. Please log in with your new password.',
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/verify-email
// The user must already be logged in (register/login happens before this),
// so we know exactly which account to check the code against.
const verifyEmail = async (req, res, next) => {
  try {
    const { otp } = req.body;
    const userId = req.user.id;

    if (!otp) {
      return res.status(400).json({
        success: false,
        message: 'Verification code is required',
      });
    }

    const tokenHash = hashOTP(otp, userId);
    const stored = await EmailVerificationToken.findOne({ where: { userId, tokenHash } });

    if (!stored || stored.expiresAt < new Date()) {
      if (stored) await stored.destroy();
      return res.status(400).json({
        success: false,
        message: 'That code is invalid or has expired. Please request a new one.',
      });
    }

    const user = await User.findByPk(userId);
    user.isVerified = true;
    await user.save();
    await stored.destroy();

    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      data: { user: sanitizeUser(user) },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/resend-verification
const resendVerification = async (req, res, next) => {
  try {
    const fullUser = await User.findByPk(req.user.id);
    if (fullUser.isVerified) {
      return res.status(200).json({
        success: true,
        message: 'Your email is already verified.',
      });
    }

    await issueVerificationEmail(fullUser);

    res.status(200).json({
      success: true,
      message: 'Verification code sent. Please check your inbox.',
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Current user retrieved',
    data: { user: sanitizeUser(req.user) },
  });
};

// PUT /api/auth/profile
const updateProfile = async (req, res, next) => {
  try {
    const { name, email } = req.body;
    const user = req.user;

    if (email && email.toLowerCase().trim() !== user.email) {
      const existing = await User.findOne({ where: { email: email.toLowerCase().trim() } });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'Email is already in use',
        });
      }
      user.email = email.toLowerCase().trim();
    }

    if (name) user.name = name.trim();

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: sanitizeUser(user) },
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/auth/password
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = req.user;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current and new password are required',
      });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters',
      });
    }

    const fullUser = await User.findByPk(user.id);
    const isMatch = await bcrypt.compare(currentPassword, fullUser.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    fullUser.password = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await fullUser.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/auth/settings
const updateSettings = async (req, res, next) => {
  try {
    const { currency } = req.body;
    const user = req.user;

    if (currency) user.currency = currency;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Settings updated successfully',
      data: { user: sanitizeUser(user) },
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/auth/account
// Requires the current password as confirmation, since this is
// irreversible — deletes the user and (via FK cascade) every one of
// their income, expense, budget, and token records.
const deleteAccount = async (req, res, next) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Please enter your password to confirm account deletion',
      });
    }

    const fullUser = await User.findByPk(req.user.id);
    const isMatch = await bcrypt.compare(password, fullUser.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Incorrect password',
      });
    }

    await fullUser.destroy();

    res.status(200).json({
      success: true,
      message: 'Your account and all associated data have been deleted',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
  getMe,
  updateProfile,
  changePassword,
  updateSettings,
  deleteAccount,
};