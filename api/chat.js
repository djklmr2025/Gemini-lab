const http = require('http');
const https = require('https');

async function handleChat(req, res) {
    if (req.method === 'OPTIONS') {
        res.writeHead(200, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        });
        return res.end();
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');

    let bodyStr = '';
    req.on('data', chunk => { bodyStr += chunk; });
    req.on('end', async () => {
        try {
            let prompt = '';
            if (bodyStr) {
                const parsed = JSON.parse(bodyStr);
                prompt = parsed.prompt || parsed.message || parsed.input || '';
            }

            if (!prompt) {
                return res.end(JSON.stringify({ response: 'Por favor envía una pregunta o mensaje.' }));
            }

            // Call Pollinations / Google / Free LLM fallback
            const aiResponse = await getAiResponse(prompt);
            return res.end(JSON.stringify({ response: aiResponse }));
        } catch (err) {
            console.error('Chat API Error:', err);
            return res.end(JSON.stringify({ response: 'Error procesando la consulta: ' + err.message }));
        }
    });
}

function getAiResponse(prompt) {
    return new Promise((resolve) => {
        const encoded = encodeURIComponent(prompt);
        const url = `https://text.pollinations.ai/${encoded}`;

        const req = https.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200 && data.trim() && !data.includes("PAYMENT_REQUIRED") && !data.includes("error")) {
                    resolve(data.trim());
                } else {
                    resolve(null);
                }
            });
        });

        req.on('error', () => resolve(null));
        req.setTimeout(5000, () => {
            req.destroy();
            resolve(null);
        });
    });
}

module.exports = handleChat;
