const fs = require("fs");
const path = require("path");

const DB = path.join(__dirname, "../data/anidaily.json");

function load() {
  try {
    return JSON.parse(fs.readFileSync(DB));
  } catch {
    return {};
  }
}

function save(data) {
  fs.writeFileSync(DB, JSON.stringify(data, null, 2));
}

function getThread(id) {
  const db = load();
  return db[id] || { enabled: true, genre: null };
}

function setThread(id, data) {
  const db = load();
  db[id] = { ...getThread(id), ...data };
  save(db);
}

module.exports = { load, save, getThread, setThread };
