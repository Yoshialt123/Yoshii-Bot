const { getUser, setUser } = require("../core/economy");
const jackpot = require("../core/jackpot");
const { applyWinTax, applyLossToJackpot } = require("../core/tax");

module.exports = {
  name: "risk",
  aliases: ["double"],
  usage: "/risk <bet>",
  category: "casino",

  async execute(ctx) {
    const uid = ctx.senderID;
    const user = getUser(uid);

    const bet = parseInt(ctx.args[0]);

    if (!bet || bet <= 0) {
      return ctx.reply("🎯 Usage: /risk <bet>");
    }

    if (user.money < bet) {
      return ctx.reply("❌ Not enough money.");
    }

    // 🎲 50/50 chance
    const win = Math.random() < 0.5;

    if (win) {
      let reward = applyWinTax(bet * 2);

      user.money += reward;

      setUser(uid, user);

      return ctx.reply(
        `🎯 RISK RESULT\n\n🎉 SAFE!\n💰 +₱${reward}\n🏦 Balance: ₱${user.money}`
      );

    } else {
      user.money -= bet;

      const contrib = applyLossToJackpot(bet);

      setUser(uid, user);

      return ctx.reply(
        `🎯 RISK RESULT\n\n💀 RIP\n💸 -₱${bet}\n🎰 Jackpot +₱${contrib}\n🎰 Pool: ₱${jackpot.get()}`
      );
    }
  }
};
