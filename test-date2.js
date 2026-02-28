const d = new Date('2026-02-27T00:00:00+08:00'); // Let's say it's Feb 27 in local time
console.log(d.toISOString().slice(0, 7));

const now = new Date('2026-03-01T07:14:00+08:00'); // The time in the screenshot
console.log(now.toISOString().slice(0, 7));
