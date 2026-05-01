const axios = require("axios");

module.exports = {
  name: "ai",
  aliases: ["chat", "gpt", "ask"],
  description: "AI chat with text + image support (prefix or no-prefix)",
  usage:
    "/ai hello\n" +
    "ai hello\n" +
    "/ai describe this (reply to image)\n" +
    "ai solve this + attached image",
  category: "utility",
  noPrefix: true,
  cooldown: 5,

  async execute(ctx) {
    try {
      const body = (ctx.body || "").trim();
      if (!body) return;

      const prefix = "/";
      let ask = "";
      let isAiCall = false;

      // =========================
      // DETECT PREFIX / NO PREFIX
      // =========================
      const valid = ["ai", "chat", "gpt", "ask"];

      if (body.startsWith(prefix)) {
        const parts = body.slice(prefix.length).split(/\s+/);
        const cmd = (parts.shift() || "").toLowerCase();

        if (valid.includes(cmd)) {
          isAiCall = true;
          ask = parts.join(" ").trim();
        }
      } else {
        const parts = body.split(/\s+/);
        const cmd = (parts.shift() || "").toLowerCase();

        if (valid.includes(cmd)) {
          isAiCall = true;
          ask = parts.join(" ").trim();
        }
      }

      if (!isAiCall) return;

      // =========================
      // IMAGE DETECTION
      // =========================
      let imgUrl = "";

      // direct attachment
      const attachments = ctx.event?.attachments || [];

      for (const a of attachments) {
        if (
          a.type === "photo" ||
          a.type === "image"
        ) {
          imgUrl =
            a.url ||
            a.largePreviewUrl ||
            a.previewUrl ||
            "";
          break;
        }
      }

      // reply image
      if (!imgUrl) {
        const replyAttach =
          ctx.event?.messageReply?.attachments || [];

        for (const a of replyAttach) {
          if (
            a.type === "photo" ||
            a.type === "image"
          ) {
            imgUrl =
              a.url ||
              a.largePreviewUrl ||
              a.previewUrl ||
              "";
            break;
          }
        }
      }

      // image only prompt fallback
      if (!ask && imgUrl) {
        ask = "Describe this image.";
      }

      if (!ask) {
        return ctx.reply(
          "❌ Example:\n/ai hello\nai hello\n/ai describe this (reply image)"
        );
      }

      await ctx.reply("🤖 Thinking...");

      const uid = ctx.senderID || "user";

      const res = await axios.get(
        "https://oreo.gleeze.com/api/openai",
        {
          params: {
            ask,
            model: "gpt-4o",
            uid,
            stream: false,
            img_url: imgUrl || ""
          },
          timeout: 45000
        }
      );

      const data = res.data || {};
      const answer =
        data.answer ||
        "No response.";

      let msg =
        `🤖 ${answer}`;

      if (imgUrl) {
        msg += `\n\n🖼️ Vision Mode Enabled`;
      }

      return ctx.reply(msg);

    } catch (err) {
      console.error("AI vision error:", err.message);
      return ctx.reply("❌ Failed to contact AI API.");
    }
  }
};
