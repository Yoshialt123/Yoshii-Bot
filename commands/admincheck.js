const fbAdminSync = require("../core/fbAdminSync");

module.exports = {
  name: "admincheck",

  async execute(ctx) {
    const api = ctx.api || global.api;
    const threadID = ctx.threadID;
    const userID = ctx.senderID;

    // 🔄 force refresh from Facebook
    const fresh = await fbAdminSync.syncThreadAdmins(api, threadID);

    const cached = fbAdminSync.getCachedAdmins(threadID);
    const isAdmin = fbAdminSync.isFBAdmin(threadID, userID);

    return ctx.reply(
      "🧪 ADMIN DEBUG\n\n" +
      "Fresh sync: " + JSON.stringify(fresh) + "\n" +
      "Cached: " + JSON.stringify(cached) + "\n" +
      "You are admin: " + isAdmin
    );
  }
};
