const fs = require("fs");
const path = require("path");

const DATA_FILE = path.join(__dirname, "../../data/moderation.json");

let db = load();

// =========================
// LOAD / INIT
// =========================
function load() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
      fs.writeFileSync(DATA_FILE, JSON.stringify({ users: {}, threads: {} }, null, 2));
    }

    const raw = fs.readFileSync(DATA_FILE, "utf8");
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
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
}

const now = () => Date.now();

// =========================
// USER
// =========================
function getUser(uid) {
  if (!db.users[uid]) {
    db.users[uid] = {
      strikes: 0,
      warned: false,
      bannedUntil: 0,
      lastMessages: [],
      lastSeen: 0,
      name: null
    };
  }
  return db.users[uid];
}

function updateUser(uid, data) {
  db.users[uid] = { ...getUser(uid), ...data };
  save();
}

// =========================
// CONFIG (TUNED)
// =========================
const WINDOW_MS = 5000;
const MAX_MSGS = 7;
const REPEAT_LIMIT = 3;
const BURST_LIMIT = 6;

// =========================
// BAN DURATION
// =========================
function getBanDuration(strikes) {
  if (strikes === 1) return 24 * 60 * 60 * 1000;
  if (strikes === 2) return 3 * 24 * 60 * 60 * 1000;
  return Infinity;
}

// =========================
// SPAM ANALYSIS (IMPROVED)
// =========================
function analyzeSpam(user, text) {
  const t = now();

  // normalize text (important fix)
  const clean = text.toLowerCase().trim();

  user.lastMessages.push({ text: clean, time: t });

  user.lastMessages = user.lastMessages.filter(
    m => t - m.time <= WINDOW_MS
  );

  // 🚫 FLOOD
  if (user.lastMessages.length >= MAX_MSGS) {
    return { spam: true, type: "flood" };
  }

  // 🚫 BURST (fast typing)
  const fast = user.lastMessages.filter(m => t - m.time < 1200).length;
  if (fast >= BURST_LIMIT) {
    return { spam: true, type: "burst" };
  }

  // 🚫 REPEAT (same message spam)
  const repeat = user.lastMessages.filter(m => m.text === clean).length;
  if (repeat >= REPEAT_LIMIT && clean.length > 3) {
    return { spam: true, type: "repeat" };
  }

  // 🚫 SHORT / EMOJI SPAM
  if (clean.length <= 2 && user.lastMessages.length >= 4) {
    return { spam: true, type: "emoji" };
  }

  return { spam: false };
}

// =========================
// MAIN RATE LIMIT
// =========================
function rateLimit(ctx) {
  const uid = ctx.senderID;

  // 🔥 IGNORE NON-TEXT (FIX YOUR ISSUE)
  if (!ctx.body || typeof ctx.body !== "string") {
    return { ok: true };
  }

  const text = ctx.body.trim();

  // ignore empty
  if (!text) return { ok: true };

  const user = getUser(uid);

  // 🚫 PERMA BAN
  if (user.bannedUntil === Infinity) {
    return { blocked: true, reason: "permanent" };
  }

  // 🚫 TEMP BAN
  if (user.bannedUntil > now()) {
    return { blocked: true, reason: "temporary" };
  }

  // ♻️ RESET EXPIRED
  if (user.bannedUntil && user.bannedUntil < now()) {
    user.bannedUntil = 0;
    user.strikes = 0;
    user.warned = false;
    user.lastMessages = [];
  }

  user.lastSeen = now();

  const result = analyzeSpam(user, text);

  // ✅ NORMAL
  if (!result.spam) {
    updateUser(uid, user);
    return { ok: true };
  }

  // ⚠️ WARNING
  if (!user.warned) {
    user.warned = true;
    updateUser(uid, user);

    return { warn: true, reason: result.type };
  }

  // 🚫 BAN
  user.strikes++;

  const duration = getBanDuration(user.strikes);

  user.bannedUntil =
    duration === Infinity ? Infinity : now() + duration;

  user.warned = false;
  user.lastMessages = [];

  updateUser(uid, user);

  return {
    ban: true,
    duration,
    strikes: user.strikes,
    reason: result.type
  };
}

module.exports = { rateLimit };
