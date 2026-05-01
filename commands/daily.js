const { getUser, setUser } = require("../core/economy");

module.exports = {
  name: "daily",

  async execute(ctx) {
    const user = getUser(ctx.senderID);
    const now = Date.now();

    const cooldown = 24 * 60 * 60 * 1000;

    if (now - user.lastDaily < cooldown) {
      const left = Math.ceil(
        (cooldown - (now - user.lastDaily)) / 3600000
      );

      return ctx.reply(`⏳ Come back in ${left}h`);
    }

    // streak bonus
    user.streak = (user.streak || 0) + 1;

    let reward = 500 + user.streak * 100;

    user.money += reward;
    user.lastDaily = now;

    setUser(ctx.senderID, user);

    return ctx.reply(
      `🎁 Daily Reward Claimed!\n` +
      `💰 +₱${reward}\n` +
      `🔥 Streak: ${user.streak}\n` +
      `🏦 Balance: ₱${user.money}`
    );
  }
};
