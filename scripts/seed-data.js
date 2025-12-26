// Seed script for testing - run this in browser console
// Copy and paste this entire script into the browser console at http://localhost:5173

(async function seedTestData() {
    const dbName = 'FinanceDB';
    const request = indexedDB.open(dbName);

    request.onsuccess = async (event) => {
        const db = event.target.result;
        const tx = db.transaction('expenses', 'readwrite');
        const store = tx.objectStore('expenses');

        const categories = ['Food', 'Transport', 'Groceries', 'Entertainment', 'Healthcare', 'Others'];
        const names = {
            'Food': ['Lunch at Mamak', 'Coffee', 'Dinner', 'Breakfast', 'Snacks', 'KFC', 'McDonalds'],
            'Transport': ['Grab', 'Petrol', 'Parking', 'LRT', 'Bus', 'Toll'],
            'Groceries': ['Tesco', 'Aeon', 'Lotus', 'Village Grocer', 'Jaya Grocer'],
            'Entertainment': ['Netflix', 'Spotify', 'Cinema', 'Games', 'Books'],
            'Healthcare': ['Pharmacy', 'Doctor', 'Supplements', 'Gym'],
            'Others': ['Haircut', 'Laundry', 'Phone Bill', 'Internet', 'Utilities']
        };

        const paymentMethods = ['Cash', 'Credit Card', 'Debit Card', 'E-Wallet'];

        // Generate expenses for the last 6 months
        const now = new Date();
        const expenses = [];

        for (let monthOffset = 0; monthOffset < 6; monthOffset++) {
            const numExpenses = Math.floor(Math.random() * 10) + 5; // 5-15 expenses per month

            for (let i = 0; i < numExpenses; i++) {
                const category = categories[Math.floor(Math.random() * categories.length)];
                const nameList = names[category];
                const name = nameList[Math.floor(Math.random() * nameList.length)];

                const date = new Date(now);
                date.setMonth(date.getMonth() - monthOffset);
                date.setDate(Math.floor(Math.random() * 28) + 1);
                date.setHours(Math.floor(Math.random() * 12) + 8);
                date.setMinutes(Math.floor(Math.random() * 60));

                const expense = {
                    id: crypto.randomUUID(),
                    name: name,
                    amount: Math.floor(Math.random() * 100) + 5,
                    category: category,
                    tags: [],
                    timestamp: date,
                    notes: '',
                    paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
                    isTaxDeductible: false
                };

                expenses.push(expense);
            }
        }

        // Add all expenses
        for (const expense of expenses) {
            store.add(expense);
        }

        tx.oncomplete = () => {
            console.log(`✅ Added ${expenses.length} test expenses!`);
            console.log('🔄 Refreshing page...');
            location.reload();
        };

        tx.onerror = (e) => {
            console.error('❌ Error adding expenses:', e);
        };
    };

    request.onerror = (e) => {
        console.error('❌ Error opening database:', e);
    };
})();
