/**
 * Get the average level of the party.
 * @returns {number}
 */
export default function getAverageLevel() {
  const { sum, count } = game.actors.party.system.members.reduce((acc, { actor }) => {
    if (actor.type === "character") {
      acc.sum += actor.system.details.level;
      acc.count++;
    }
    return acc;
  }, { sum: 0, count: 0 });
  return sum ? Math.floor(sum / count) : 0;
}
