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

    const sanitizeEnv = (value) =>
        typeof value === 'string' ? value.trim().replace(/^['"]|['"]$/g, '') : '';

    const apiKey = sanitizeEnv(
        process.env.PROXY_API_KEY ||
        process.env.VITE_PROXY_API_KEY ||
        process.env.AIDA_AUTH_TOKEN ||
        process.env.VITE_AIDA_AUTH_TOKEN
    );

    // Fallback URL if env var is missing (though it should be set in Vercel)
    const rawBaseUrl = sanitizeEnv(
        process.env.ARKAIOS_BASE_URL ||
        process.env.VITE_ARKAIOS_BASE_URL ||
        'https://arkaios-service-proxy.onrender.com'
    );
    const baseUrl = rawBaseUrl.replace(/\/+$/, '');

    if (!apiKey) {
        return res.status(500).json({
            error: 'Server configuration error: Missing API Key',
            required: ['PROXY_API_KEY', 'AIDA_AUTH_TOKEN'],
        });
    }

    try {
        const response = await fetch(`${baseUrl}/v1/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(req.body),
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json(data);
        }

        res.status(200).json(data);
    } catch (error) {
        console.error('Arkaios Proxy error:', error);
        res.status(500).json({ error: 'Failed to fetch from Arkaios', details: error.message });
    }
}
