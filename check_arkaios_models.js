import fetch from 'node-fetch';

const BASE_URL = 'https://arkaios-gateway-open.onrender.com';
const API_KEY = 'sk_arkaios_proxy_8y28hsy72hs82js9';

async function checkEndpoint(endpoint) {
    console.log(`Checking ${BASE_URL}${endpoint}...`);
    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        console.log(`Status: ${response.status}`);
        if (response.ok) {
            const data = await response.json();
            console.log('Data:', JSON.stringify(data).substring(0, 200) + '...');
        } else {
            console.log('Text:', (await response.text()).substring(0, 200));
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
}

async function run() {
    await checkEndpoint('/v1/models');
    await checkEndpoint('/models');
    await checkEndpoint('/api/models');
    await checkEndpoint('/v1/chat/completions'); // Check if chat endpoint exists (405 or 400 expected if GET)
}

run();
