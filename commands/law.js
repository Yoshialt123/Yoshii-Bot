const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  name: "law",
  aliases: ["48laws", "power"],
  noPrefix: true,
  cooldown: 5,
  description: "48 Laws of Power",
  usage:
    "law 8\n" +
    "/law 8\n" +
    "law random",

  async execute(ctx) {
    try {
      const args = ctx.args || [];

      let number = args[0];

      // =========================
      // RANDOM
      // =========================
      if (!number || number === "random") {
        number =
          Math.floor(
            Math.random() * 48
          ) + 1;
      }

      number = String(number)
        .replace(/\D/g, "");

      if (
        !number ||
        Number(number) < 1 ||
        Number(number) > 48
      ) {
        return ctx.reply(
          "❌ Use: law 1-48\nExample: law 8"
        );
      }

      // =========================
      // API FETCH
      // =========================
      const res =
        await axios.get(
          "https://oreo.gleeze.com/api/law",
          {
            params: {
              number
            },
            timeout: 20000
          }
        );

      const data =
        res.data || {};

      if (!data.title) {
        return ctx.reply(
          "❌ Law not found."
        );
      }

      // =========================
      // GIF FROM welcome.json
      // =========================
      let attachment = null;

      try {
        const file = path.join(
          __dirname,
          "../data/welcome.json"
        );

        if (
          fs.existsSync(file)
        ) {
          const raw =
            fs.readFileSync(
              file,
              "utf8"
            );

          const json =
            JSON.parse(raw);

          let gifs = [];

          if (
            Array.isArray(json)
          ) {
            gifs = json;
          } else if (
            Array.isArray(
              json.gifs
            )
          ) {
            gifs = json.gifs;
          } else if (
            Array.isArray(
              json.links
            )
          ) {
            gifs = json.links;
          }

          if (
            gifs.length
          ) {
            const pick =
              gifs[
                Math.floor(
                  Math.random() *
                    gifs.length
                )
              ];

            const gif =
              await axios({
                url: pick,
                method: "GET",
                responseType:
                  "stream",
                timeout: 20000
              });

            attachment =
              gif.data;
          }
        }
      } catch {}

      // =========================
      // MESSAGE
      // =========================
      const msg =
        `📜 Law ${data.code}\n\n` +
        `👑 ${data.title}\n\n` +
        `${data.law}`;

      return ctx.reply(
        attachment
          ? {
              body: msg,
              attachment
            }
          : msg
      );

    } catch (err) {
      console.error(
        "law cmd error:",
        err.message
      );

      return ctx.reply(
        "❌ Failed to fetch law."
      );
    }
  }
};
