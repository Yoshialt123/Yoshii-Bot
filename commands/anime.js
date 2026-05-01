const axios = require("axios");

module.exports = {
  name: "anime",
  description: "Search anime from MyAnimeList",
  usage: "/anime <name>",
  category: "anime",

  async execute(ctx, config) {
    const query = ctx.args.join(" ");

    if (!query) {
      return ctx.reply("❌ Please provide an anime name.\nExample: /anime naruto");
    }

    const clientId = config.malClientId;

    try {
      const res = await axios.get("https://api.myanimelist.net/v2/anime", {
        headers: {
          "X-MAL-CLIENT-ID": clientId
        },
        params: {
          q: query,
          limit: 1,
          fields: "id,title,mean,synopsis,main_picture"
        }
      });

      const anime = res.data?.data?.[0]?.node;

      if (!anime) {
        return ctx.reply("❌ No results found.");
      }

      const imageUrl = anime.main_picture?.large;

      const text =
        `🎌 ${anime.title}\n\n` +
        `⭐ Score: ${anime.mean || "N/A"}\n\n` +
        `📝 ${anime.synopsis?.slice(0, 300) || "No synopsis"}...\n\n` +
        `🔗 https://myanimelist.net/anime/${anime.id}`;

      // 🔥 IMPORTANT: real stream attachment
      if (imageUrl) {
        const imgStream = await axios({
          url: imageUrl,
          method: "GET",
          responseType: "stream"
        }).then(r => r.data);

        return ctx.reply({
          body: text,
          attachment: imgStream
        });
      }

      return ctx.reply(text);

    } catch (err) {
      console.error(err?.response?.data || err.message);
      return ctx.reply("❌ Failed to fetch anime data.");
    }
  }
};
