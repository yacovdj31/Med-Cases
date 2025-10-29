// server/src/seed.js
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import Box from './models/Box.js';

dotenv.config();

const mongoUrl = process.env.MONGO_URL;
const dbName   = process.env.DB_NAME || 'scavenger';

async function main() {
  if (!mongoUrl) throw new Error('MONGO_URL missing in .env');

  await mongoose.connect(mongoUrl, { dbName });
  console.log('[seed] Connected to Mongo:', dbName);

  // 1) Ensure admin user exists (hashed password)
  const adminEmail   = process.env.ADMIN_EMAIL    || 'a@y';
  const adminPwPlain = process.env.ADMIN_PASSWORD || '1234';
  const adminName    = process.env.ADMIN_NAME     || 'Admin';
  const adminCountry = process.env.ADMIN_COUNTRY  || 'USA'; // arbitrary; not used for filtering

  let admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    const hashed = bcrypt.hashSync(adminPwPlain, 10);
    admin = await User.create({
      email: adminEmail,
      password: hashed,
      role: 'admin',
      name: adminName,
      country: adminCountry,
      lastLoginAt: null,
      welcomeSentAt: null,
    });
    console.log('[seed] Created admin user:', adminEmail);
  } else {
    // if for some reason admin exists without a password (bad seed), fix it
    if (!admin.password) {
      const hashed = bcrypt.hashSync(adminPwPlain, 10);
      await User.updateOne({ _id: admin._id }, { $set: { password: hashed } });
      console.log('[seed] Fixed admin password hash for:', adminEmail);
    } else {
      console.log('[seed] Admin already exists:', adminEmail);
    }
  }

  // 2) Reset boxes and seed one 100%-weight box per country
  console.log('[seed] Deleting ALL existing boxes…');
  await Box.deleteMany({});

  const countries = ['USA', 'Russia', 'Canada'];
  const starter = {
    key: 'A',
    title: 'Starter Box',
    description: 'Initial 100% box',
    weight: 100,
    active: true,
  };

  for (const c of countries) {
    await Box.create({ ...starter, country: c });
    console.log(`[seed] Seeded ${starter.key} (${starter.weight}%) for ${c}`);
  }

  await mongoose.connection.close();
  console.log('[seed] Done ✔');
}

main()
  .then(() => process.exit(0))
  .catch(async (e) => {
    console.error('[seed] Error:', e?.message || e);
    try { await mongoose.connection.close(); } catch {}
    process.exit(1);
  });
