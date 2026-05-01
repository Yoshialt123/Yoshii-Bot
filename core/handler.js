const fs = require("fs");
const path = require("path");

// Load all commands once (auto-register)
function loadCommands() {
  const commands = new Map();

  const files = fs.readdirSync(path.join(__dirname, "../commands"))
    .filter(f => f.endsWith(".js"));

  for (const file of files) {
    try {
      const cmd = require(path.join(__dirname, "../commands", file));

      if (cmd?.name && typeof cmd.execute === "function") {
        commands.set(cmd.name, cmd);
      }
    } catch (err) {
      console.error(`❌ Failed to load command ${file}:`, err.message);
    }
  }

  return commands;
}

const commands = loadCommands();

// MAIN HANDLER
module.exports = async function handler(ctx, config) {
  const prefix = config.prefix || "+";
  const body = ctx.body || "";

  // ignore non-command messages
  if (!body.startsWith(prefix)) return;

  // parse command
  const parts = body.slice(prefix.length).trim().split(/\s+/);
  const name = parts.shift()?.toLowerCase();

  if (!name) return;

  const cmd =
    commands.get(name) ||
    [...commands.values()].find(c => c.aliases?.includes(name));

  // fallback if command not found
  if (!cmd) {
    return ctx.reply(`❌ Unknown command. Use ${prefix}help`);
  }

  // attach args to ctx
  ctx.args = parts;

  try {
    await cmd.execute(ctx, config);
  } catch (err) {
    console.error(`❌ Command error (${name}):`, err);
    ctx.reply("❌ Something went wrong while running this command.");
  }
};
