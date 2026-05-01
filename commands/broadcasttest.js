const { getThreads } = require("../core/threadStore");

module.exports = {
  name: "bcdebug",
  cooldown: 5000,

  async execute(ctx) {
    const api = ctx.api || global.api;

    const message = (ctx.body || "").split(" ").slice(1).join(" ");
    if (!message) return ctx.reply("Usage: +bcdebug <message>");

    const db = getThreads();

    if (!Array.isArray(db)) {
      return ctx.reply("❌ Thread DB is not array. Fix threadStore first.");
    }

    let sent = 0;
    let failed = 0;

    ctx.reply(`🔍 Debug broadcast starting...\nThreads: ${db.length}`);

    for (const threadID of db) {
      console.log("\n======================");
      console.log("➡️ THREAD:", threadID);

      try {
        const res = await api.sendMessage(message, threadID);

        console.log("✅ SENT OK");
        console.log("RESPONSE:", res);

        sent++;
      } catch (err) {
        console.log("❌ FAILED");
        console.log("ERROR:", err.message);

        failed++;
      }
    }

    ctx.reply(
      `📡 DEBUG DONE\n` +
      `Total: ${db.length}\n` +
      `Sent: ${sent}\n` +
      `Failed: ${failed}`
    );
  }
};
