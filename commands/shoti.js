const axios = require("axios");
const { getUser, setUser } = require("../core/economy");

module.exports = {
  name: "shoti",
  description: "Get random TikTok video (costs money 💸)",
  usage: "/shoti",

  async execute(ctx) {
    const senderID = ctx.senderID;

    const user = getUser(senderID);

    const COST = 1000;

    // 💸 check money
    if (user.money < COST) {
      return ctx.reply(
        `❌ You need ₱${COST} to use this.\n` +
        `💰 Your balance: ₱${user.money}`
      );
    }

    try {
      // deduct first (anti spam)
      user.money -= COST;
      setUser(senderID, user);

      await ctx.reply("🎥 Fetching TikTok video...");

      const res = await axios.get(
        "https://oreo.gleeze.com/api/shoti?stream=true",
        { responseType: "stream", timeout: 30000 }
      );

      // send video
      await ctx.reply({
        body: `🎬 Here's your video!\n💸 -₱${COST}\n💰 Balance: ₱${user.money}`,
        attachment: res.data
      });

    } catch (err) {
      // refund if failed
      user.money += COST;
      setUser(senderID, user);

      return ctx.reply("❌ Failed to fetch video.");
    }
  }
};
