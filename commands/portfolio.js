const { getUser } = require("../core/economy");
const { load } = require("../core/stockMarket");

module.exports = {
  name: "portfolio",
  aliases: ["pf"],
  description: "View your stock investments and total value",
  usage: "/portfolio",
  category: "economy",

  async execute(ctx) {
    try {
      const user = getUser(ctx.senderID);
      const stocks = load();

      const inv = user.inventory || {};

      let msg = "💼 YOUR PORTFOLIO\n\n";
      let total = 0;
      let hasStocks = false;

      for (const symbol in inv) {

        const amount = inv[symbol];

        // skip empty holdings
        if (!amount || amount <= 0) continue;

        const stock = stocks[symbol];

        // 🔥 handle missing stock safely
        const price = stock?.price || 0;

        const value = amount * price;
        total += value;
        hasStocks = true;

        msg += `${symbol} x${amount} = ₱${value.toFixed(2)}\n`;
      }

      if (!hasStocks) {
        return ctx.reply("💼 You don't own any stocks yet.");
      }

      msg += `\n💰 TOTAL VALUE: ₱${total.toFixed(2)}`;

      return ctx.reply(msg);

    } catch (err) {
      console.error("Portfolio error:", err);
      return ctx.reply("❌ Failed to load portfolio.");
    }
  }
};
