const { getUser } = require("../core/economy");

module.exports = {
  name: "balance",
  description: "Check your money",

  async execute(ctx) {
    const user = getUser(ctx.senderID);

    return ctx.reply(
      `💰 Wallet: ₱${user.money}\n🏦 Bank: ₱${user.bank}`
    );
  }
};
