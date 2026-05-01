// core/tax.js

const jackpot = require("./jackpot");

// 🎯 take small tax on wins
function applyWinTax(amount) {
  const taxRate = 0.05; // 5%
  return Math.floor(amount * (1 - taxRate));
}

// 💥 send part of loss to jackpot
function applyLossToJackpot(bet) {
  const percent = 0.5; // 50% goes to jackpot

  const contribution = Math.floor(bet * percent);

  jackpot.add(contribution);

  return contribution;
}

module.exports = {
  applyWinTax,
  applyLossToJackpot
};
