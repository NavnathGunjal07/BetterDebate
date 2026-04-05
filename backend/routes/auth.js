const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../services/db');
const env = require('../config/env');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const SALT_ROUNDS = 10;

// POST /api/auth/login — register or login
router.post('/login', async (req, res) => {
  try {
    const { name, passkey } = req.body;

    if (!name || !passkey) {
      return res.status(400).json({ error: 'Name and passkey are required' });
    }

    const trimmedName = name.trim();
    if (trimmedName.length < 2 || trimmedName.length > 32) {
      return res.status(400).json({ error: 'Name must be 2–32 characters' });
    }
    if (passkey.length < 4) {
      return res.status(400).json({ error: 'Passkey must be at least 4 characters' });
    }

    const existingUser = await prisma.user.findUnique({ where: { name: trimmedName } });

    if (existingUser) {
      // Login
      const valid = await bcrypt.compare(passkey, existingUser.passkeyHash);
      if (!valid) {
        return res.status(401).json({ error: 'Wrong passkey for this name' });
      }

      const token = jwt.sign(
        { userId: existingUser.id, name: existingUser.name },
        env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      return res.json({ token, name: existingUser.name, userId: existingUser.id });
    } else {
      // Register
      const passkeyHash = await bcrypt.hash(passkey, SALT_ROUNDS);
      const newUser = await prisma.user.create({
        data: { name: trimmedName, passkeyHash },
      });

      const token = jwt.sign(
        { userId: newUser.id, name: newUser.name },
        env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      return res.json({ token, name: newUser.name, userId: newUser.id });
    }
  } catch (err) {
    console.error('Auth error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/auth/verify — check token validity
router.get('/verify', authMiddleware, (req, res) => {
  res.json({ valid: true, name: req.user.name, userId: req.user.userId });
});

module.exports = router;
