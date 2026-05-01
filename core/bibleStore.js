// ============================================
// FILE: core/bibleStore.js
// ============================================

const fs = require("fs");
const path = require("path");

const DB = path.join(__dirname, "../data/bible.json");

// ============================================
// LOAD DATABASE
// ============================================
function load() {
  try {
    if (!fs.existsSync(DB)) {
      fs.mkdirSync(path.dirname(DB), { recursive: true });
      fs.writeFileSync(DB, "{}");
    }

    const raw = fs.readFileSync(DB, "utf8");
    return JSON.parse(raw || "{}");

  } catch (err) {
    console.error("❌ Failed to load bible DB:", err.message);
    return {};
  }
}

// ============================================
// SAVE DATABASE
// ============================================
function save(data) {
  try {
    fs.writeFileSync(DB, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("❌ Failed to save bible DB:", err.message);
  }
}

// ============================================
// DEFAULT THREAD DATA
// ============================================
function defaultData() {
  return {
    enabled: false,
    interval: "hourly", // minute | hourly | 8hours | daily
    lastVerse: null,
    lastSent: 0 // timestamp (IMPORTANT 🔥)
  };
}

// ============================================
// GET THREAD
// ============================================
function getThread(threadID) {
  const db = load();

  if (!db[threadID]) {
    db[threadID] = defaultData();
    save(db);
  }

  return db[threadID];
}

// ============================================
// SET THREAD
// ============================================
function setThread(threadID, data) {
  const db = load();

  db[threadID] = {
    ...defaultData(),
    ...db[threadID],
    ...data
  };

  save(db);
}

// ============================================
// GET ALL THREADS
// ============================================
function getAllThreads() {
  return load();
}

// ============================================
// EXPORTS
// ============================================
module.exports = {
  load,
  save,
  getThread,
  setThread,
  getAllThreads
};
