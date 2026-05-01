const fs = require("fs");
const path = require("path");

const file = path.join(process.cwd(), "data", "threads.json");

module.exports = {
  name: "leave",

  async execute(bot, event) {
    try {
      if (event.logMessageType !== "log:unsubscribe") return;

      const botID = bot.api.getCurrentUserID();
      const leftID = event.logMessageData?.leftParticipantFbId;

      // ✅ only trigger if BOT was removed
      if (String(leftID) !== String(botID)) return;

      console.log("🚪 Bot removed from:", event.threadID);

      // OPTIONAL: mark inactive (this is the ONLY place allowed)
      if (fs.existsSync(file)) {
        const db = JSON.parse(fs.readFileSync(file, "utf8"));

        if (db[event.threadID]) {
          db[event.threadID].active = false;
        }

        fs.writeFileSync(file, JSON.stringify(db, null, 2));
      }

    } catch (err) {
      console.error("Leave event error:", err);
    }
  }
};
