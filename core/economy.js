const fs = require("fs");
const path = require("path");

const DB = path.join(__dirname, "../data/economy.json");

// =========================
// LOAD / SAVE
// =========================
function load() {
  try {
    if (!fs.existsSync(DB)) {
      fs.mkdirSync(path.dirname(DB), { recursive: true });
      fs.writeFileSync(DB, "{}");
    }
    return JSON.parse(fs.readFileSync(DB, "utf8"));
  } catch (err) {
    console.error("Economy load error:", err);
    return {};
  }
}

function save(data) {
  fs.writeFileSync(DB, JSON.stringify(data, null, 2));
}

// =========================
// DEFAULT USER
// =========================
function defaultUser() {
  return {
    money: 1000,
    bank: 0,

    xp: 0,
    level: 1,

    lastWork: 0,
    lastDaily: 0,
    streak: 0,

    inventory: {},

    jailedUntil: 0
  };
}

// =========================
// GET USER
// =========================
function getUser(id) {
  const db = load();

  if (!db[id]) {
    db[id] = defaultUser();
    save(db);
  }

  return db[id];
}

// =========================
// SET USER (SAFE MERGE)
// =========================
function setUser(id, data) {
  const db = load();

  db[id] = {
    ...getUser(id),
    ...data
  };

  save(db);
}

// =========================
// SAFE MONEY OPS
// =========================
function addMoney(id, amount) {
  const user = getUser(id);
  user.money += Math.floor(amount || 0);
  setUser(id, user);
  return user.money;
}

function removeMoney(id, amount) {
  const user = getUser(id);
  user.money -= Math.floor(amount || 0);

  if (user.money < 0) user.money = 0;

  setUser(id, user);
  return user.money;
}

// =========================
// BANK OPS (important for casino/rob system)
// =========================
function addBank(id, amount) {
  const user = getUser(id);
  user.bank += Math.floor(amount || 0);
  setUser(id, user);
  return user.bank;
}

function removeBank(id, amount) {
  const user = getUser(id);
  user.bank -= Math.floor(amount || 0);

  if (user.bank < 0) user.bank = 0;

  setUser(id, user);
  return user.bank;
}

// =========================
// XP SYSTEM (future use only)
// =========================
function addXP(id, amount) {
  const user = getUser(id);

  user.xp += amount;

  const needed = user.level * 120;

  if (user.xp >= needed) {
    user.xp -= needed;
    user.level += 1;
  }

  setUser(id, user);
  return user.level;
}

// =========================
// EXPORTS
// =========================
module.exports = {
  getUser,
  setUser,

  addMoney,
  removeMoney,

  addBank,
  removeBank,

  addXP
};
