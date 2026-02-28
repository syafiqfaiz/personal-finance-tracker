/**
 * Returns the "YYYY-MM" string based on the local timezone,
 * avoiding the UTC shift issue of date.toISOString().slice(0, 7)
 */
export const getLocalMonthPeriod = (date: Date = new Date()): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${year}-${month}`;
};
