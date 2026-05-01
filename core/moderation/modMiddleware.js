const { getDB } = require("./modStore");

function modMiddleware() {
  return async (ctx, next) => {
    const db = getDB();

    const uid = ctx.senderID;
    const tid = ctx.threadID;

    const user = db.users[uid];
    const thread = db.threads[tid];

    // 👤 GLOBAL BAN
    if (user?.globalBan) return;

    // 💬 THREAD LOCK
    if (thread?.locked) {
      const isAdmin = ctx.permission?.global?.canManageBot;
      if (!isAdmin) return;
    }

    // 💬 THREAD BAN USER
    if (thread?.bannedUsers?.includes(uid)) return;

    return next();
  };
}

module.exports = { modMiddleware };
