const config = require("../config.json");

function isOwner(id) {
  return String(config.owner) === String(id);
}

function isAdmin(id) {
  return (config.admins || []).map(String).includes(String(id));
}

async function getPermission(ctx) {
  const api = ctx.api || global.api;

  const userID = String(ctx.senderID || ctx.event?.senderID || "");
  const threadID = ctx.threadID || ctx.event?.threadID;

  let isGroupAdmin = false;

  try {
    const info = await api.getThreadInfo(threadID);
    const admins = (info.adminIDs || []).map(a => String(a.id));
    isGroupAdmin = admins.includes(userID);
  } catch {}

  return {
    bot: {
      owner: isOwner(userID),
      admin: isAdmin(userID),
      canManage: isOwner(userID) || isAdmin(userID),
      canBroadcast: isOwner(userID) || isAdmin(userID)
    },

    group: {
      admin: isGroupAdmin,
      canKick: isGroupAdmin
    }
  };
}

module.exports = { getPermission };
