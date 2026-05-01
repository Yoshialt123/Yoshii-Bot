// ============================================
// FILE: events/bible.js
// ============================================

const cron = require("node-cron");
const axios = require("axios");

const {
  getAllThreads,
  setThread
} = require("../core/bibleStore");

module.exports = {
  name: "bible",

  async execute(bot) {
    console.log("📖 Bible event loaded");

    cron.schedule("* * * * *", async () => {

      try {
        const db = getAllThreads();

        const now = new Date();
        const minute = now.getMinutes();
        const hour = now.getHours();

        // ⛔ ONLY run at exact minute 0
        if (minute !== 0) return;

        for (const threadID of Object.keys(db)) {
          const t = db[threadID];

          if (!t.enabled) continue;

          // =========================
          // TIME RULES
          // =========================

          // 8 HOURS → 0, 8, 16
          if (t.interval === "8hours") {
            if (![0, 8, 16].includes(hour)) continue;
          }

          // DAILY → 8 AM only
          if (t.interval === "daily") {
            if (hour !== 8) continue;
          }

          try {
            const res = await axios.get(
              "https://vern-rest-api.vercel.app/api/bible",
              { timeout: 15000 }
            );

            const data = res.data || {};
            const ref = data.reference || "Unknown Verse";
            const verse = data.verse || "No verse found.";

            // ⛔ prevent duplicate spam
            if (t.lastVerse === ref) continue;

            const body =
              `📖 Bible Verse\n\n` +
              `📍 ${ref}\n\n` +
              `${verse}\n🙏`;

            await bot.api.sendMessage(body, threadID);

            setThread(threadID, {
              lastVerse: ref
            });

            console.log(`✅ Sent to ${threadID}`);

          } catch (err) {
            console.log(`❌ Failed ${threadID}`);
          }
        }

      } catch (err) {
        console.log("❌ Bible error:", err.message);
      }

    });
  }
};
