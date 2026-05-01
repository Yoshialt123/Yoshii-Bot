module.exports = {
  name: "uid",
  aliases: ["id", "myid"],

  async execute(ctx) {

    const event = ctx.event || ctx;

    // =========================
    // SAFE API RESOLUTION
    // =========================
    const api =
      ctx.api ||
      ctx.client?.api ||
      global.api;

    if (!api || !api.sendMessage) {
      console.error("❌ API is missing in UID command");
      return;
    }

    // =========================
    // MENTION HANDLING
    // =========================
    const mentions = event.mentions ? Object.keys(event.mentions) : [];

    if (mentions.length > 0) {
      let msg = "📌 User IDs:\n\n";

      for (const uid of mentions) {
        msg += `${event.mentions[uid]}: ${uid}\n`;
      }

      return api.sendMessage(msg, event.threadID, event.messageID);
    }

    // =========================
    // SELF UID
    // =========================
    const userID =
      event.senderID ||
      event.userID ||
      event.authorID;

    return api.sendMessage(
      `🆔 Your UID: ${userID}`,
      event.threadID,
      event.messageID
    );
  }
};
