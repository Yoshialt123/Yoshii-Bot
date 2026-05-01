const cron = require("node-cron");
const axios = require("axios");
const { load } = require("../core/anidailyStore");

module.exports = {
  name: "anidaily",

  async execute(bot, config) {

    const clientId = config.malClientId;

    async function runAniDaily(debug = false) {

      console.log("📅 AniDaily Triggered");

      const threads = load();

      try {
        const res = await axios.get(
          "https://api.myanimelist.net/v2/anime/ranking",
          {
            headers: {
              "X-MAL-CLIENT-ID": clientId
            },
            params: {
              ranking_type: "bypopularity",
              limit: 50,
              fields:
                "id,title,mean,synopsis,main_picture,genres"
            }
          }
        );

        const list = res.data?.data || [];

        console.log("✅ MAL API OK:", list.length);

        for (const threadID of Object.keys(threads)) {

          const settings = threads[threadID];

          if (!settings.enabled) continue;

          let filtered = list;

          if (settings.genre) {
            filtered = list.filter(a =>
              a.node?.genres?.some(g =>
                g.name.toLowerCase() ===
                settings.genre.toLowerCase()
              )
            );
          }

          if (!filtered.length) {
            console.log(
              "⚠️ No anime for genre:",
              settings.genre
            );
            continue;
          }

          const pick =
            filtered[
              Math.floor(Math.random() * filtered.length)
            ].node;

          const body =
            `📅 Anime of the Day\n\n` +
            `🎌 ${pick.title}\n` +
            `⭐ Score: ${pick.mean || "N/A"}\n\n` +
            `📝 ${pick.synopsis?.slice(0, 250) || "No synopsis"}...\n\n` +
            `🔗 https://myanimelist.net/anime/${pick.id}`;

          let msg = { body };

          if (pick.main_picture?.large) {
            try {
              const img = await axios({
                url: pick.main_picture.large,
                method: "GET",
                responseType: "stream"
              });

              msg.attachment = img.data;

            } catch {}
          }

          await bot.api.sendMessage(msg, threadID);

          console.log(
            "✅ Sent AniDaily to:",
            threadID
          );
        }

      } catch (err) {
        console.error(
          "❌ AniDaily Error:",
          err.message
        );
      }
    }

    // =========================
    // DEBUG TEST NOW
    // =========================
    runAniDaily(true);

    // =========================
    // DAILY 12 PM PH TIME
    // =========================
    cron.schedule(
      "0 12 * * *",
      () => runAniDaily(),
      {
        timezone: "Asia/Manila"
      }
    );

    console.log("✅ AniDaily cron loaded");
  }
};
