const crypto = require('crypto')
const User = require('../models/User')
const HandleReservation = require('../models/HandleReservation')

const RESERVED = new Set(['admin','administrator','root','support','about','help','tag','tags','p','u','me','api','auth','static','assets'])

function normalizeHandle(raw) {
  const s = String(raw || '').toLowerCase().trim()
  const cleaned = s.replace(/[^a-z0-9_.-]/g, '')
  return cleaned.slice(0, 30)
}

async function isTaken(handle) {
  const h = String(handle || '').toLowerCase().trim()
  if (!h) return true
  if (RESERVED.has(h)) return true
  const exists = await User.exists({ handle: h })
  if (exists) return true
  const reserved = await HandleReservation.exists({ handle: h })
  return !!reserved
}

async function proposeAndReserve(user, { seeds = [], days = 30 } = {}) {
  const ttlDays = Number(process.env.HANDLE_RESERVE_DAYS || days)
  const baseSeeds = seeds
    .map(normalizeHandle)
    .filter(Boolean)

  const emailLocal = (user.email || '').split('@')[0]
  baseSeeds.push(normalizeHandle(emailLocal))
  if (user.displayName) baseSeeds.push(normalizeHandle(user.displayName))
  const pool = baseSeeds.filter(Boolean).length ? baseSeeds : ['user']

  for (const seed of pool) {
    if (!seed || RESERVED.has(seed) || seed.length < 3) continue
    let candidate = seed
    for (let i = 0; i < 50; i++) {
      if (i > 0) {
        const suffix = i === 1 ? crypto.randomInt(100, 999).toString() : `${i}`
        candidate = normalizeHandle(`${seed}${suffix}`)
      }
      if (candidate.length < 3) continue
      const existingByUser = await HandleReservation.findOne({ handle: candidate, userId: user._id })
      if (existingByUser) {
        existingByUser.expiresAt = new Date(Date.now() + ttlDays * 86400 * 1000)
        await existingByUser.save()
        return candidate
      }
      if (!(await isTaken(candidate))) {
        await HandleReservation.create({
          handle: candidate,
          userId: user._id,
          expiresAt: new Date(Date.now() + ttlDays * 86400 * 1000),
        })
        return candidate
      }
    }
  }
  const fallback = `user${crypto.randomInt(1000, 9999).toString()}`
  const candidate = normalizeHandle(fallback)
  await HandleReservation.create({
    handle: candidate,
    userId: user._id,
    expiresAt: new Date(Date.now() + (Number(process.env.HANDLE_RESERVE_DAYS || 30)) * 86400 * 1000),
  })
  return candidate
}

module.exports = { normalizeHandle, proposeAndReserve, isTaken, RESERVED }
