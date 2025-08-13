const mongoose = require('mongoose')

async function hasMigration(db, key) {
  const col = db.collection('migrations')
  const found = await col.findOne({ _id: key })
  return !!found
}

async function markMigration(db, key) {
  const col = db.collection('migrations')
  await col.updateOne({ _id: key }, { $set: { appliedAt: new Date() } }, { upsert: true })
}

async function runOnce(db, key, fn) {
  if (await hasMigration(db, key)) return { skipped: true }
  await fn()
  await markMigration(db, key)
  return { applied: true }
}

module.exports = { runOnce }
