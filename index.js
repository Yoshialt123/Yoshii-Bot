const { createMessengerBot } = require("@dongdev/fca-unofficial");

const loadCommands = require("./core/commandLoader");
const loadEvents = require("./core/eventLoader");
const { createPipeline } = require("./core/pipeline");

const { addThread } = require("./core/threadStore");

const config = require("./config.json");

async function start() {

  const bot = await createMessengerBot(
    { appState: require("./appstate.json") },
    {
      listenEvents: true,
      enableComposer: true,
      commandPrefix: config.prefix || "+",
      selfListen: false
    }
  );

  console.log("✅ Bot online");

  global.bot = bot;
  global.api = bot.api;
  global.config = config;

  // =========================
  // COMMAND SYSTEM
  // =========================
  const commandsMap = loadCommands();

  // =========================
  // PIPELINE (commands + security + rate limit)
  // =========================
  createPipeline(bot, config, commandsMap);

  // =========================
  // AUTO EVENTS LOADER (🔥 IMPORTANT FIX)
  // =========================
  loadEvents(bot, config);

  // =========================
  // THREAD TRACKER (AUTO STORE NEW THREADS)
  // =========================
  const seenThreads = new Set();

  bot.on("messageCreate", (event) => {
    if (!event?.threadID) return;

    if (seenThreads.has(event.threadID)) return;

    seenThreads.add(event.threadID);
    addThread(event.threadID);
  });

  // =========================
  // GLOBAL ERROR HANDLER
  // =========================
  bot.on("error", (err) => {
    console.error("❌ Bot error:", err);
  });

  bot.on("ready", () => {
    console.log("📡 Bot ready & listening");
  });

}

start();
