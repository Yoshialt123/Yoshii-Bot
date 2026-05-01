const perm = require("../core/permissions");

module.exports = {
  name: "kick",
  category: "group",
  usage: "/kick @user OR reply",

  async execute(ctx) {
    const api = ctx.api || global.api;

    const threadID = ctx.threadID || ctx.event?.threadID;
    const senderID = ctx.senderID || ctx.event?.senderID;

    const p = await perm(ctx);

    // =========================
    // USER PERMISSION CHECK
    // =========================
    if (!p.group.admin && !p.bot.admin && !p.bot.owner) {
      return ctx.reply("❌ Group admin only.");
    }

    // =========================
    // BOT ADMIN CHECK (IMPORTANT)
    // =========================
    let botIsAdmin = false;

    try {
      const info = await api.getThreadInfo(threadID);
      const admins = (info.adminIDs || []).map(a => String(a.id));
      const botID = String(api.getCurrentUserID());

      botIsAdmin = admins.includes(botID);
    } catch {}

    if (!botIsAdmin) {
      return ctx.reply("❌ I need to be a group admin to kick users.");
    }

    // =========================
    // TARGET RESOLUTION
    // =========================
    let target =
      ctx.event?.messageReply?.senderID ||
      Object.keys(ctx.event?.mentions || {})[0] ||
      ctx.args?.[0];

    if (!target) {
      return ctx.reply("⚠️ Reply to a user or mention someone.");
    }

    target = String(target);

    if (target === senderID) {
      return ctx.reply("❌ You cannot kick yourself.");
    }

    if (target === api.getCurrentUserID()) {
      return ctx.reply("❌ I can't kick myself.");
    }

    // =========================
    // EXECUTE
    // =========================
    try {
      await api.removeUserFromGroup(target, threadID);
      return ctx.reply(`👢 Kicked user: ${target}`);
    } catch (err) {
      console.error("Kick error:", err);
      return ctx.reply("❌ Failed to kick (maybe higher role or API issue).");
    }
  }
};
