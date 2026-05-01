const fs = require("fs");
const path = require("path");

const FILE = path.join(process.cwd(), "../data/roles.json");

function load() {
  if (!fs.existsSync(FILE)) return {};
  return JSON.parse(fs.readFileSync(FILE, "utf8"));
}

function save(data) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

/**
 * Get role in a group
 */
function getGroupRole(threadID, userID) {
  const db = load();
  return db?.[threadID]?.[userID] || "user";
}

/**
 * Set role
 */
function setGroupRole(threadID, userID, role) {
  const db = load();

  if (!db[threadID]) db[threadID] = {};
  db[threadID][userID] = role;

  save(db);
}

module.exports = {
  getGroupRole,
  setGroupRole
};
