import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';

// Read .dev.vars manually since we are running in Node
const devVars = fs.readFileSync('.dev.vars', 'utf8');
const apiKeyMatch = devVars.match(/VITE_GEMINI_API_KEY="?([^"\n]+)"?/);

if (!apiKeyMatch) {
    console.error('Could not find VITE_GEMINI_API_KEY in .dev.vars');
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKeyMatch[1]);

async function listModels() {
    try {
        // There isn't a direct "list models" in the high-level SDK easily accessible without setup,
        // but we can try to just run a generation implementation.
        // Actually, the SDK doesn't expose listModels in the nice wrapper usually.
        // Let's simpler verify if 1.5-flash works.
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent('Test');
        console.log('✅ gemini-1.5-flash IS AVAILABLE');
    } catch (error) {
        console.error('❌ gemini-1.5-flash FAILED:', error.message);
    }

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-001' });
        const result = await model.generateContent('Test');
        console.log('✅ gemini-1.5-flash-001 IS AVAILABLE');
    } catch (error) {
        console.error('❌ gemini-1.5-flash-001 FAILED:', error.message);
    }

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const result = await model.generateContent('Test');
        console.log('✅ gemini-2.0-flash IS AVAILABLE');
    } catch (error) {
        console.error('❌ gemini-2.0-flash FAILED:', error.message);
    }
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });
        const result = await model.generateContent('Test');
        console.log('✅ gemini-1.5-flash-latest IS AVAILABLE');
    } catch (error) {
        console.error('❌ gemini-1.5-flash-latest FAILED:', error.message);
    }

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
        const result = await model.generateContent('Test');
        console.log('✅ gemini-1.5-pro IS AVAILABLE');
    } catch (error) {
        console.error('❌ gemini-1.5-pro FAILED:', error.message);
    }
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        const result = await model.generateContent('Test');
        console.log('✅ gemini-pro IS AVAILABLE');
    } catch (error) {
        console.error('❌ gemini-pro FAILED:', error.message);
    }

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro-002' });
        const result = await model.generateContent('Test');
        console.log('✅ gemini-1.5-pro-002 IS AVAILABLE');
    } catch (error) {
        console.error('❌ gemini-1.5-pro-002 FAILED:', error.message);
    }

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-8b' });
        const result = await model.generateContent('Test');
        console.log('✅ gemini-1.5-flash-8b IS AVAILABLE');
    } catch (error) {
        console.error('❌ gemini-1.5-flash-8b FAILED:', error.message);
    }
}

listModels();
