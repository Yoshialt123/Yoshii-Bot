const fs = require("fs");
const path = require("path");

function loadEvents(bot, config) {
  const eventsPath = path.join(__dirname, "../events");

  if (!fs.existsSync(eventsPath)) {
    console.warn("⚠️ No events folder found");
    return;
  }

  const files = fs.readdirSync(eventsPath).filter(f => f.endsWith(".js"));

  files.forEach((file) => {
    const filePath = path.join(eventsPath, file);

    try {
      delete require.cache[require.resolve(filePath)];

      const event = require(filePath);

      if (typeof event?.execute !== "function") {
        console.warn(`⚠️ Invalid event skipped: ${file}`);
        return;
      }

      // isolate execution so it can't crash loader chain
      setImmediate(() => {
        try {
          event.execute(bot, config);
          console.log(`📡 Loaded event: ${file}`);
        } catch (e) {
          console.error(`❌ Runtime event crash: ${file}`, e.message);
        }
      });

    } catch (err) {
      console.error(`❌ Failed loading event ${file}:`, err.message);
    }
  });
}

module.exports = loadEvents;
