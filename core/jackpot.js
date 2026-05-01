// core/jackpot.js

const fs = require("fs");
const path = require("path");

const FILE = path.join(__dirname, "../data/jackpot.json");

// =========================
// LOAD
// =========================
function load() {
  try {
    if (!fs.existsSync(FILE)) {
      fs.mkdirSync(path.dirname(FILE), { recursive: true });
      fs.writeFileSync(FILE, JSON.stringify({ pool: 0 }, null, 2));
    }

    return JSON.parse(fs.readFileSync(FILE, "utf8"));
  } catch (err) {
    console.error("Jackpot load error:", err);
    return { pool: 0 };
  }
}

// =========================
// SAVE
// =========================
function save(data) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

// =========================
// GET POOL
// =========================
function get() {
  return load().pool || 0;
}

// =========================
// ADD TO POOL
// =========================
function add(amount) {
  const db = load();

  db.pool += Math.floor(amount || 0);

  if (db.pool < 0) db.pool = 0;

  save(db);

  return db.pool;
}

// =========================
// RESET (WIN JACKPOT)
// =========================
function reset() {
  save({ pool: 0 });
}

module.exports = {
  get,
  add,
  reset
};
