const fs = require("fs");
const path = require("path");

const DB = path.join(__dirname, "../data/stocks.json");

function load() {
  if (!fs.existsSync(DB)) fs.writeFileSync(DB, "{}");
  return JSON.parse(fs.readFileSync(DB, "utf8"));
}

function save(data) {
  fs.writeFileSync(DB, JSON.stringify(data, null, 2));
}

function tickMarket() {
  const stocks = load();

  for (const s in stocks) {
    const st = stocks[s];
    const change = (Math.random() - 0.5) * st.volatility * st.price;
    st.price = Math.max(0.01, st.price + change);
  }

  save(stocks);
}

module.exports = { load, save, tickMarket };
