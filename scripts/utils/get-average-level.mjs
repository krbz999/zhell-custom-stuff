/**
 * Get the average level of the party.
 * @returns {number}
 */
export default function getAverageLevel() {
  const { sum, count } = game.users.reduce((acc, user) => {
    if (!user.character || user.isGM) return acc;
    const level = user.character.system.details?.level ?? 0;
    return level ? { sum: acc.sum + level, count: acc.count + 1 } : acc;
  }, { sum: 0, count: 0 });

  return sum ? Math.floor(sum / count) : 0;
}
