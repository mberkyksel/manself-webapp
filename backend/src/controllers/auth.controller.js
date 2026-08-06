import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
import { env } from '../config/env.js';

const SALT_ROUNDS = 10;

function signToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
}

function toPublicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    timezone: user.timezone,
    location: user.location,
  };
}

// Basic sanity check on a client-supplied IANA timezone name before trusting
// it, so a malformed value falls back to the model's default instead of
// getting stored as-is.
function isValidTimezone(timezone) {
  if (!timezone) return false;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

export async function register(req, res, next) {
  try {
    const { name, email, password, timezone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: { message: 'name, email, and password are required' } });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: { message: 'password must be at least 8 characters' } });
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: { message: 'Email is already registered' } });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await User.create({
      name,
      email,
      passwordHash,
      // Captures the browser's real IANA timezone at signup so the clock
      // widget shows local time instead of always falling back to the
      // column's UTC default.
      ...(isValidTimezone(timezone) && { timezone }),
    });

    res.status(201).json({ token: signToken(user), user: toPublicUser(user) });
  } catch (err) {
    if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: { message: err.errors?.[0]?.message || 'Invalid input' } });
    }
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: { message: 'email and password are required' } });
    }

    const user = await User.findOne({ where: { email } });
    // Same generic message whether the email doesn't exist or the password is
    // wrong, so login can't be used to enumerate registered accounts.
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: { message: 'Invalid email or password' } });
    }

    res.json({ token: signToken(user), user: toPublicUser(user) });
  } catch (err) {
    next(err);
  }
}

export async function me(req, res, next) {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ error: { message: 'User not found' } });
    }
    res.json({ user: toPublicUser(user) });
  } catch (err) {
    next(err);
  }
}

export async function updatePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: { message: 'currentPassword and newPassword are required' } });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: { message: 'newPassword must be at least 8 characters' } });
    }

    const user = await User.findByPk(req.user.id);
    // 403, not 401: the request is properly authenticated (requireAuth already
    // passed), it's just the *current password* that's wrong. The frontend's
    // response interceptor wipes the stored token on any 401, treating it as
    // an expired session - using 401 here would silently log the user out on
    // a simple typo.
    if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
      return res.status(403).json({ error: { message: 'Current password is incorrect' } });
    }

    user.passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await user.save();

    res.json({ user: toPublicUser(user) });
  } catch (err) {
    next(err);
  }
}
