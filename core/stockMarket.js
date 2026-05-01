const fs = require("fs");
const path = require("path");

const DB = path.join(__dirname, "../data/stocks.json");

// =========================
// LOAD
// =========================
function load() {
  try {
    if (!fs.existsSync(DB)) {
      fs.mkdirSync(path.dirname(DB), { recursive: true });
      fs.writeFileSync(DB, "{}");
    }

    return JSON.parse(fs.readFileSync(DB, "utf8"));
  } catch (err) {
    console.error("❌ Stock load error:", err);
    return {};
  }
}

// =========================
// SAVE
// =========================
function save(data) {
  try {
    fs.writeFileSync(DB, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("❌ Stock save error:", err);
  }
}

// =========================
// MARKET TICK
// =========================
function tickMarket() {
  const stocks = load();

  for (const symbol in stocks) {
    const s = stocks[symbol];

    // =========================
    // SAFE DEFAULTS (IMPORTANT FIX)
    // =========================
    if (typeof s.price !== "number") s.price = 1;
    if (typeof s.volatility !== "number") s.volatility = 0.05;

    if (!Array.isArray(s.history)) {
      s.history = [];
    }

    // =========================
    // PRICE UPDATE
    // =========================
    const change =
      (Math.random() - 0.5) *
      s.volatility *
      s.price;

    s.price = Math.max(0.01, s.price + change);

    const fixedPrice = Number(s.price.toFixed(2));

    // =========================
    // HISTORY TRACKING (🔥 FIX)
    // =========================
    s.history.push(fixedPrice);

    // keep last 30 points
    if (s.history.length > 30) {
      s.history.shift();
    }
  }

  // =========================
  // MARKET EVENTS
  // =========================
  const eventRoll = Math.random();

  if (eventRoll < 0.05) {
    // 📉 CRASH
    for (const symbol in stocks) {
      stocks[symbol].price *= 0.7;
    }
    console.log("📉 Market Crash!");
  }

  else if (eventRoll > 0.95) {
    // 📈 BOOM
    for (const symbol in stocks) {
      stocks[symbol].price *= 1.3;
    }
    console.log("📈 Market Boom!");
  }

  save(stocks);

  console.log("📊 Stock market ticked");
}

// =========================
// AUTO RUN
// =========================
setInterval(tickMarket, 60 * 60 * 1000); // 1 hour

// optional: run once on boot
tickMarket();

module.exports = { load, save, tickMarket };
