const perm = require("../core/permissions");
const { getThreads } = require("../core/threadStore");

module.exports = {
  name: "broadcast",
  category: "admin",
  usage: "/broadcast <message>",

  async execute(ctx) {
    const api = ctx.api || global.api;

    const p = await perm(ctx);

    if (!p.bot.canBroadcast) {
      return ctx.reply("❌ Admin only command.");
    }

    const message = ctx.body.split(" ").slice(1).join(" ").trim();

    if (!message) {
      return ctx.reply(
        "📡 BROADCAST SYSTEM\n\n" +
        "Usage: /broadcast <message>\n" +
        "Example: /broadcast Server update tonight"
      );
    }

    const threads = getThreads();

    let sent = 0;
    let failed = 0;

    const startMsg = await ctx.reply(
      "📡 BROADCAST INITIATED\n" +
      "━━━━━━━━━━━━━━━━━━━━\n" +
      `📦 Threads loaded: ${threads.length}\n` +
      "⏳ Sending messages...\n" +
      "━━━━━━━━━━━━━━━━━━━━"
    );

    for (const id of threads) {
      try {
        await api.sendMessage(
          `📢 SYSTEM BROADCAST\n\n${message}\n\n━━━━━━━━━━━━━━`,
          id
        );
        sent++;
      } catch {
        failed++;
      }
    }

    return ctx.reply(
      "📡 BROADCAST COMPLETE\n" +
      "━━━━━━━━━━━━━━━━━━━━\n" +
      `✅ Sent: ${sent}\n` +
      `❌ Failed: ${failed}\n` +
      "━━━━━━━━━━━━━━━━━━━━\n" +
      `📦 Total: ${threads.length}`
    );
  }
};
