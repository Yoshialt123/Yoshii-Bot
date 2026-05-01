const fs = require("fs");
const path = require("path");

module.exports = {
  name: "adminlist",
  description: "Show all bot roles",

  async execute(ctx) {
    const file = path.join(process.cwd(), "data/roles.json");

    if (!fs.existsSync(file)) {
      return ctx.reply("❌ No roles database found.");
    }

    let roles = JSON.parse(fs.readFileSync(file, "utf8"));

    const grouped = {
      owner: [],
      admin: [],
      mod: [],
      user: []
    };

    for (const uid in roles) {
      const role = roles[uid] || "user";
      if (!grouped[role]) grouped[role] = [];
      grouped[role].push(uid);
    }

    let msg = "👑 Bot Role List\n\n";

    for (const role of ["owner", "admin", "mod"]) {
      msg += `🔹 ${role.toUpperCase()}\n`;

      if (!grouped[role] || grouped[role].length === 0) {
        msg += "• None\n\n";
        continue;
      }

      grouped[role].forEach((id, i) => {
        msg += `• ${i + 1}. UID: ${id}\n`;
      });

      msg += "\n";
    }

    msg += `📌 Total Users: ${Object.keys(roles).length}`;

    ctx.reply(msg);
  }
};
