function now() {
  return Date.now();
}

function getDuration(strikes) {
  if (strikes === 1) return 24 * 60 * 60 * 1000;
  if (strikes === 2) return 3 * 24 * 60 * 60 * 1000;
  return Infinity;
}

function extractMentions(ctx) {
  return Object.keys(ctx.event?.mentions || {});
}

module.exports = { now, getDuration, extractMentions };
