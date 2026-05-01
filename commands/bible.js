module.exports = {
  name: "bible",
  description: "Bible auto verse system",

  async execute(ctx) {
    const threadID = ctx.threadID;
    const args = ctx.args || [];
    const cmd = (args[0] || "").toLowerCase();

    const { getThread, setThread } = require("../core/bibleStore");
    const data = getThread(threadID);

    if (!cmd) {
      return ctx.reply(
        `📖 Bible Settings\n\n` +
        `Status: ${data.enabled ? "ON" : "OFF"}\n` +
        `Interval: ${data.interval}\n\n` +
        `Commands:\n` +
        `/bible on\n` +
        `/bible off\n` +
        `/bible status\n` +
        `/bible 8hrs\n` +
        `/bible daily`
      );
    }

    if (cmd === "on") {
      setThread(threadID, { enabled: true });
      return ctx.reply("✅ Bible auto verse enabled.");
    }

    if (cmd === "off") {
      setThread(threadID, { enabled: false });
      return ctx.reply("❌ Bible auto verse disabled.");
    }

    if (cmd === "status") {
      return ctx.reply(
        `📖 Status: ${data.enabled ? "ON" : "OFF"}\n` +
        `⏰ Interval: ${data.interval}`
      );
    }

    if (cmd === "8hrs") {
      setThread(threadID, {
        enabled: true,
        interval: "8hrs"
      });

      return ctx.reply("✅ Bible every 8 hours.");
    }

    if (cmd === "daily") {
      setThread(threadID, {
        enabled: true,
        interval: "daily"
      });

      return ctx.reply("✅ Bible daily.");
    }

    return ctx.reply("❌ Invalid option.");
  }
};
