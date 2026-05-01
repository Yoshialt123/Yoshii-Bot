const { getPermission } = require("./permissions");
const { rateLimit } = require("./smartRateLimiter");

// =========================
// MODSTORE SAFE IMPORT
// =========================
let modStore = {};

try {
  modStore = require("./moderation/modStore") || {};
} catch {
  console.warn("⚠️ modStore not found");
}

const isThreadBanned = modStore.isThreadBanned || (() => false);
const isThreadLocked = modStore.isThreadLocked || (() => false);
const banThreadUser = modStore.banThreadUser || (() => {});

// =========================
// PIPELINE
// =========================
function createPipeline(bot, config, commandsMap) {

  const prefix = config.prefix || "+";

  const cooldown = new Map();
  const lockMsg = new Map();

  const now = () => Date.now();

  function canReply(uid, ms = 8000) {
    const last = cooldown.get(uid) || 0;
    if (now() - last < ms) return false;
    cooldown.set(uid, now());
    return true;
  }

  // =========================
  // 1. NORMALIZER + COMMAND RESOLVE (FIXED)
  // =========================
  bot.use(async (ctx, next) => {

    const raw = (ctx.body || ctx.event?.body || "").trim();
    ctx.body = typeof raw === "string" ? raw : "";

    const parts = ctx.body.split(/\s+/).filter(Boolean);

    ctx.args = parts.slice(1);
    ctx.commandName = null;
    ctx.isCommand = false;
    ctx.resolvedCmd = null;

    if (!ctx.body) return next();

    const first = parts[0] || "";
    const firstLower = first.toLowerCase();

    let cmd = null;

    // =========================
    // PREFIX COMMAND
    // =========================
    if (first.startsWith(prefix)) {

      const name = first.slice(prefix.length).toLowerCase();

      cmd =
        commandsMap.get(name) ||
        [...commandsMap.values()].find(c => c.aliases?.includes(name));

      if (cmd) {
        ctx.isCommand = true;
        ctx.commandName = cmd.name;
        ctx.resolvedCmd = cmd;
      }
    }

    // =========================
    // NO PREFIX COMMAND
    // =========================
    if (!cmd) {

      cmd =
        commandsMap.get(firstLower) ||
        [...commandsMap.values()].find(c => c.aliases?.includes(firstLower));

      if (cmd && cmd.noPrefix) {
        ctx.isCommand = true;
        ctx.commandName = cmd.name;
        ctx.resolvedCmd = cmd;
      }
    }

    return next();
  });

  // =========================
  // 2. PERMISSIONS
  // =========================
  bot.use(async (ctx, next) => {
    try {
      ctx.permission = await getPermission(ctx, config);
    } catch {
      ctx.permission = {
        bot: { owner: false, admin: false, canManage: false },
        group: { admin: false, canKick: false }
      };
    }

    return next();
  });

  // =========================
  // 3. SECURITY
  // =========================
  bot.use(async (ctx, next) => {

    const tid = ctx.threadID || ctx.event?.threadID;
    const uid = ctx.senderID;

    if (!tid || !uid) return next();

    const perm = ctx.permission;

    const isAdmin =
      perm?.bot?.owner ||
      perm?.bot?.admin ||
      perm?.group?.admin;

    if (isThreadLocked(tid) && !isAdmin) {

      const key = `lock_${tid}`;
      const last = lockMsg.get(key) || 0;

      if (now() - last > 10000) {
        lockMsg.set(key, now());
        await ctx.reply("🔒 Thread is locked.");
      }

      return;
    }

    if (isThreadBanned(tid, uid)) {
      try {
        await bot.api?.removeUserFromGroup(uid, tid);
      } catch {}
      return;
    }

    return next();
  });

  // =========================
  // 4. RATE LIMIT
  // =========================
  bot.use(async (ctx, next) => {

    if (!ctx.body) return next();
    if (ctx.permission?.bot?.canManage) return next();

    const rl = rateLimit(ctx);

    if (!rl || rl.ok) return next();

    if (rl.warn) return ctx.reply("⚠️ Stop spamming.");

    if (rl.ban) {

      const uid = ctx.senderID;
      const tid = ctx.threadID;

      try { banThreadUser(tid, uid); } catch {}

      try {
        await bot.api?.removeUserFromGroup(uid, tid);
      } catch {}

      return ctx.reply("🚫 Banned");
    }

    return next();
  });

  // =========================
  // 5. COMMAND EXECUTOR (FIXED)
  // =========================
  bot.use(async (ctx, next) => {

    if (!ctx.isCommand) return next();

    const cmd = ctx.resolvedCmd;

    if (!cmd) return next();

    try {

      if (cmd.adminOnly && !ctx.permission?.bot?.canManage) {
        return ctx.reply("❌ Admin only");
      }

      await cmd.execute(ctx, config);

    } catch (err) {
      console.error(`❌ Command error: ${cmd.name}`, err);
      return ctx.reply("❌ Command crashed");
    }

    return next();
  });

  // =========================
  // 6. COMMAND NOT FOUND FIX (🔥 IMPORTANT)
  // =========================
  bot.use(async (ctx, next) => {

    const body = (ctx.body || "").trim();
    if (!body) return next();

    const first = body.split(/\s+/)[0];

    if (first.startsWith(prefix) && !ctx.isCommand) {
      return ctx.reply("❌ Command not found.");
    }

    return next();
  });

  // =========================
  // 7. AI FALLBACK (OPTIONAL SAFE)
  // =========================
  bot.use(async (ctx, next) => {

    const body = (ctx.body || "").trim();

    if (!body || ctx.isCommand || body.startsWith(prefix)) {
      return next();
    }

    if (!canReply(ctx.senderID)) return;

    return next();
  });

}

module.exports = { createPipeline };
