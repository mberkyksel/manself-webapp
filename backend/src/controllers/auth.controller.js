import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
import { env } from '../config/env.js';
import { resetDemoAccount, isDemoUser } from '../services/demo.service.js';

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
    // Lets the UI explain why the shared demo account can't change its
    // credentials instead of just failing on submit.
    isDemo: env.demoMode && isDemoUser(user),
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

// The demo account is shared and gets reset on every demo login, so letting
// a visitor change its credentials or delete it would just break the demo
// for the next one.
function rejectIfDemoAccount(user, res) {
  if (env.demoMode && isDemoUser(user)) {
    res.status(403).json({ error: { message: 'This is not available in the demo account.' } });
    return true;
  }
  return false;
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

export async function demoLogin(req, res, next) {
  try {
    if (!env.demoMode) {
      return res.status(404).json({ error: { message: 'Demo mode is not enabled' } });
    }

    const user = await resetDemoAccount();
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
    if (user && rejectIfDemoAccount(user, res)) return;
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

// Name is display-only (not a credential), so no password confirmation here -
// see updateEmail/deleteAccount below for the fields that do require one.
export async function updateProfile(req, res, next) {
  try {
    const { name, location } = req.body;
    const updates = {};

    if (name !== undefined) {
      const trimmedName = typeof name === 'string' ? name.trim() : '';
      if (!trimmedName) {
        return res.status(400).json({ error: { message: 'name is required' } });
      }
      updates.name = trimmedName;
    }

    // The place used for weather when the browser won't share its location;
    // an empty value clears it.
    if (location !== undefined) {
      const trimmedLocation = typeof location === 'string' ? location.trim() : null;
      if (trimmedLocation === null || trimmedLocation.length > 100) {
        return res.status(400).json({ error: { message: 'location must be text of at most 100 characters' } });
      }
      updates.location = trimmedLocation || null;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: { message: 'name or location is required' } });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ error: { message: 'User not found' } });
    }

    Object.assign(user, updates);
    await user.save();

    res.json({ user: toPublicUser(user) });
  } catch (err) {
    if (err.name === 'SequelizeValidationError') {
      return res.status(400).json({ error: { message: err.errors?.[0]?.message || 'Invalid input' } });
    }
    next(err);
  }
}

// Email doubles as the login identifier, so changing it requires the current
// password - same reasoning as updatePassword (and same 403, not 401, to
// avoid tripping the frontend's "401 = expired session" interceptor).
export async function updateEmail(req, res, next) {
  try {
    const { newEmail, currentPassword } = req.body;

    if (!newEmail || !currentPassword) {
      return res.status(400).json({ error: { message: 'newEmail and currentPassword are required' } });
    }

    const user = await User.findByPk(req.user.id);
    if (user && rejectIfDemoAccount(user, res)) return;
    if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
      return res.status(403).json({ error: { message: 'Current password is incorrect' } });
    }

    const existing = await User.findOne({ where: { email: newEmail } });
    if (existing && existing.id !== user.id) {
      return res.status(409).json({ error: { message: 'Email is already registered' } });
    }

    user.email = newEmail;
    await user.save();

    // Re-issue the token so its embedded email claim matches the new value
    // instead of going stale until the old token expires.
    res.json({ token: signToken(user), user: toPublicUser(user) });
  } catch (err) {
    if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: { message: err.errors?.[0]?.message || 'Invalid input' } });
    }
    next(err);
  }
}

// Irreversible, so it requires the current password like updateEmail. Owned
// rows (boards, tasks, calendar events, notes) all have ON DELETE CASCADE
// foreign keys to users (see the migrations), so destroying the user is
// enough - no manual cleanup needed.
export async function deleteAccount(req, res, next) {
  try {
    const { currentPassword } = req.body;

    if (!currentPassword) {
      return res.status(400).json({ error: { message: 'currentPassword is required' } });
    }

    const user = await User.findByPk(req.user.id);
    if (user && rejectIfDemoAccount(user, res)) return;
    if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
      return res.status(403).json({ error: { message: 'Current password is incorrect' } });
    }

    await user.destroy();

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
