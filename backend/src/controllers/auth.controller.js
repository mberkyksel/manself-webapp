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

export async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;

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
    const user = await User.create({ name, email, passwordHash });

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
