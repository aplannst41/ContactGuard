// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'database.json');

app.use(cors());
app.use(express.json());

// Initialize Database structure for JSON fallback
const INITIAL_DATABASE = {
  tags: [
    { phone: '+628123456789', name: 'Budi Kuliah', uploader: 'Andi', date: '2026-05-10' },
    { phone: '+628123456789', name: 'Budi Kerja', uploader: 'Siti', date: '2026-05-12' },
    { phone: '+628123456789', name: 'Budi Antigravity', uploader: 'Developer', date: '2026-06-01' },
    { phone: '+628123456789', name: 'Budi (Gamer)', uploader: 'Rian', date: '2026-06-10' },
    
    { phone: '+628987654321', name: 'Agus Katering', uploader: 'Ibu Ani', date: '2026-04-18' },
    { phone: '+628987654321', name: 'Agus COD Toko', uploader: 'Kurir', date: '2026-05-22' },
    { phone: '+628987654321', name: 'Pak Agus RT', uploader: 'Bambang', date: '2026-06-05' },
    
    { phone: '+628111222333', name: 'Santi Laundry', uploader: 'Rina', date: '2026-03-15' },
    { phone: '+628111222333', name: 'Santi (Teman SMA)', uploader: 'Dewi', date: '2026-05-19' }
  ],
  spamReports: [
    { phone: '+628987654321', reason: 'Spam Penawaran Kartu Kredit', reporter: 'Andi', date: '2026-06-01' }
  ],
  viewsLog: []
};

// Database state in memory for JSON fallback
let db = { ...INITIAL_DATABASE };

// Connection pool for PostgreSQL
let pool = null;
let usePostgreSQL = false;

// Check if DATABASE_URL is set in environment
if (process.env.DATABASE_URL) {
  try {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      // Required for secure connections to hosting services like Supabase/Neon/Render
      ssl: {
        rejectUnauthorized: false
      }
    });
    usePostgreSQL = true;
    console.log('Database Mode: Cloud PostgreSQL (Supabase/Neon)');
  } catch (err) {
    console.error('Failed to configure PostgreSQL pool, falling back to JSON file:', err);
    usePostgreSQL = false;
  }
} else {
  console.log('Database Mode: Local JSON File (database.json fallback)');
}

// ----------------- DATABASE DRIVERS -----------------

// JSON: Load DB from file
function loadJSONDB() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf8');
      db = JSON.parse(data);
      console.log('Fallback: Database JSON loaded successfully.');
    } else {
      saveJSONDB();
      console.log('Fallback: Database JSON file created with initial seeds.');
    }
  } catch (err) {
    console.error('Error loading fallback JSON database:', err);
  }
}

// JSON: Save DB to file asynchronously
let isSaving = false;
let saveQueue = false;
function saveJSONDB() {
  if (isSaving) {
    saveQueue = true;
    return;
  }
  isSaving = true;
  fs.writeFile(DB_FILE, JSON.stringify(db, null, 2), 'utf8', (err) => {
    isSaving = false;
    if (err) {
      console.error('Error saving database to file:', err);
    }
    if (saveQueue) {
      saveQueue = false;
      saveJSONDB();
    }
  });
}

// PostgreSQL: Automatic table migrations
async function runPostgreSQLMigrations() {
  if (!usePostgreSQL || !pool) return;

  const client = await pool.connect();
  try {
    console.log('Verifying PostgreSQL tables...');
    
    // 1. Tags Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS tags (
        id SERIAL PRIMARY KEY,
        phone VARCHAR(30) NOT NULL,
        name VARCHAR(255) NOT NULL,
        uploader VARCHAR(255) DEFAULT 'Anonim',
        date VARCHAR(15) NOT NULL
      );
    `);

    // 2. Spam Reports Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS spam_reports (
        id SERIAL PRIMARY KEY,
        phone VARCHAR(30) NOT NULL,
        reason TEXT NOT NULL,
        reporter VARCHAR(255) DEFAULT 'Anonim',
        date VARCHAR(15) NOT NULL
      );
    `);

    // 3. Views / Visitor Log Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS views_log (
        id SERIAL PRIMARY KEY,
        target_phone VARCHAR(30) NOT NULL,
        viewer_name VARCHAR(255) DEFAULT 'Anonim',
        date VARCHAR(15) NOT NULL
      );
    `);

    // Seed database if empty
    const checkTags = await client.query('SELECT COUNT(*) FROM tags');
    if (parseInt(checkTags.rows[0].count) === 0) {
      console.log('Seeding initial data to PostgreSQL...');
      for (const tag of INITIAL_DATABASE.tags) {
        await client.query(
          'INSERT INTO tags (phone, name, uploader, date) VALUES ($1, $2, $3, $4)',
          [tag.phone, tag.name, tag.uploader, tag.date]
        );
      }
      for (const spam of INITIAL_DATABASE.spamReports) {
        await client.query(
          'INSERT INTO spam_reports (phone, reason, reporter, date) VALUES ($1, $2, $3, $4)',
          [spam.phone, spam.reason, spam.reporter, spam.date]
        );
      }
      console.log('PostgreSQL seeded successfully.');
    } else {
      console.log('PostgreSQL database contains records. Seeding skipped.');
    }
  } catch (err) {
    console.error('Error running PostgreSQL migrations:', err);
  } finally {
    client.release();
  }
}

// ----------------- HELPERS -----------------

// Normalize phone numbers format
function normalizePhone(phone) {
  if (!phone) return '';
  let normalized = phone.replace(/[\s-]/g, '');
  if (normalized.startsWith('0')) {
    normalized = '+62' + normalized.slice(1);
  } else if (!normalized.startsWith('+') && /^\d+$/.test(normalized)) {
    normalized = '+' + normalized;
  }
  return normalized;
}

// Trust Score calculation logic
function calculateTrustScore(tagsCount, spamCount) {
  if (spamCount > 0) {
    const deduction = Math.min(spamCount * 35, 90);
    return 100 - deduction;
  }
  if (tagsCount > 0) {
    return Math.min(85 + (tagsCount * 3), 99);
  }
  return 75; // Default unknown number
}

// ----------------- API ROUTES -----------------

// 1. Search Phone Number Details
app.get('/api/search', async (req, res) => {
  const rawPhone = req.query.phone;
  if (!rawPhone) {
    return res.status(400).json({ error: 'Parameter phone dibutuhkan' });
  }

  const phone = normalizePhone(rawPhone);
  const today = new Date().toISOString().split('T')[0];
  const mockNames = ['Joni', 'Rara', 'Budi', 'Siti', 'Manager HRD', 'Kurir Shopee', 'Teman SMP', 'Sales Credit Card'];
  const randomViewer = mockNames[Math.floor(Math.random() * mockNames.length)];

  try {
    let phoneTags = [];
    let phoneSpam = [];

    if (usePostgreSQL && pool) {
      // Fetch tags
      const tagsResult = await pool.query('SELECT name, uploader, date FROM tags WHERE phone = $1', [phone]);
      phoneTags = tagsResult.rows;

      // Fetch spam reports
      const spamResult = await pool.query('SELECT reason, reporter, date FROM spam_reports WHERE phone = $1', [phone]);
      phoneSpam = spamResult.rows;

      // Log view event
      await pool.query(
        'INSERT INTO views_log (target_phone, viewer_name, date) VALUES ($1, $2, $3)',
        [phone, randomViewer, today]
      );
    } else {
      // JSON Fallback
      phoneTags = db.tags.filter(t => t.phone === phone);
      phoneSpam = db.spamReports.filter(s => s.phone === phone);

      db.viewsLog.push({
        targetPhone: phone,
        viewerName: randomViewer,
        date: today
      });
      saveJSONDB();
    }

    const trustScore = calculateTrustScore(phoneTags.length, phoneSpam.length);

    res.json({
      phone,
      tags: phoneTags,
      spamReports: phoneSpam,
      trustScore
    });
  } catch (err) {
    console.error('Error handling /api/search:', err);
    res.status(500).json({ error: 'Terjadi kesalahan pada internal server' });
  }
});

// 2. Sync Phone Book / Upload Contacts
app.post('/api/sync', async (req, res) => {
  const { contacts, uploaderName } = req.body;
  if (!contacts || !Array.isArray(contacts)) {
    return res.status(400).json({ error: 'Data contacts tidak valid' });
  }

  const today = new Date().toISOString().split('T')[0];
  const uploader = uploaderName || 'Pengguna Publik';
  let addedCount = 0;

  try {
    if (usePostgreSQL && pool) {
      // PostgreSQL Bulk Sync
      for (const contact of contacts) {
        if (!contact.phoneNumbers || contact.phoneNumbers.length === 0) continue;
        const name = contact.name;
        if (!name) continue;

        for (const pObj of contact.phoneNumbers) {
          if (!pObj.number) continue;
          const phone = normalizePhone(pObj.number);

          // Check duplicate
          const checkDup = await pool.query(
            'SELECT id FROM tags WHERE phone = $1 AND LOWER(name) = LOWER($2)',
            [phone, name]
          );

          if (checkDup.rowCount === 0) {
            await pool.query(
              'INSERT INTO tags (phone, name, uploader, date) VALUES ($1, $2, $3, $4)',
              [phone, name, uploader, today]
            );
            addedCount++;
          }
        }
      }
    } else {
      // JSON Fallback Sync
      contacts.forEach(contact => {
        if (!contact.phoneNumbers || contact.phoneNumbers.length === 0) return;
        const name = contact.name;
        if (!name) return;

        contact.phoneNumbers.forEach(pObj => {
          if (!pObj.number) return;
          const phone = normalizePhone(pObj.number);

          const exists = db.tags.some(
            t => t.phone === phone && t.name.toLowerCase() === name.toLowerCase()
          );

          if (!exists) {
            db.tags.push({
              phone,
              name,
              uploader,
              date: today
            });
            addedCount++;
          }
        });
      });

      if (addedCount > 0) {
        saveJSONDB();
      }
    }

    res.json({
      success: true,
      message: `Sinkronisasi berhasil. Ditambahkan ${addedCount} tag baru ke database global.`,
      addedCount
    });
  } catch (err) {
    console.error('Error handling /api/sync:', err);
    res.status(500).json({ error: 'Terjadi kesalahan saat memproses data' });
  }
});

// 3. Add Tag manually
app.post('/api/tags', async (req, res) => {
  const { phone, name, uploader } = req.body;
  if (!phone || !name) {
    return res.status(400).json({ error: 'Parameter phone dan name dibutuhkan' });
  }

  const normalized = normalizePhone(phone);
  const cleanName = name.trim();
  const today = new Date().toISOString().split('T')[0];
  const uploaderName = uploader || 'Anonim';

  try {
    if (usePostgreSQL && pool) {
      // Check duplicate in PG
      const checkDup = await pool.query(
        'SELECT id FROM tags WHERE phone = $1 AND LOWER(name) = LOWER($2)',
        [normalized, cleanName]
      );

      if (checkDup.rowCount > 0) {
        return res.status(400).json({ error: 'Tag dengan nama ini sudah ada untuk nomor tersebut' });
      }

      await pool.query(
        'INSERT INTO tags (phone, name, uploader, date) VALUES ($1, $2, $3, $4)',
        [normalized, cleanName, uploaderName, today]
      );
    } else {
      // Check duplicate in JSON
      const exists = db.tags.some(
        t => t.phone === normalized && t.name.toLowerCase() === cleanName.toLowerCase()
      );

      if (exists) {
        return res.status(400).json({ error: 'Tag dengan nama ini sudah ada untuk nomor tersebut' });
      }

      db.tags.push({
        phone: normalized,
        name: cleanName,
        uploader: uploaderName,
        date: today
      });
      saveJSONDB();
    }

    res.json({
      success: true,
      tag: {
        phone: normalized,
        name: cleanName,
        uploader: uploaderName,
        date: today
      }
    });
  } catch (err) {
    console.error('Error handling /api/tags:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// 4. View Visitor / Search Log for a Number (Tag Saya feature)
app.get('/api/my-tags', async (req, res) => {
  const rawPhone = req.query.phone;
  if (!rawPhone) {
    return res.status(400).json({ error: 'Parameter phone dibutuhkan' });
  }

  const phone = normalizePhone(rawPhone);

  try {
    let myTags = [];
    let visitors = [];

    if (usePostgreSQL && pool) {
      // Get my tags
      const tagsResult = await pool.query('SELECT name, uploader, date FROM tags WHERE phone = $1', [phone]);
      myTags = tagsResult.rows;

      // Get profile visitors
      const visitorsResult = await pool.query(
        'SELECT viewer_name as "viewerName", date FROM views_log WHERE target_phone = $1 ORDER BY id DESC LIMIT 10',
        [phone]
      );
      visitors = visitorsResult.rows;
    } else {
      // Fallback
      myTags = db.tags.filter(t => t.phone === phone);
      visitors = db.viewsLog
        .filter(v => v.targetPhone === phone)
        .map(v => ({ viewerName: v.viewerName, date: v.date }));
    }

    res.json({
      phone,
      tags: myTags,
      visitors
    });
  } catch (err) {
    console.error('Error handling /api/my-tags:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// 5. Report Spam
app.post('/api/spam-reports', async (req, res) => {
  const { phone, reason, reporter } = req.body;
  if (!phone || !reason) {
    return res.status(400).json({ error: 'Parameter phone dan reason dibutuhkan' });
  }

  const normalized = normalizePhone(phone);
  const cleanReason = reason.trim();
  const today = new Date().toISOString().split('T')[0];
  const reporterName = reporter || 'Anonim';

  try {
    if (usePostgreSQL && pool) {
      await pool.query(
        'INSERT INTO spam_reports (phone, reason, reporter, date) VALUES ($1, $2, $3, $4)',
        [normalized, cleanReason, reporterName, today]
      );
    } else {
      db.spamReports.push({
        phone: normalized,
        reason: cleanReason,
        reporter: reporterName,
        date: today
      });
      saveJSONDB();
    }

    res.json({
      success: true,
      report: {
        phone: normalized,
        reason: cleanReason,
        reporter: reporterName,
        date: today
      }
    });
  } catch (err) {
    console.error('Error handling /api/spam-reports:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// ----------------- START SERVER -----------------

// Bootstrapping database depending on mode
if (usePostgreSQL) {
  runPostgreSQLMigrations();
} else {
  loadJSONDB();
}

app.listen(PORT, () => {
  console.log(`ContactGuard API Server is running on port ${PORT}`);
});
