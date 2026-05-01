const { getUser, setUser } = require("../core/economy");

module.exports = {
  name: "addmoney",
  description: "Add money (ADMIN ONLY)",
  usage: "/addmoney 1000 OR /addmoney @user 1000",

  async execute(ctx) {
    const senderID = ctx.senderID;
    const config = global.config;

    // 🔒 Admin check
    const isAdmin =
      senderID === config.owner ||
      (config.admins || []).includes(senderID);

    if (!isAdmin) {
      return ctx.reply("❌ Not allowed.");
    }

    const mentions = ctx.event?.mentions || {};
    const mentionIDs = Object.keys(mentions);

    let targetID = senderID;
    let amount;

    // 🎯 If mention exists
    if (mentionIDs.length > 0) {
      targetID = mentionIDs[0];
      amount = parseInt(ctx.args[1]);
    } else {
      amount = parseInt(ctx.args[0]);
    }

    // ❌ Validation
    if (isNaN(amount)) {
      return ctx.reply(
        "❌ Usage:\n/addmoney 1000\n/addmoney @user 1000"
      );
    }

    // 🔥 Optional safety limit
    if (Math.abs(amount) > 1_000_000) {
      return ctx.reply("❌ Amount too large.");
    }

    const user = getUser(targetID);

    user.money += amount;

    // ❌ prevent negative balance (optional)
    if (user.money < 0) user.money = 0;

    setUser(targetID, user);

    return ctx.reply(
      `💰 ${amount >= 0 ? "Added" : "Removed"} ₱${Math.abs(amount)}\n` +
      `👤 ${targetID === senderID ? "You" : "User"} now has ₱${user.money}`
    );
  }
};
