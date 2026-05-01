const { getPermission } = require("../core/permissions");

module.exports = {
  name: "unsend",
  aliases: ["delete", "remove"],
  description: "Unsend bot message by replying to it",
  usage: "/unsend (reply to bot message)",
  category: "moderation",

  async execute(ctx, config) {
    try {
      const api = ctx.api || global.api;

      const threadID =
        ctx.threadID || ctx.event?.threadID;

      const reply =
        ctx.event?.messageReply;

      // =========================
      // PERMISSION
      // =========================
      const perm =
        await getPermission(
          ctx,
          config
        );

      const allowed =
        perm?.global?.canManageBot ||
        perm?.thread?.isAdmin;

      if (!allowed) {
        return ctx.reply(
          "❌ Only bot admins or group admins can use this."
        );
      }

      // =========================
      // MUST REPLY
      // =========================
      if (!reply) {
        return ctx.reply(
          "❌ Reply to a bot message."
        );
      }

      const botID =
        String(
          api.getCurrentUserID()
        );

      const sender =
        String(
          reply.senderID ||
          reply.authorID ||
          ""
        );

      if (sender !== botID) {
        return ctx.reply(
          "❌ You can only unsend bot messages."
        );
      }

      const messageID =
        reply.messageID ||
        reply.messageId;

      if (!messageID) {
        return ctx.reply(
          "❌ Missing messageID."
        );
      }

      // =========================
      // FCA VERSION NEEDS BOTH
      // messageID + threadID
      // =========================
      await api.unsendMessage(
        messageID,
        threadID
      );

    } catch (err) {
      console.error(
        "unsend error:",
        err
      );

      return ctx.reply(
        "❌ Failed to unsend message."
      );
    }
  }
};
