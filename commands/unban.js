// commands/unban.js

const {
  getDB,
  setUser,
  unlockThread,
  save
} = require("../core/moderation/modStore");

const { extractMentions } = require("../core/moderation/modUtils");

module.exports = {
  name: "unban",
  description: "Unban system",
  usage: "unban @user | unban <uid> | unban thread unlock",
  category: "moderation",

  async execute(ctx) {

    const args = (ctx.body || "").trim().split(/\s+/).slice(1);
    const db = getDB();

    const uid = extractMentions(ctx)[0] || args[0];
    const tid = ctx.threadID || ctx.event?.threadID;

    // =========================
    // THREAD UNLOCK
    // =========================
    if (args[0] === "thread" && args[1] === "unlock") {
      unlockThread(tid);
      return ctx.reply("🔓 Thread unlocked.");
    }

    // =========================
    // USER UNBAN
    // =========================
    if (!uid) {
      return ctx.reply("❌ Provide user.");
    }

    // FULL RESET (spam + bans)
    setUser(uid, {
      globalBan: false,
      bannedUntil: 0,
      strikes: 0,
      warned: false,
      lastMessages: [],
      lastSeen: 0
    });

    // remove from all thread bans
    for (const thread of Object.values(db.threads || {})) {
      if (Array.isArray(thread.banned)) {
        thread.banned = thread.banned.filter(x => x !== uid);
      }
    }

    if (save) save();

    return ctx.reply(
      `✅ Fully unbanned\n🆔 ${uid}`
    );
  }
};
