// commands/yt.js
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const pending = new Map(); // messageID => { senderID, threadID, results }

module.exports = {
  name: "yt",
  aliases: ["youtube"],
  description: "Search YouTube and reply with number",
  usage: "/yt <search>",
  category: "media",

  async execute(ctx, config) {
    const api = ctx.api || global.api;
    const threadID = ctx.threadID;
    const senderID = ctx.senderID;
    const args = ctx.args || [];

    const query = args.join(" ").trim();

    if (!query) {
      return ctx.reply("❌ Usage: /yt <search>");
    }

    try {
      const url =
        "https://oreo.gleeze.com/api/youtube?search=" +
        encodeURIComponent(query) +
        "&stream=false&limit=5&page=1";

      const res = await axios.get(url, {
        timeout: 15000
      });

      const list = Array.isArray(res.data)
        ? res.data.filter(v => v.type === "video").slice(0, 5)
        : [];

      if (!list.length) {
        return ctx.reply("❌ No results found.");
      }

      let msg = `🎬 YouTube Results for: ${query}\n\n`;

      list.forEach((v, i) => {
        msg += `${i + 1}. ${v.title}\n`;
        msg += `⏱ ${v.timestamp || "?"}\n`;
        msg += `👤 ${v.author?.name || "Unknown"}\n\n`;
      });

      msg += "↩️ Reply with number (1-5)";

      api.sendMessage(msg, threadID, (err, info) => {
        if (err || !info?.messageID) return;

        pending.set(info.messageID, {
          senderID,
          threadID,
          results: list
        });

        setTimeout(() => {
          pending.delete(info.messageID);
        }, 120000);
      });
    } catch (err) {
      console.log("yt search error:", err.message);
      return ctx.reply("❌ Search failed.");
    }
  },

  async onReply(ctx) {
    const api = ctx.api || global.api;

    const replyID = ctx.event?.messageReply?.messageID;
    if (!replyID) return;

    const data = pending.get(replyID);
    if (!data) return;

    if (String(ctx.senderID) !== String(data.senderID)) {
      return;
    }

    const pick = parseInt((ctx.body || "").trim());

    if (isNaN(pick) || pick < 1 || pick > data.results.length) {
      return ctx.reply("❌ Reply only number 1-5");
    }

    const video = data.results[pick - 1];
    pending.delete(replyID);

    let msg =
      `🎬 ${video.title}\n\n` +
      `▶️ Watch:\n${video.url}\n\n` +
      `📥 Video:\n${video.play}\n\n` +
      `🎵 Audio:\n${video.audio}`;

    // short videos try upload directly
    try {
      if ((video.seconds || 0) <= 600 && video.play) {
        const temp = path.join(
          __dirname,
          `yt_${Date.now()}.mp4`
        );

        const stream = await axios({
          url: video.play,
          method: "GET",
          responseType: "stream",
          timeout: 30000
        });

        const writer = fs.createWriteStream(temp);

        stream.data.pipe(writer);

        writer.on("finish", () => {
          api.sendMessage(
            {
              body: msg,
              attachment: fs.createReadStream(temp)
            },
            data.threadID,
            () => fs.unlink(temp, () => {})
          );
        });

        writer.on("error", () => {
          ctx.reply(msg);
        });

        return;
      }
    } catch (err) {
      console.log("upload fail:", err.message);
    }

    return ctx.reply(msg);
  }
};
