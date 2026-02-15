// Generate a consistent random baseline for each day
export function getDailyBaseline(date: Date = new Date()): number {
  // Create a seed from the date (YYYY-MM-DD)
  const dateStr = date.toISOString().split('T')[0];

  // Simple seeded random number generator
  let seed = 0;
  for (let i = 0; i < dateStr.length; i++) {
    seed = (seed * 31 + dateStr.charCodeAt(i)) % 2147483647;
  }

  // Generate number between 52-164
  const min = 52;
  const max = 164;
  const range = max - min + 1;

  return min + (seed % range);
}

export function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}
