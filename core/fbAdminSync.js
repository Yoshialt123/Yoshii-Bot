const fs = require("fs");
const path = require("path");

const FILE = path.join(process.cwd(), "data/fbAdmins.json");

// =========================
// MEMORY CACHE (FAST ACCESS)
// =========================
const memoryCache = new Map();
const CACHE_TTL = 1000 * 60 * 5; // 5 minutes

function load() {
  try {
    if (!fs.existsSync(FILE)) return {};
    return JSON.parse(fs.readFileSync(FILE, "utf8"));
  } catch {
    return {};
  }
}

function save(data) {
  try {
    fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("fbAdminSync save error:", err);
  }
}

// =========================
// NORMALIZER (IMPORTANT FIX)
// =========================
function normalizeAdmins(raw = []) {
  if (!Array.isArray(raw)) return [];

  return raw
    .map(u => {
      if (typeof u === "string") return u;

      return (
        u?.id ||
        u?.userFbId ||
        u?.userID ||
        u?.uid ||
        null
      );
    })
    .filter(Boolean)
    .map(String);
}

// =========================
// SYNC FROM FACEBOOK
// =========================
async function syncThreadAdmins(api, threadID) {
  try {
    const info = await api.getThreadInfo(threadID);

    const admins = normalizeAdmins(
      info.adminIDs || info.adminUserIDs || []
    );

    const db = load();

    db[threadID] = {
      admins,
      updatedAt: Date.now()
    };

    save(db);

    memoryCache.set(threadID, {
      admins,
      time: Date.now()
    });

    return admins;
  } catch (err) {
    console.error("syncThreadAdmins error:", err);
    return null;
  }
}

// =========================
// GET CACHED ADMINS (FAST)
// =========================
function getCachedAdmins(threadID) {
  const mem = memoryCache.get(threadID);

  if (mem && Date.now() - mem.time < CACHE_TTL) {
    return mem.admins;
  }

  const db = load();
  return db?.[threadID]?.admins || [];
}

// =========================
// CHECK ADMIN STATUS
// =========================
function isFBAdmin(threadID, userID) {
  const admins = getCachedAdmins(threadID);
  return admins.includes(String(userID));
}

// =========================
// FORCE REFRESH
// =========================
async function refreshThreadAdmins(api, threadID) {
  return await syncThreadAdmins(api, threadID);
}

module.exports = {
  syncThreadAdmins,
  getCachedAdmins,
  isFBAdmin,
  refreshThreadAdmins
};
