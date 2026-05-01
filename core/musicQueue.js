const queues = new Map();

/**
 * queue structure:
 * {
 *   songs: [],
 *   playing: false
 * }
 */

function getQueue(threadID) {
  if (!queues.has(threadID)) {
    queues.set(threadID, { songs: [], playing: false });
  }
  return queues.get(threadID);
}

function addSong(threadID, song) {
  const q = getQueue(threadID);
  q.songs.push(song);
  return q;
}

function nextSong(threadID) {
  const q = getQueue(threadID);
  q.songs.shift();
  return q.songs[0];
}

function clearQueue(threadID) {
  queues.delete(threadID);
}

module.exports = {
  getQueue,
  addSong,
  nextSong,
  clearQueue
};
