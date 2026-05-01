module.exports = {
  name: "ping",
  description: "Check bot latency",
  usage: "+ping",

  async execute(ctx) {
    ctx.reply("pong 🏓");
  }
};
