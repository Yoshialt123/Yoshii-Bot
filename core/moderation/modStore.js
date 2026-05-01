const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "../../data/moderation.json");

let db = load();

function load() {
  try {
    const raw = fs.readFileSync(DB_PATH, "utf8");
    const json = JSON.parse(raw);

    return {
      users: json.users || {},
      threads: json.threads || {}
    };
  } catch {
    return { users: {}, threads: {} };
  }
}

function save() {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

const now = () => Date.now();

// =========================
// USERS
// =========================
function getUser(uid) {
  if (!db.users[uid]) {
    db.users[uid] = {
      strikes: 0,
      warned: false,
      bannedUntil: 0,
      globalBan: false,
      name: null
    };
  }
  return db.users[uid];
}

function setUser(uid, data) {
  db.users[uid] = { ...getUser(uid), ...data };
  save();
}

// =========================
// THREADS
// =========================
function getThread(tid) {
  if (!db.threads[tid]) {
    db.threads[tid] = {
      banned: [],
      locked: false
    };
  }
  return db.threads[tid];
}

// ✔ thread ban
function isThreadBanned(tid, uid) {
  return getThread(tid).banned.includes(uid);
}

// ✔ thread lock
function isThreadLocked(tid) {
  return getThread(tid).locked;
}

// ✔ actions
function banThreadUser(tid, uid) {
  const t = getThread(tid);
  if (!t.banned.includes(uid)) t.banned.push(uid);
  save();
}

function lockThread(tid) {
  getThread(tid).locked = true;
  save();
}

function unlockThread(tid) {
  getThread(tid).locked = false;
  save();
}

// =========================
// EXPORTS
// =========================
function getDB() {
  return db;
}

module.exports = {
  getDB,
  getUser,
  setUser,

  getThread,

  isThreadBanned,
  isThreadLocked,

  banThreadUser,
  lockThread,
  unlockThread
};
