const fs = require("fs");
const path = require("path");
const axios = require("axios");

// load your JSON
const welcomeData = require("../data/welcome.json");

module.exports = {
  name: "help",
  description: "Show all commands or info about a specific command",
  usage: "+help [command | page]",
  category: "general",

  async execute(ctx, config) {

    const prefix = config?.prefix || "+";
    const args = (ctx.body || "").trim().split(/\s+/).slice(1);

    const commandsPath = path.join(__dirname);
    const files = fs.readdirSync(commandsPath).filter(f => f.endsWith(".js"));

    const commands = [];

    for (const file of files) {
      try {
        const cmd = require(path.join(commandsPath, file));
        if (cmd?.name) commands.push(cmd);
      } catch (err) {
        console.error(`❌ Failed loading command ${file}`, err);
      }
    }

    // =========================
    // 📌 COMMAND INFO MODE
    // =========================
    if (args[0] && isNaN(args[0]) && args[0].toLowerCase() !== "page") {
      const name = args[0].toLowerCase();
      const cmd = commands.find(c => c.name === name);

      if (!cmd) {
        return ctx.reply("❌ Command not found.");
      }

      return ctx.reply(
        `📌 ${prefix}${cmd.name}\n\n` +
        `📝 Description: ${cmd.description || "No description"}\n` +
        `⚙️ Usage: ${cmd.usage || prefix + cmd.name}\n` +
        `📂 Category: ${cmd.category || "general"}`
      );
    }

    // =========================
    // 📄 PAGE HANDLING
    // =========================
    let page = 1;

    if (args[0]) {
      if (args[0].toLowerCase() === "page" && args[1]) {
        page = parseInt(args[1]);
      } else if (!isNaN(args[0])) {
        page = parseInt(args[0]);
      }
    }

    const perPage = 10;
    const total = commands.length;
    const totalPages = Math.ceil(total / perPage);

    if (totalPages === 0) {
      return ctx.reply("❌ No commands found.");
    }

    if (page < 1) page = 1;
    if (page > totalPages) page = totalPages;

    const start = (page - 1) * perPage;
    const current = commands.slice(start, start + perPage);

    // =========================
    // 💬 RANDOM QUOTE
    // =========================
    const quotes = welcomeData.quotes || [];
    const randomQuote =
      quotes.length > 0
        ? quotes[Math.floor(Math.random() * quotes.length)]
        : null;

    // =========================
    // 🧾 BUILD OUTPUT
    // =========================
    let output = [];

    if (randomQuote) {
      output.push(`💬 ${randomQuote}`);
      output.push("");
    }

    output.push(`📖 COMMANDS (Page ${page}/${totalPages})`);
    output.push("");

    for (const cmd of current) {
      output.push(`📌 ${prefix}${cmd.name}`);
      output.push(`   ➤ ${cmd.description || "No description"}`);
      output.push("");
    }

    output.push(`📊 Total Commands: ${total}`);
    output.push(`➡️ Use "${prefix}help <page>"`);
    output.push(`➡️ Use "${prefix}help <command>"`);

    // =========================
    // 🖼️ RANDOM GIF (OPTIONAL)
    // =========================
    let gifStream = null;

    try {
      const gifs = welcomeData.gifs || [];

      if (gifs.length > 0) {
        const gifUrl = gifs[Math.floor(Math.random() * gifs.length)];

        const res = await axios({
          url: gifUrl,
          method: "GET",
          responseType: "stream",
          timeout: 5000
        });

        gifStream = res.data;
      }
    } catch {
      // silent fail (no spam logs)
    }

    // =========================
    // 📤 SEND
    // =========================
    return ctx.reply({
      body: output.join("\n"),
      attachment: gifStream || undefined
    });
  }
};
