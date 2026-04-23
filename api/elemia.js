function setCors(res) {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function elemiaHeaders(token) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
        headers['x-elemia-token'] = token;
    }
    return headers;
}

function normalizeBaseUrl(baseUrl) {
    return (baseUrl || '').replace(/\/$/, '');
}

async function proxyJson(url, options) {
    const response = await fetch(url, options);
    const text = await response.text();
    let data;
    try {
        data = JSON.parse(text);
    } catch {
        data = { raw: text };
    }
    return { response, data };
}

export default async function handler(req, res) {
    setCors(res);

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const baseUrl = normalizeBaseUrl(process.env.ELEMIA_BASE_URL || 'https://elemia-v4-arkaios.onrender.com');
    const token = process.env.ELEMIA_HTTP_TOKEN || '';
    const action = String(req.query?.action || req.body?.action || '').trim();

    if (!baseUrl) {
        return res.status(500).json({ error: 'Server configuration error: Missing ELEMIA_BASE_URL' });
    }

    try {
        if (req.method === 'GET') {
            if (action === 'ping') {
                const { response, data } = await proxyJson(`${baseUrl}/elemia/ping`, { method: 'GET' });
                return res.status(response.status).json(data);
            }

            if (action === 'identity') {
                const { response, data } = await proxyJson(`${baseUrl}/elemia/identity`, {
                    method: 'GET',
                    headers: elemiaHeaders(token)
                });
                return res.status(response.status).json(data);
            }

            if (action === 'list') {
                const limit = Number(req.query?.limit || 10);
                const { response, data } = await proxyJson(`${baseUrl}/elemia/list?limit=${encodeURIComponent(limit)}`, {
                    method: 'GET',
                    headers: elemiaHeaders(token)
                });
                return res.status(response.status).json(data);
            }

            return res.status(400).json({ error: 'Unsupported GET action' });
        }

        if (req.method === 'POST') {
            if (action === 'remember') {
                const { response, data } = await proxyJson(`${baseUrl}/elemia/remember`, {
                    method: 'POST',
                    headers: elemiaHeaders(token),
                    body: JSON.stringify({
                        content: req.body?.content,
                        tag: req.body?.tag
                    })
                });
                return res.status(response.status).json(data);
            }

            if (action === 'recall') {
                const { response, data } = await proxyJson(`${baseUrl}/elemia/recall`, {
                    method: 'POST',
                    headers: elemiaHeaders(token),
                    body: JSON.stringify({
                        query: req.body?.query,
                        limit: req.body?.limit || 5
                    })
                });
                return res.status(response.status).json(data);
            }

            if (action === 'save_state') {
                const { response, data } = await proxyJson(`${baseUrl}/elemia/save_state`, {
                    method: 'POST',
                    headers: elemiaHeaders(token),
                    body: JSON.stringify({
                        project: req.body?.project,
                        status: req.body?.status,
                        next_steps: req.body?.next_steps,
                        notes: req.body?.notes
                    })
                });
                return res.status(response.status).json(data);
            }

            if (action === 'whatsapp_send') {
                const { response, data } = await proxyJson(`${baseUrl}/elemia/whatsapp/send`, {
                    method: 'POST',
                    headers: elemiaHeaders(token),
                    body: JSON.stringify({
                        to: req.body?.to,
                        text: req.body?.text
                    })
                });
                return res.status(response.status).json(data);
            }

            return res.status(400).json({ error: 'Unsupported POST action' });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('ELEMIA proxy error:', error);
        return res.status(500).json({
            error: 'Failed to fetch from ELEMIA',
            details: error.message
        });
    }
}
