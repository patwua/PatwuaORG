const express = require('express')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const User = require('../models/User')

const router = express.Router()
const SALT_ROUNDS = 10

router.post('/register', async (req, res) => {
  try {
    const { email, name, password } = req.body || {}
    if (!email || !name || !password) return res.status(400).json({ error: 'email, name, password required' })
    const exists = await User.findOne({ email })
    if (exists) return res.status(409).json({ error: 'Email already in use' })
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)
    const user = await User.create({ email, name, passwordHash })
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
    const payload = { id: user._id.toString(), email: user.email, name: user.name, role: user.role }
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' })
    res.json({ token, user: payload })
  } catch {
    res.status(500).json({ error: 'Login failed' })
  }
})

router.get('/me', (req, res) => {
  // handy for debugging — pair with authRequired if you want protection here
  res.json({ ok: true })
})

module.exports = router

