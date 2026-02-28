const d = new Date('2026-03-01T07:14:00+08:00'); // Malaysia time (UTC+8), 7:14 AM

console.log("Local Month Name:", d.toLocaleString('default', { month: 'long' }));
console.log("Local Year:", d.getFullYear());

console.log("UTC Month Period (Buggy):", d.toISOString().slice(0, 7));

const localMonth = (d.getMonth() + 1).toString().padStart(2, '0');
const localYear = d.getFullYear();
console.log("Local Month Period (Correct):", `${localYear}-${localMonth}`);
