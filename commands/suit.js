// commands/suit.js

const { getUser, setUser } = require("../core/economy");
const jackpot = require("../core/jackpot");
const { applyWinTax, applyLossToJackpot } = require("../core/tax");

const suits = ["♠️", "♣️", "♥️", "♦️"];

const map = {
  spade: "♠️",
  club: "♣️",
  heart: "♥️",
  diamond: "♦️"
};

function getResult() {
  const roll = Math.random();

  if (roll < 0.35) return suits[0];
  if (roll < 0.65) return suits[1];
  if (roll < 0.90) return suits[2];
  return suits[3];
}

module.exports = {
  name: "suit",
  description: "Guess the card suit",
  usage: "/suit <bet>",
  category: "casino",

  async execute(ctx) {
    const bot = ctx.bot || global.bot;

    const senderID = ctx.senderID;
    const threadID = ctx.threadID;

    const user = getUser(senderID);

    const bet = parseInt(ctx.args[0]);

    if (!bet || bet <= 0) {
      return ctx.reply("🎴 Usage: /suit <bet>");
    }

    if (user.money < bet) {
      return ctx.reply("❌ Not enough money.");
    }

    // 💸 deduct immediately
    user.money -= bet;
    setUser(senderID, user);

    await ctx.reply(
      `🎴 SUIT GAME\n\n💰 Bet: ₱${bet}\nReply: spade / heart / club / diamond\n⏳ 15 seconds`
    );

    // =========================
    // REPLY LISTENER
    // =========================
    const guess = await new Promise((resolve) => {
      const timeout = setTimeout(() => {
        bot.removeListener("messageCreate", handler);
        resolve(null);
      }, 15000);

      function handler(event) {
        if (!event?.body) return;
        if (event.threadID !== threadID) return;
        if (event.senderID !== senderID) return;

        const input = event.body.toLowerCase().trim();

        if (!map[input]) return;

        clearTimeout(timeout);
        bot.removeListener("messageCreate", handler);

        resolve(map[input]);
      }

      bot.on("messageCreate", handler);
    });

    if (!guess) {
      return ctx.reply("⏳ Timeout. Game cancelled.");
    }

    const result = getResult();
    const win = guess === result;

    let msg = `🎴 RESULT: ${result}\n🎯 Your pick: ${guess}\n\n`;

    if (win) {
      let payout = applyWinTax(bet * 1.8);
      user.money += payout;

      msg += `🎉 WIN!\n💰 +₱${payout}`;

      // 🎰 jackpot chance
      if (Math.random() < 0.05) {
        const prize = jackpot.get();

        if (prize > 0) {
          user.money += prize;
          jackpot.reset();

          msg += `\n\n🎰 JACKPOT WON!\n💰 +₱${prize}`;
        }
      }

    } else {
      const contributed = applyLossToJackpot(bet);

      msg += `💀 LOSE!\n💸 -₱${bet}`;
      msg += `\n🎰 Jackpot +₱${contributed}`;
    }

    setUser(senderID, user);

    msg += `\n\n🏦 Balance: ₱${user.money}`;
    msg += `\n🎰 Pool: ₱${jackpot.get()}`;

    return ctx.reply(msg);
  }
};
