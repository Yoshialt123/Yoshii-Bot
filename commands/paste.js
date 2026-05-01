const fs = require("fs");
const path = require("path");
const config = require("../config.json");

// 🔐 BOT ADMIN CHECK ONLY (NOT FB ADMIN)
function isBotAdmin(userID) {
  const id = String(userID);

  if (String(config.owner) === id) return true;
  if (Array.isArray(config.admins) && config.admins.map(String).includes(id)) return true;

  return false;
}

module.exports = {
  name: "paste",
  description: "View the content of a command file (bot admins only)",
  usage: "+paste <filename>",
  category: "admin",

  async execute(ctx) {
    const userID =
      ctx.senderID ||
      ctx.event?.senderID ||
      ctx.event?.authorID;

    if (!isBotAdmin(userID)) {
      return ctx.reply("❌ Bot admin only command.");
    }

    const args = (ctx.body || "").split(" ").slice(1);

    if (!args[0]) {
      return ctx.reply("Usage: +paste <filename>");
    }

    let filename = args[0];

    // =========================
    // 🔒 SECURITY FIX
    // =========================
    if (filename.includes("..") || filename.includes("/")) {
      return ctx.reply("❌ Invalid filename.");
    }

    if (!filename.endsWith(".js")) {
      filename += ".js";
    }

    const filePath = path.join(__dirname, filename);

    if (!fs.existsSync(filePath)) {
      return ctx.reply("❌ File not found.");
    }

    try {
      const content = fs.readFileSync(filePath, "utf8");

      // prevent message too long (Messenger limit)
      const maxLength = 1500;

      if (content.length > maxLength) {
        const parts = content.match(/[\s\S]{1,1500}/g);

        for (const part of parts) {
          await ctx.reply(part);
        }

        return;
      }

      await ctx.reply(content);
    } catch (err) {
      console.error("Paste error:", err);
      ctx.reply("❌ Failed to read file.");
    }
  }
};
