// public/share-target-handler.js

/**
 * Service Worker script to handle Web Share Target POST requests
 * 
 * This script intercepts POST requests to /share, extracts the file/data,
 * stores it in IndexedDB, and redirects the user to the /share page.
 * 
 * We use IndexedDB because Cache API cannot reliably store File objects
 * or large binary blobs in a structured way that preserves metadata.
 */

const DB_NAME = 'share-target-db';
const STORE_NAME = 'shared-files';
const DB_VERSION = 1;

// Open IndexedDB helper
function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };
    });
}

// Store data in IndexedDB helper
function storeShareData(data) {
    return new Promise(async (resolve, reject) => {
        try {
            const db = await openDB();
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);

            // Store with a static ID 'latest' so we always have the most recent share
            // We could use timestamps if we wanted a queue, but v1 requirements
            // imply processing one share at a time.
            const request = store.put({
                id: 'latest',
                ...data,
                timestamp: Date.now()
            });

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        } catch (error) {
            reject(error);
        }
    });
}

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Intercept POST requests to /share
    // Match /share or /share/ to be robust
    if (event.request.method === 'POST' && url.pathname.replace(/\/$/, '') === '/share') {
        event.respondWith(
            (async () => {
                try {
                    // Parse FormData from the request
                    const formData = await event.request.formData();
                    const receiptFile = formData.get('receipt');
                    const text = formData.get('text');
                    const sharedUrl = formData.get('url');

                    console.log('SW: Received share', {
                        hasFile: !!receiptFile,
                        type: receiptFile ? receiptFile.type : 'none',
                        size: receiptFile ? receiptFile.size : 0
                    });

                    // Only proceed if we have valid data
                    if (receiptFile || text || sharedUrl) {
                        // Store in IndexedDB
                        await storeShareData({
                            file: receiptFile,
                            text: text,
                            url: sharedUrl
                        });
                    }

                    // Redirect to the /share page (GET) to process the data
                    return Response.redirect('/share', 303);
                } catch (error) {
                    console.error('SW: Share target error', error);
                    // Fallback redirect even on error, let the page handle empty state
                    return Response.redirect('/share?error=processing_failed', 303);
                }
            })()
        );
    }
});
