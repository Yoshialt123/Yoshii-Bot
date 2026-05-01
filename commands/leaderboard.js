const fs = require("fs");
const path = require("path");

const DB = path.join(__dirname, "../data/economy.json");

module.exports = {
  name: "leaderboard",
  aliases: ["lb", "top"],
  description: "Global Leaderboard",
  usage: "/leaderboard",
  category: "economy",

  async execute(ctx) {
    try {
      const db = JSON.parse(fs.readFileSync(DB, "utf8"));

      // =========================
      // FILTER REAL PLAYERS ONLY
      // =========================
      const players = Object.entries(db)
        .filter(([id, u]) => {

          if (!u) return false;

          if (typeof u.money !== "number") return false;

          // ❌ remove default users (never played)
          const isDefault =
            u.money === 1000 &&
            (!u.bank || u.bank === 0) &&
            (!u.inventory || Object.keys(u.inventory).length === 0) &&
            !u.lastWork &&
            !u.lastDaily;

          return !isDefault;
        });

      if (!players.length) {
        return ctx.reply("❌ No active players yet.");
      }

      // =========================
      // SORT BY MONEY
      // =========================
      const top = players
        .sort((a, b) => b[1].money - a[1].money)
        .slice(0, 10); // 🔥 change to 15 if you want

      const ids = top.map(([id]) => id);

      // =========================
      // FETCH USER NAMES
      // =========================
      let users = {};
      try {
        users = await ctx.bot.api.getUserInfo(ids);
      } catch (err) {
        console.error("Name fetch error:", err);
      }

      // =========================
      // BUILD MESSAGE
      // =========================
      let msg =
`🏆══════════════════════🏆
      GLOBAL LEADERBOARD
🏆══════════════════════🏆\n\n`;

      let rank = 1;

      for (const [id, u] of top) {

        let name = users?.[id]?.name;

        // ❌ skip unknown completely
        if (!name || name === "Unknown") continue;

        const crown = rank === 1 ? "👑 " : "";

        msg +=
`${crown}#${rank} ${name}
💰 ₱${(u.money || 0).toLocaleString()}
⭐ Level ${u.level || 1}
────────────────────\n`;

        rank++;
      }

      msg += `\n🔥 Top Users`;

      return ctx.reply(msg);

    } catch (err) {
      console.error("Leaderboard error:", err);
      return ctx.reply("❌ Failed to load leaderboard.");
    }
  }
};
