const { getThread, setThread } = require("../core/anidailyStore");

const genres = [
  "Action",
  "Romance",
  "Comedy",
  "Drama",
  "Fantasy",
  "Horror",
  "Adventure",
  "Sci-Fi",
  "Slice of Life"
];

module.exports = {
  name: "anidaily",
  description: "Toggle anime daily system",
  usage: "/anidaily on|off|genre|list",
  category: "anime",

  async execute(ctx) {
    const threadID = ctx.threadID;
    const args = ctx.args;

    const cmd = args[0];

    if (!cmd) {
      const s = getThread(threadID);
      return ctx.reply(
        `📅 AniDaily Settings\n\n` +
        `Status: ${s.enabled ? "ON" : "OFF"}\n` +
        `Genre: ${s.genre || "Random"}\n\n` +
        `Commands:\n` +
        `/anidaily on\n` +
        `/anidaily off\n` +
        `/anidaily genre <name>\n` +
        `/anidaily list`
      );
    }

    if (cmd === "on") {
      setThread(threadID, { enabled: true });
      return ctx.reply("✅ AniDaily enabled");
    }

    if (cmd === "off") {
      setThread(threadID, { enabled: false });
      return ctx.reply("❌ AniDaily disabled");
    }

    if (cmd === "list") {
      return ctx.reply("🎌 Genres:\n" + genres.join(", "));
    }

    if (cmd === "genre") {
      const genre = args.slice(1).join(" ");

      if (!genres.includes(genre)) {
        return ctx.reply("❌ Invalid genre. Use /anidaily list");
      }

      setThread(threadID, { genre });
      return ctx.reply(`🎯 Genre set to: ${genre}`);
    }

    return ctx.reply("❌ Invalid command");
  }
};
