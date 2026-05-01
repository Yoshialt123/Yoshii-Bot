const fs = require("fs");
const path = require("path");

const FILE = path.join(process.cwd(), "data", "threads.json");

// ensure file exists
function ensureFile() {
  const dir = path.dirname(FILE);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(FILE)) {
    fs.writeFileSync(FILE, JSON.stringify([], null, 2));
  }
}

function load() {
  ensureFile();

  try {
    const data = JSON.parse(fs.readFileSync(FILE, "utf8"));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function save(data) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

// ➕ add thread (no duplicates)
function addThread(threadID) {
  const db = load();

  const id = String(threadID);

  if (!db.includes(id)) {
    db.push(id);
    save(db);
  }
}

// 📥 get all threads
function getThreads() {
  return load();
}

// ❌ remove thread (optional use)
function removeThread(threadID) {
  const db = load();

  const id = String(threadID);
  const newDb = db.filter(t => t !== id);

  save(newDb);
}

module.exports = {
  addThread,
  getThreads,
  load,
  save,
  removeThread
};
