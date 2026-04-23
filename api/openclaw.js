function setCors(res) {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );
}

export default async function handler(req, res) {
    setCors(res);

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method === 'GET') {
        return res.status(200).json({
            ok: true,
            configured: Boolean(process.env.OPENCLAW_BASE_URL),
            baseUrl: process.env.OPENCLAW_BASE_URL || null,
            agentId: process.env.OPENCLAW_AGENT_ID || 'main'
        });
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const baseUrl = (process.env.OPENCLAW_BASE_URL || '').replace(/\/$/, '');
    const token = process.env.OPENCLAW_GATEWAY_TOKEN || process.env.OPENCLAW_GATEWAY_PASSWORD || '';
    const agentId = process.env.OPENCLAW_AGENT_ID || 'main';

    if (!baseUrl) {
        return res.status(500).json({
            error: 'Server configuration error: Missing OPENCLAW_BASE_URL'
        });
    }

    const model = req.body?.model || `openclaw:${agentId}`;
    const body = {
        model,
        input: req.body?.input || '',
        instructions: req.body?.instructions,
        previous_response_id: req.body?.previous_response_id,
        stream: false
    };

    try {
        const headers = { 'Content-Type': 'application/json' };
        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }
        if (req.body?.sessionKey) {
            headers['x-openclaw-session-key'] = req.body.sessionKey;
        }

        const response = await fetch(`${baseUrl}/v1/responses`, {
            method: 'POST',
            headers,
            body: JSON.stringify(body)
        });

        const raw = await response.text();
        let data;
        try {
            data = JSON.parse(raw);
        } catch {
            data = { raw };
        }

        if (!response.ok) {
            return res.status(response.status).json(data);
        }

        return res.status(200).json(data);
    } catch (error) {
        console.error('OpenClaw proxy error:', error);
        return res.status(500).json({
            error: 'Failed to fetch from OpenClaw',
            details: error.message
        });
    }
}
