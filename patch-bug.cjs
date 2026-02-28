const fs = require('fs');

const dateUtilsImport = "import { getLocalMonthPeriod } from '../utils/dateUtils';\n";
const dateUtilsImportLevels2 = "import { getLocalMonthPeriod } from '../../utils/dateUtils';\n"; // for components/budgets/ etc if any

const patchFile = (filepath, importStr) => {
    let content = fs.readFileSync(filepath, 'utf8');
    let modified = false;

    // Add import if it uses getLocalMonthPeriod later but not now
    if (!content.includes('getLocalMonthPeriod')) {
        // Insert after first import
        content = content.replace(/^(import.*?;?\n)+/m, match => match + importStr);
    }

    // Replace current month logic
    const oldMonthCurrent = /const currentMonth = (?:new Date\(\)|now)\.toISOString\(\)\.slice\(0,\s*7\);?(?: \/\/ YYYY-MM)?/;
    if (oldMonthCurrent.test(content)) {
        content = content.replace(oldMonthCurrent, (match) => {
            if (match.includes('now')) {
                return "const currentMonth = getLocalMonthPeriod(now);";
            } else {
                return "const currentMonth = getLocalMonthPeriod();";
            }
        });
        modified = true;
    }

    // Replace inline timestamp logic
    const oldTimestampLogic = /new Date\(e\.timestamp\)\.toISOString\(\)\.slice\(0,\s*7\)/g;
    if (oldTimestampLogic.test(content)) {
        content = content.replace(oldTimestampLogic, "getLocalMonthPeriod(new Date(e.timestamp))");
        modified = true;
    }

    // Replace inline monthPeriod logic in tests
    const oldMonthPeriodLogic = /monthPeriod:\s*new Date\(\)\.toISOString\(\)\.slice\(0,\s*7\)/g;
    if (oldMonthPeriodLogic.test(content)) {
        content = content.replace(oldMonthPeriodLogic, "monthPeriod: getLocalMonthPeriod()");
        modified = true;
    }

    if (modified) {
        fs.writeFileSync(filepath, content, 'utf8');
        console.log(`Patched ${filepath}`);
    }
}

patchFile('src/components/BudgetManager.tsx', dateUtilsImport);
patchFile('src/components/CategoryBudgetManager.tsx', dateUtilsImport);
patchFile('src/components/Dashboard.tsx', dateUtilsImport);
patchFile('src/components/BudgetProgress.tsx', dateUtilsImport);
patchFile('src/components/MonthExpenseSnapshot.test.tsx', dateUtilsImport);
