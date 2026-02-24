/**
 * Returns a YYYY-MM-DD string in the given timezone.
 * @param timeZone IANA timezone string (e.g. "America/New_York")
 * @param offsetDays Number of days to offset (0 = today, -1 = yesterday)
 */
export function getDateString(timeZone: string, offsetDays = 0): string {
  const now = new Date();
  now.setDate(now.getUTCDate() + offsetDays);

  return now.toLocaleDateString('en-CA', { timeZone });
}
