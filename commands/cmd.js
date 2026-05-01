const fs = require("fs");
const path = require("path");
const axios = require("axios");

const config = require("../config.json");

const COMMANDS_DIR = path.join(__dirname, "../commands");

// =========================
// OWNER CHECK
// =========================
function isOwner(id) {
  return String(config.owner) === String(id);
}

// =========================
// BASIC VALIDATION
// =========================
function validateCommand(code) {
  try {
    // reject accidental CLI commands injected into file
    if (code.trim().startsWith("/cmd")) {
      throw new Error("Do not save CLI command text inside file");
    }

    // must contain module.exports
    if (!code.includes("module.exports")) {
      throw new Error("Missing module.exports");
    }

    return true;
  } catch (err) {
    throw err;
  }
}

// =========================
// FETCH URL CODE
// =========================
async function fetchCode(url) {
  const res = await axios.get(url, {
    timeout: 20000,
    headers: {
      "User-Agent": "Mozilla/5.0"
    }
  });

  if (typeof res.data !== "string") {
    throw new Error("Invalid code response");
  }

  return res.data;
}

// =========================
// CLEAN CODE (IMPORTANT FIX)
// =========================
function cleanCode(raw) {
  return raw
    .replace(/^\/cmd\s+\w+\s+\w+\s*/i, "") // removes "/cmd add kick"
    .replace(/^\/cmd\s+\w+\s*/i, "")      // safety fallback
    .trim();
}

// =========================
// CMD SYSTEM
// =========================
module.exports = {
  name: "cmd",
  category: "owner",
  usage:
    "/cmd add <name> (reply with code)\n" +
    "/cmd url <name> <raw_url>\n" +
    "/cmd del <name>\n" +
    "/cmd reload",

  async execute(ctx) {
    const uid = String(ctx.senderID);

    if (!isOwner(uid)) {
      return ctx.reply("❌ Owner only.");
    }

    const [action, name, ...rest] = ctx.args;
    const cmdName = (name || "").toLowerCase();

    const filePath = path.join(COMMANDS_DIR, `${cmdName}.js`);

    // =========================
    // ADD COMMAND
    // =========================
    if (action === "add") {
      let code =
        rest.join(" ") ||
        ctx.event?.messageReply?.body ||
        "";

      if (!cmdName || !code) {
        return ctx.reply("❌ Usage: /cmd add <name> (reply with code)");
      }

      code = cleanCode(code);

      try {
        validateCommand(code);

        fs.writeFileSync(filePath, code, "utf8");

        // test require safely
        delete require.cache[require.resolve(filePath)];
        require(filePath);

        return ctx.reply(`✅ Command "${cmdName}" installed.`);
      } catch (err) {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }

        return ctx.reply("❌ Invalid command code:\n" + err.message);
      }
    }

    // =========================
    // URL INSTALL
    // =========================
    if (action === "url") {
      const url = rest[0];

      if (!cmdName || !url) {
        return ctx.reply("❌ Usage: /cmd url <name> <raw_url>");
      }

      try {
        const code = cleanCode(await fetchCode(url));

        validateCommand(code);

        fs.writeFileSync(filePath, code, "utf8");

        delete require.cache[require.resolve(filePath)];
        require(filePath);

        return ctx.reply(`✅ Command "${cmdName}" installed from URL.`);
      } catch (err) {
        return ctx.reply("❌ Failed:\n" + err.message);
      }
    }

    // =========================
    // DELETE COMMAND
    // =========================
    if (action === "del") {
      if (!cmdName) {
        return ctx.reply("❌ Usage: /cmd del <name>");
      }

      if (!fs.existsSync(filePath)) {
        return ctx.reply("❌ Command not found.");
      }

      fs.unlinkSync(filePath);

      return ctx.reply(`🗑️ Deleted "${cmdName}"`);
    }

    // =========================
    // RELOAD COMMANDS
    // =========================
    if (action === "reload") {
      Object.keys(require.cache).forEach((key) => {
        if (key.includes("/commands/")) {
          delete require.cache[key];
        }
      });

      return ctx.reply("🔄 Commands reloaded");
    }

    // =========================
    // HELP
    // =========================
    return ctx.reply(
      "🛠 CMD SYSTEM\n\n" +
      "/cmd add <name> (reply code)\n" +
      "/cmd url <name> <url>\n" +
      "/cmd del <name>\n" +
      "/cmd reload"
    );
  }
};
