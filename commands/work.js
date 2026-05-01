const { getUser, setUser, addXP } = require("../core/economy");

const jobs = [
  { text: "You fixed a server bug 💻", min: 50, max: 120 },
  { text: "You delivered food 🚴", min: 40, max: 100 },
  { text: "You worked in a café ☕", min: 30, max: 80 },
  { text: "You mined crypto ⛏️", min: 60, max: 150 }
];

const cooldown = new Map();

module.exports = {
  name: "work",

  async execute(ctx) {
    const id = ctx.senderID;
    const user = getUser(id);

    const now = Date.now();
    const cd = cooldown.get(id) || 0;

    if (now - cd < 5 * 60 * 1000) {
      return ctx.reply("⏳ You are tired. Wait 5 minutes.");
    }

    const job = jobs[Math.floor(Math.random() * jobs.length)];
    const earn = Math.floor(Math.random() * (job.max - job.min)) + job.min;

    user.money += earn;
    addXP(user, 10);

    setUser(id, user);
    cooldown.set(id, now);

    return ctx.reply(
      `💼 WORK RESULT\n\n` +
      `${job.text}\n` +
      `💰 Earned: ${earn}\n` +
      `⭐ XP +10\n` +
      `🏦 Balance: ${user.money}`
    );
  }
};
