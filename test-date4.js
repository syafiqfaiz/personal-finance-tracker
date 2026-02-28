// My test-date3 node environment might be in UTC timezone itself!
// Let's force a timezone to simulate the user's browser in Malaysia.
process.env.TZ = 'Asia/Kuala_Lumpur';
const d = new Date('2026-03-01T07:14:00+08:00'); // Explicitly March 1st 7:14 AM MYT

console.log("Local Month Name:", d.toLocaleString('default', { month: 'long' }));
console.log("Local Year:", d.getFullYear());

console.log("UTC Month Period (Buggy):", d.toISOString().slice(0, 7));

const localMonth = (d.getMonth() + 1).toString().padStart(2, '0');
const localYear = d.getFullYear();
console.log("Local Month Period (Correct):", `${localYear}-${localMonth}`);
