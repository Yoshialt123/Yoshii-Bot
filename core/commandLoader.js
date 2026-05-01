const fs = require("fs");
const path = require("path");

function loadCommands() {
  const commandsPath = path.join(__dirname, "../commands");
  const files = fs.readdirSync(commandsPath).filter(f => f.endsWith(".js"));

  const commands = new Map();

  for (const file of files) {
    const cmd = require(path.join(commandsPath, file));

    if (!cmd.name || !cmd.execute) continue;

    commands.set(cmd.name, cmd);

    console.log(`✅ Loaded command: ${cmd.name}`);
  }

  return commands;
}

module.exports = loadCommands;
