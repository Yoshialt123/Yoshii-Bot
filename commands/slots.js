const { getUser, setUser } = require("../core/economy");
const jackpot = require("../core/jackpot");
const { applyWinTax, applyLossToJackpot } = require("../core/tax");

const symbols = ["🍒", "🍋", "🔔", "💎", "7️⃣"];

// 🎯 weighted roll (rarer symbols harder)
function spin() {
  const pool = [
    "🍒","🍒","🍒","🍒",
    "🍋","🍋","🍋",
    "🔔","🔔",
    "💎",
    "7️⃣"
  ];
  return pool[Math.floor(Math.random() * pool.length)];
}

function getResult() {
  return [spin(), spin(), spin()];
}

// 🎯 payout logic
function getMultiplier(a, b, c) {
  if (a === b && b === c) {
    if (a === "7️⃣") return 10;
    if (a === "💎") return 6;
    return 3;
  }

  if (a === b || b === c || a === c) {
    return 1.5;
  }

  return 0;
}

module.exports = {
  name: "slots",
  aliases: ["slot"],
  description: "Slot machine game",
  usage: "/slots <bet>",
  category: "casino",

  async execute(ctx) {
    const senderID = ctx.senderID;
    const user = getUser(senderID);

    const bet = parseInt(ctx.args[0]);

    if (!bet || bet <= 0) {
      return ctx.reply("🎰 Usage: /slots <bet>");
    }

    if (user.money < bet) {
      return ctx.reply("❌ Not enough money.");
    }

    // 💸 deduct
    user.money -= bet;
    setUser(senderID, user);

    // 🎰 initial message
    const msg = await ctx.reply("🎰 Spinning...\n\n[ ❔ | ❔ | ❔ ]");

    // fake animation frames
    const frames = [
      "[ 🍒 | ❔ | ❔ ]",
      "[ 🍒 | 🍋 | ❔ ]",
      "[ 🍒 | 🍋 | 🔔 ]"
    ];

    for (let i = 0; i < frames.length; i++) {
      await new Promise(r => setTimeout(r, 600));

      try {
        await ctx.bot.api.editMessage(
          `🎰 Spinning...\n\n${frames[i]}`,
          msg.messageID
        );
      } catch {}
    }

    // 🎯 final result
    const [a, b, c] = getResult();
    const multiplier = getMultiplier(a, b, c);

    let resultMsg = `🎰 RESULT\n\n[ ${a} | ${b} | ${c} ]\n\n`;

    if (multiplier > 0) {
      let winnings = bet * multiplier;
      winnings = applyWinTax(winnings);

      user.money += winnings;

      resultMsg += `🎉 WIN!\n💰 +₱${winnings}`;

      // 🎰 jackpot chance
      if (Math.random() < 0.03) {
        const prize = jackpot.get();

        if (prize > 0) {
          user.money += prize;
          jackpot.reset();

          resultMsg += `\n\n🎰 JACKPOT HIT!\n💰 +₱${prize}`;
        }
      }

    } else {
      const contributed = applyLossToJackpot(bet);

      resultMsg += `💀 LOSE!\n💸 -₱${bet}`;
      resultMsg += `\n🎰 Jackpot +₱${contributed}`;
    }

    setUser(senderID, user);

    resultMsg += `\n\n🏦 Balance: ₱${user.money}`;
    resultMsg += `\n🎰 Pool: ₱${jackpot.get()}`;

    try {
      await ctx.bot.api.editMessage(resultMsg, msg.messageID);
    } catch {
      return ctx.reply(resultMsg);
    }
  }
};
