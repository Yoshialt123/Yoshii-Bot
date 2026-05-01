const userMap = new Map();

const DEFAULT_LIMIT = {
  cooldown: 3000
};

// =========================
// CORE CHECK (FIXED)
// =========================
function check(userId, command, cooldown) {
  const key = `${userId}:${command}`;
  const now = Date.now();

  const last = userMap.get(key);

  if (last && now < last) {
    return {
      ok: false,
      remaining: last - now
    };
  }

  // FIX: store timestamp, not future time (cleaner logic)
  userMap.set(key, now + cooldown);

  return { ok: true };
}

// =========================
// MIDDLEWARE WRAPPER
// =========================
function rateLimiterMiddleware(config = {}) {
  return async (ctx, next) => {

    const userId =
      String(ctx.senderID || ctx.event?.senderID || ctx.event?.authorID || "");

    const command =
      ctx.commandName ||
      (ctx.body || "")
        .trim()
        .split(/\s+/)[0]
        ?.replace(/^\+/, "")
        ?.toLowerCase();

    if (!command) return next();

    // =========================
    // ADMIN BYPASS (FIXED SAFE)
    // =========================
    const isAdmin =
      String(config.owner) === userId ||
      (Array.isArray(config.admins) &&
        config.admins.map(String).includes(userId));

    if (isAdmin) return next();

    // =========================
    // COOLDOWN RESOLVE
    // =========================
    const cooldown =
      config.cooldowns?.[command] ??
      DEFAULT_LIMIT.cooldown;

    const result = check(userId, command, cooldown);

    if (!result.ok) {
      return ctx.reply?.(
        `⏳ Slow down (${Math.ceil(result.remaining / 1000)}s)`
      );
    }

    return next();
  };
}

module.exports = {
  rateLimiterMiddleware
};
