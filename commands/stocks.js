const axios = require("axios");
const { load } = require("../core/stocks");
const { getUser, setUser } = require("../core/economy");

module.exports = {
  name: "stocks",
  category: "economy",

  description: "Stock market system (buy, sell, portfolio, charts)",

  usage:
    "/stocks list\n" +
    "/stocks buy <symbol> <amount>\n" +
    "/stocks sell <symbol> <amount>\n" +
    "/stocks portfolio\n" +
    "/stocks chart <symbol>",

  async execute(ctx) {
    try {

      const args = ctx.args || [];
      const id = ctx.senderID;

      const stocks = load();
      const user = getUser(id);

      const action = (args[0] || "").toLowerCase();

      // =========================
      // LIST MARKET
      // =========================
      if (!action || action === "list") {

        let msg = "📈 STOCK MARKET\n━━━━━━━━━━━━━━\n\n";

        for (const symbol in stocks) {
          msg += `📊 ${symbol}: ₱${stocks[symbol].price.toFixed(2)}\n`;
        }

        return ctx.reply(msg.trim());
      }

      // =========================
      // PORTFOLIO
      // =========================
      if (action === "portfolio") {

        const inv = user.inventory || {};

        let msg = "💼 YOUR PORTFOLIO\n━━━━━━━━━━━━━━\n\n";
        msg += `💰 Cash: ₱${user.money}\n\n`;

        if (Object.keys(inv).length === 0) {
          msg += "📭 No stocks owned.";
          return ctx.reply(msg);
        }

        for (const s in inv) {
          msg += `📊 ${s}: ${inv[s]} shares\n`;
        }

        return ctx.reply(msg.trim());
      }

      // =========================
      // CHART (REAL IMAGE)
      // =========================
      if (action === "chart") {

        const symbol = (args[1] || "").toUpperCase();

        if (!stocks[symbol]) {
          return ctx.reply("❌ Stock not found.");
        }

        const history = stocks[symbol].history || [];

        if (!history.length) {
          return ctx.reply("❌ No chart data yet.");
        }

        const chartConfig = {
          type: "line",
          data: {
            labels: history.map((_, i) => `T${i + 1}`),
            datasets: [{
              label: symbol,
              data: history,
              borderColor: "blue",
              fill: false
            }]
          }
        };

        const url = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(chartConfig))}`;

        const res = await axios.get(url, {
          responseType: "stream"
        });

        return ctx.reply({
          attachment: res.data
        });
      }

      // =========================
      // TRADE SYSTEM
      // =========================
      const symbol = (args[1] || "").toUpperCase();
      const amount = parseInt(args[2]);

      if (!stocks[symbol]) {
        return ctx.reply("❌ Stock not found.");
      }

      const price = stocks[symbol].price;

      // =========================
      // BUY
      // =========================
      if (action === "buy") {

        if (!amount || amount <= 0) {
          return ctx.reply("❌ Invalid amount.");
        }

        const cost = price * amount;

        if (user.money < cost) {
          return ctx.reply("❌ Not enough money.");
        }

        user.money -= cost;

        user.inventory = user.inventory || {};
        user.inventory[symbol] =
          (user.inventory[symbol] || 0) + amount;

        setUser(id, user);

        return ctx.reply(
          `📈 BOUGHT ${amount} ${symbol}\n💸 ₱${cost.toFixed(2)}`
        );
      }

      // =========================
      // SELL
      // =========================
      if (action === "sell") {

        const owned = user.inventory?.[symbol] || 0;

        if (owned < amount) {
          return ctx.reply("❌ Not enough stocks.");
        }

        const earnings = price * amount;

        user.money += earnings;
        user.inventory[symbol] -= amount;

        setUser(id, user);

        return ctx.reply(
          `📉 SOLD ${amount} ${symbol}\n💰 ₱${earnings.toFixed(2)}`
        );
      }

      // =========================
      // HELP FALLBACK
      // =========================
      return ctx.reply(
        "📈 STOCKS COMMANDS\n━━━━━━━━━━━━━━\n\n" +
        "/stocks list\n" +
        "/stocks buy <symbol> <amount>\n" +
        "/stocks sell <symbol> <amount>\n" +
        "/stocks portfolio\n" +
        "/stocks chart <symbol>"
      );

    } catch (err) {
      console.error("Stocks error:", err);
      return ctx.reply("❌ Stocks system crashed safely.");
    }
  }
};
