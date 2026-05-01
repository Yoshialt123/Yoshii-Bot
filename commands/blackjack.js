const { getUser, setUser } = require("../core/economy");
const jackpot = require("../core/jackpot");
const { applyWinTax, applyLossToJackpot } = require("../core/tax");

function drawCard() {
  const cards = [2,3,4,5,6,7,8,9,10,10,10,10,11]; // JQK=10, A=11
  return cards[Math.floor(Math.random() * cards.length)];
}

function total(hand) {
  let sum = hand.reduce((a,b)=>a+b,0);

  // handle Ace (11 -> 1)
  while (sum > 21 && hand.includes(11)) {
    hand[hand.indexOf(11)] = 1;
    sum = hand.reduce((a,b)=>a+b,0);
  }

  return sum;
}

module.exports = {
  name: "blackjack",
  aliases: ["bj"],
  usage: "/blackjack <bet>",
  category: "casino",

  async execute(ctx) {
    const bot = ctx.bot || global.bot;

    const uid = ctx.senderID;
    const tid = ctx.threadID;

    const user = getUser(uid);
    const bet = parseInt(ctx.args[0]);

    if (!bet || bet <= 0) return ctx.reply("🃏 Usage: /blackjack <bet>");
    if (user.money < bet) return ctx.reply("❌ Not enough money.");

    user.money -= bet;
    setUser(uid, user);

    let player = [drawCard(), drawCard()];
    let dealer = [drawCard(), drawCard()];

    await ctx.reply(
      `🃏 BLACKJACK\n\n` +
      `Your: ${player.join(", ")} (Total: ${total(player)})\n` +
      `Dealer: ${dealer[0]}, ❔\n\n` +
      `Reply: hit / stand`
    );

    // =========================
    // LOOP LISTENER
    // =========================
    while (true) {

      const action = await new Promise(resolve => {

        const timeout = setTimeout(() => {
          bot.removeListener("messageCreate", handler);
          resolve(null);
        }, 20000);

        function handler(ev) {
          if (!ev?.body) return;
          if (ev.threadID !== tid) return;
          if (ev.senderID !== uid) return;

          const input = ev.body.toLowerCase().trim();

          if (!["hit","stand"].includes(input)) return;

          clearTimeout(timeout);
          bot.removeListener("messageCreate", handler);

          resolve(input);
        }

        bot.on("messageCreate", handler);
      });

      if (!action) return ctx.reply("⏳ Timeout.");

      if (action === "hit") {
        player.push(drawCard());

        if (total(player) > 21) {
          applyLossToJackpot(bet);

          return ctx.reply(
            `💀 BUST!\nYour: ${total(player)}\n💸 -₱${bet}\n🎰 Pool: ₱${jackpot.get()}`
          );
        }

        await ctx.reply(
          `🃏 Your: ${player.join(", ")} (Total: ${total(player)})\nReply: hit / stand`
        );

      } else break;
    }

    // dealer plays
    while (total(dealer) < 17) {
      dealer.push(drawCard());
    }

    const p = total(player);
    const d = total(dealer);

    let msg = `🃏 RESULT\n\nYour: ${p}\nDealer: ${d}\n\n`;

    if (d > 21 || p > d) {
      let win = applyWinTax(bet * 2);
      user.money += win;

      msg += `🎉 WIN +₱${win}`;
    } else if (p === d) {
      user.money += bet;
      msg += `🤝 DRAW (bet returned)`;
    } else {
      applyLossToJackpot(bet);
      msg += `💀 LOSE -₱${bet}`;
    }

    setUser(uid, user);

    msg += `\n\n🏦 Balance: ₱${user.money}`;
    msg += `\n🎰 Pool: ₱${jackpot.get()}`;

    return ctx.reply(msg);
  }
};
