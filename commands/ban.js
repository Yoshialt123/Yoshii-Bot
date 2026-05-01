const {
  getDB,
  getUser,
  setUser,
  banThreadUser,
  lockThread
} = require("../core/moderation/modStore");

const { extractMentions } = require("../core/moderation/modUtils");
const config = require("../config.json");

function isOwner(id) {
  return String(config.owner) === String(id);
}

function isAdmin(id) {
  return (config.admins || []).map(String).includes(String(id));
}

async function isGroupAdmin(api, tid, uid) {
  try {
    const info = await api.getThreadInfo(tid);
    const admins = (info.adminIDs || []).map(a => String(a.id));
    return admins.includes(String(uid));
  } catch {
    return false;
  }
}

async function isBotAdmin(api, tid) {
  try {
    const info = await api.getThreadInfo(tid);
    const admins = (info.adminIDs || []).map(a => String(a.id));
    const botID = String(api.getCurrentUserID());
    return admins.includes(botID);
  } catch {
    return false;
  }
}

module.exports = {
  name: "ban",
  description: "Ban system (global / thread / list / lock)",
  category: "moderation",
  usage: "/ban @user | /ban @user global | /ban list | /ban thread lock",

  async execute(ctx) {
    const api = ctx.api || global.api;

    const args = (ctx.body || "").trim().split(/\s+/).slice(1);

    const tid = ctx.threadID || ctx.event?.threadID;
    const senderID = String(ctx.senderID || "");

    const db = getDB();
    const now = Date.now();

    const owner = isOwner(senderID);
    const admin = isAdmin(senderID);

    // =========================
    // LIST
    // =========================
    if (args[0] === "list") {
      if (!owner && !admin) {
        return ctx.reply("❌ Admin only.");
      }

      let msg = "🚫 BAN LIST\n━━━━━━━━━━━━━━";

      for (const [id, u] of Object.entries(db.users || {})) {
        if (!u.globalBan && !(u.bannedUntil > now)) continue;

        msg += `\n\n👤 ${u.name || "Unknown"}`;
        msg += `\n🆔 ${id}`;
        msg += `\n🌐 GLOBAL BAN`;
      }

      return ctx.reply(msg || "✅ No bans.");
    }

    // =========================
    // THREAD LOCK
    // =========================
    if (args[0] === "thread" && args[1] === "lock") {
      if (!owner && !admin) {
        return ctx.reply("❌ Admin only.");
      }

      lockThread(tid);
      return ctx.reply("🔒 Thread locked.");
    }

    // =========================
    // TARGET
    // =========================
    const uid =
      extractMentions(ctx)[0] ||
      args[0];

    if (!uid) {
      return ctx.reply("❌ Mention a user.");
    }

    const userData = getUser(uid);

    if (!userData.name && ctx.event?.mentions?.[uid]) {
      userData.name = ctx.event.mentions[uid];
      setUser(uid, userData);
    }

    // =========================
    // GLOBAL BAN (OWNER ONLY)
    // =========================
    if (args.includes("global")) {
      if (!owner) {
        return ctx.reply("❌ Owner only.");
      }

      setUser(uid, {
        globalBan: true,
        bannedUntil: Infinity
      });

      return ctx.reply(`🚫 Global ban applied\n🆔 ${uid}`);
    }

    // =========================
    // THREAD BAN PERMISSION CHECK
    // =========================
    const groupAdmin = await isGroupAdmin(api, tid, senderID);

    if (!owner && !admin && !groupAdmin) {
      return ctx.reply("❌ Group admin only.");
    }

    // =========================
    // APPLY THREAD BAN (ALWAYS STORE FIRST)
    // =========================
    banThreadUser(tid, uid);

    // =========================
    // BOT ADMIN CHECK (FOR KICK)
    // =========================
    const botAdmin = await isBotAdmin(api, tid);

    if (!botAdmin) {
      return ctx.reply(
        `🚫 Banned successfully\n🆔 ${uid}\n⚠️ Bot is NOT admin so cannot kick`
      );
    }

    // =========================
    // TRY KICK
    // =========================
    try {
      await api.removeUserFromGroup(uid, tid);
      return ctx.reply(`🚫 Banned & kicked\n🆔 ${uid}`);
    } catch {
      return ctx.reply(`🚫 Banned but failed to kick\n🆔 ${uid}`);
    }
  }
};
