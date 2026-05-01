const { getUser, setUser } = require("../core/economy");

module.exports = {
  name: "bank",
  description: "Bank system",

  async execute(ctx) {
    const id = ctx.senderID;
    const user = getUser(id);

    let [action, amountRaw] = ctx.args;
    let amount = parseInt(amountRaw);

    if (!action) {
      return ctx.reply(
        `🏦 BANK SYSTEM\n\n` +
        `💰 Wallet: ${user.money}\n` +
        `🏦 Bank: ${user.bank}\n\n` +
        `Commands:\n` +
        `/bank deposit <amount>\n` +
        `/bank withdraw <amount>`
      );
    }

    action = action.toLowerCase();

    // =========================
    // DEPOSIT
    // =========================
    if (action === "deposit") {
      if (!amount || amount <= 0)
        return ctx.reply("❌ Invalid amount.");

      if (user.money < amount)
        return ctx.reply("❌ Not enough money.");

      user.money -= amount;
      user.bank += amount;

      setUser(id, user);

      return ctx.reply(
        `🏦 Deposited ${amount}\n` +
        `💰 Wallet: ${user.money}\n` +
        `🏦 Bank: ${user.bank}`
      );
    }

    // =========================
    // WITHDRAW
    // =========================
    if (action === "withdraw") {
      if (!amount || amount <= 0)
        return ctx.reply("❌ Invalid amount.");

      if (user.bank < amount)
        return ctx.reply("❌ Not enough bank funds.");

      user.bank -= amount;
      user.money += amount;

      setUser(id, user);

      return ctx.reply(
        `💰 Withdrawn ${amount}\n` +
        `💰 Wallet: ${user.money}\n` +
        `🏦 Bank: ${user.bank}`
      );
    }

    return ctx.reply("❌ Invalid action.");
  }
};
