// commands/jackpot.js

const jackpot = require("../core/jackpot");

module.exports = {
  name: "jackpot",
  aliases: ["jp", "pool"],
  description: "View current jackpot pool",
  usage: "/jackpot",
  category: "economy",

  async execute(ctx) {
    try {
      const pool = jackpot.get();

      return ctx.reply(
        `🎰 JACKPOT POOL\n\n💰 Current: ₱${pool.toLocaleString()}`
      );

    } catch (err) {
      console.error("Jackpot cmd error:", err);
      return ctx.reply("❌ Failed to load jackpot.");
    }
  }
};
