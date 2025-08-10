const express = require('express')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const User = require('../models/User')
const { authRequired } = require('../middleware/auth')

const router = express.Router()
const SALT_ROUNDS = 10

router.post('/register', async (req, res) => {
  try {
    const { email, name, password } = req.body || {}
    if (!email || !name || !password) return res.status(400).json({ error: 'email, name, password required' })
    const exists = await User.findOne({ email })
    if (exists) return res.status(409).json({ error: 'Email already in use' })
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)
    const role = process.env.ADMIN_EMAIL && email === process.env.ADMIN_EMAIL ? 'admin' : 'user'
    const user = await User.create({ email, name, passwordHash, role })
    res.status(201).json({ id: user._id, email: user.email, name: user.name })
  } catch (e) {
    res.status(500).json({ error: 'Registration failed' })
  }
})

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {}
    if (!email || !password) return res.status(400).json({ error: 'email and password required' })
    const user = await User.findOne({ email })
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }
    if (process.env.ADMIN_EMAIL && email === process.env.ADMIN_EMAIL && user.role !== 'admin') {
      user.role = 'admin'
      await user.save()
    }
    const payload = { id: user._id.toString(), email: user.email, name: user.name, role: user.role, slug: user.slug }
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' })
    res.json({ token, user: payload })
  } catch {
    res.status(500).json({ error: 'Login failed' })
  }
})

router.get('/me', authRequired, async (req, res) => {
  // fetch from DB to also return slug
  const u = await User.findById(req.user.id).lean()
  if (!u) return res.status(404).json({ error: 'User not found' })
  res.json({ id: u._id, email: u.email, name: u.name, role: u.role, slug: u.slug })
})

module.exports = router

