#!/usr/bin/env node
const mongoose = require('mongoose');
const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');

const Persona = mongoose.model('Persona', new mongoose.Schema({
  name: String,
  ownerUserId: mongoose.Schema.Types.ObjectId,
  isDefault: Boolean,
}), 'personas');

const Redirect = mongoose.model('PersonaRedirect', new mongoose.Schema({
  legacy: { type: String, index: true },
  handle: String,
}), 'PersonaRedirects');

async function run(commit) {
  const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI;
  const dbName = process.env.MONGODB_DB || 'patwua';
  await mongoose.connect(mongoURI, { dbName });

  const users = await User.find().lean();
  let usersUpdated = 0, postsRe = 0, commentsRe = 0, redirects = 0;

  for (const u of users) {
    if (u.handle) continue;
    let base = '';
    const defaultPersona = await Persona.findOne({ ownerUserId: u._id, isDefault: true }).lean().catch(() => null);
    if (defaultPersona) base = defaultPersona.name;
    else if (u.email) base = u.email.split('@')[0];
    base = String(base || 'user').toLowerCase().replace(/[^a-z0-9_.-]/g,'');
    if (base.length < 3) base = base.padEnd(3, '0');
    let handle = base;
    let i = 1;
    while (await User.findOne({ handle })) {
      handle = `${base}-${i++}`;
    }
    if (commit) {
      await User.updateOne({ _id: u._id }, { $set: { handle } });
    }
    usersUpdated++;

    const personas = await Persona.find({ ownerUserId: u._id }).lean();
    for (const p of personas) {
      const legacy = String(p.name).toLowerCase();
      if (commit) {
        await Redirect.updateOne({ legacy }, { $set: { handle } }, { upsert: true });
      }
      redirects++;
      const postRes = await Post.updateMany({ personaId: p._id }, { $set: { authorUserId: u._id }, $unset: { personaId: 1 } });
      const commentRes = await Comment.updateMany({ personaId: p._id }, { $set: { authorUserId: u._id }, $unset: { personaId: 1 } });
      postsRe += postRes.modifiedCount || 0;
      commentsRe += commentRes.modifiedCount || 0;
    }
  }

  console.log(`Users updated: ${usersUpdated}`);
  console.log(`Posts reassigned: ${postsRe}`);
  console.log(`Comments reassigned: ${commentsRe}`);
  console.log(`Redirects created: ${redirects}`);
  await mongoose.disconnect();
}

const commit = process.argv.includes('--commit');
run(commit).then(() => process.exit()).catch(err => {
  console.error(err);
  process.exit(1);
});
