export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const apiKey = process.env.VITE_A1_ART_API_KEY || process.env.A1_ART_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'Server configuration error: Missing API Key' });
    }

    try {
        // Trying the documented endpoint with correct headers
        const response = await fetch('https://a1.art/open-api/v1/a1/images/generate', {
            method: 'POST',
            headers: {
                'apiKey': apiKey,
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (compatible; Gemini-Lab/1.0)',
            },
            body: JSON.stringify(req.body),
        });

        const data = await response.json();

        if (!response.ok) {
            // Forward the upstream error
            return res.status(response.status).json({
                error: data.msg || data.message || 'A1.art API Error',
                details: data
            });
        }

        res.status(200).json(data);
    } catch (error) {
        console.error('A1.art Proxy error:', error);
        res.status(500).json({
            error: `Proxy connection failed: ${error.message}`,
            details: error.message
        });
    }
}
