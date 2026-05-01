const axios = require("axios");
const fs = require("fs");
const path = require("path");

const { addThread } = require("../core/threadStore");
const { syncThreadAdmins } = require("../core/fbAdminSync");

// load welcome config
const welcomeData = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../data/welcome.json"), "utf8")
);

const pick = (arr = []) =>
  arr.length ? arr[Math.floor(Math.random() * arr.length)] : null;

module.exports = {
  name: "threadUpdate",

  async execute(bot, event, config) {
    try {

      const type =
        event.logMessageType ||
        event.type ||
        event.logMessage?.type;

      const api = bot.api;
      const botID = api?.getCurrentUserID?.();

      if (!botID) return;

      // =========================
      // GET GROUP NAME
      // =========================
      let groupName = "this group";

      try {
        const info = await api.getThreadInfo(event.threadID);
        groupName = info.threadName || "this group";
      } catch {}

      // =========================
      // BOT ADDED TO GROUP
      // =========================
      if (type === "log:subscribe") {

        const added =
          event.logMessageData?.addedParticipants ||
          event.addedParticipants ||
          [];

        const isBotAdded = added.some(u =>
          String(u.userId || u.userFbId || u.userID) === String(botID)
        );

        if (!isBotAdded) return;

        // =========================
        // CORE SETUP
        // =========================
        addThread(event.threadID);
        await syncThreadAdmins(api, event.threadID);

        const prefix = config.prefix || "+";
        const botName = config.bot?.name || "Bot";

        // =========================
        // 🔥 SET NICKNAME (FIX)
        // =========================
        try {
          const template =
            config.bot?.nicknameTemplate || "{name} | {prefix}";

          const nickname = template
            .replace("{name}", botName)
            .replace("{prefix}", prefix);

          await api.changeNickname(
            nickname,
            event.threadID,
            botID
          );

        } catch (err) {
          console.log("⚠️ Nickname failed (likely no admin):", err.message);
        }

        // =========================
        // GIF FETCH (SAFE)
        // =========================
        let stream = null;

        try {
          const gifUrl = pick(welcomeData.gifs);

          if (gifUrl) {
            const res = await axios({
              url: gifUrl,
              method: "GET",
              responseType: "stream",
              headers: {
                "User-Agent": "Mozilla/5.0"
              }
            });

            stream = res.data;
          }

        } catch (err) {
          console.log("⚠️ GIF failed:", err.message);
        }

        // =========================
        // MESSAGE CONTENT
        // =========================
        const body = [
          pick(welcomeData.greetings),
          "",
          `💬 Welcome to ${groupName}`,
          `🤖 I'm ${botName}`,
          `⚡ Prefix: ${prefix}`,
          "",
          `🧠 ${pick(welcomeData.quotes)}`
        ].join("\n");

        return api.sendMessage(
          {
            body,
            attachment: stream || undefined
          },
          event.threadID
        );
      }

      // =========================
      // ADMIN / GROUP CHANGES
      // =========================
      if (
        type === "log:unsubscribe" ||
        type === "log:thread-admins"
      ) {
        await syncThreadAdmins(api, event.threadID);
      }

    } catch (err) {
      console.error("❌ threadUpdate error:", err);
    }
  }
};
