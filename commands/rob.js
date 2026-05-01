const { getUser, setUser } = require("../core/economy");

const cooldowns = new Map();

module.exports = {
  name: "rob",
  description: "Rob another user in the same thread",

  async execute(ctx) {
    const attackerId = ctx.senderID;
    const threadID = ctx.threadID;

    let targetId = ctx.args[0];

    if (!targetId)
      return ctx.reply("❌ Usage: /rob <userID>");

    // =========================
    // COOLDOWN
    // =========================
    const now = Date.now();
    const cd = cooldowns.get(attackerId) || 0;

    if (now < cd) {
      const sec = Math.ceil((cd - now) / 1000);
      return ctx.reply(`⏳ Wait ${sec}s before robbing again.`);
    }

    cooldowns.set(attackerId, now + 60000); // 1 min cooldown

    // =========================
    // USERS
    // =========================
    const attacker = getUser(attackerId);
    const target = getUser(targetId);

    if (!target)
      return ctx.reply("❌ User not found.");

    if (attackerId === targetId)
      return ctx.reply("❌ You cannot rob yourself.");

    // =========================
    // BANK PROTECTION SYSTEM
    // =========================
    const targetWealth = target.money + target.bank;

    if (targetWealth <= 0)
      return ctx.reply("❌ Target is broke.");

    // =========================
    // SUCCESS CHANCE FORMULA
    // =========================
    const baseChance = 0.45;
    const luckModifier = Math.min(0.2, attacker.level * 0.01);

    const successChance = baseChance + luckModifier;

    const success = Math.random() < successChance;

    // =========================
    // RESULT
    // =========================
    if (!success) {
      const penalty = Math.floor(attacker.money * 0.05);

      attacker.money -= penalty;

      setUser(attackerId, attacker);

      return ctx.reply(
        `🚨 ROB FAILED!\n\n` +
        `💀 You got caught!\n` +
        `💸 Fine: -${penalty}`
      );
    }

    // =========================
    // STEAL AMOUNT (BANK FIRST)
    // =========================
    const stealPercent = 0.2; // 20%
    let stolen = Math.floor(targetWealth * stealPercent);

    if (target.bank >= stolen) {
      target.bank -= stolen;
    } else {
      const remaining = stolen - target.bank;
      target.bank = 0;
      target.money = Math.max(0, target.money - remaining);
    }

    attacker.money += stolen;

    setUser(attackerId, attacker);
    setUser(targetId, target);

    return ctx.reply(
      `🥷 ROB SUCCESS!\n\n` +
      `💰 Stolen: ${stolen}\n` +
      `🎯 From: ${targetId}\n` +
      `💼 Cooldown: 60s`
    );
  }
};
