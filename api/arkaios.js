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

    const rawBaseUrl = sanitizeEnv(
        process.env.ARKAIOS_BASE_URL ||
        process.env.VITE_ARKAIOS_BASE_URL ||
        'https://arkaios-service-proxy.onrender.com'
    );
    const baseUrl = rawBaseUrl.replace(/\/+$/, '');
    const gatewayUrl = sanitizeEnv(process.env.AIDA_GATEWAY_URL || `${baseUrl}/aida/gateway`);

    if (!apiKey) {
        return res.status(500).json({
            error: 'Server configuration error: Missing API Key',
            required: ['PROXY_API_KEY', 'AIDA_AUTH_TOKEN'],
        });
    }

    try {
        const messages = Array.isArray(req.body?.messages) ? req.body.messages : [];
        const lastUserMessage = [...messages].reverse().find((msg) => msg?.role === 'user');
        const userText =
            typeof lastUserMessage?.content === 'string'
                ? lastUserMessage.content
                : typeof req.body?.message === 'string'
                  ? req.body.message
                  : typeof req.body?.prompt === 'string'
                    ? req.body.prompt
                    : '';

        const upstreamPayload = {
            agent_id: req.body?.agent_id || 'puter',
            action: req.body?.action || 'plan',
            params: {
                objective: userText,
                messages,
            },
        };

        const response = await fetch(gatewayUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(upstreamPayload),
        });
        const responseText = await response.text();
        let data;
        try {
            data = JSON.parse(responseText);
        } catch {
            return res.status(502).json({
                error: 'Invalid upstream response',
                details: responseText.slice(0, 500),
            });
        }

        if (!response.ok) {
            return res.status(response.status).json(data);
        }

        const buildGatewaySummary = (payload) => {
            const action = payload?.result?.action || upstreamPayload.action;
            const agent = payload?.result?.agent_id || upstreamPayload.agent_id;
            const mode = payload?.mode || 'unknown';
            const note = payload?.result?.note || payload?.message || '';
            const objective =
                payload?.result?.params?.objective ||
                upstreamPayload?.params?.objective ||
                userText;

            if (action === 'read' && Array.isArray(payload?.result?.items)) {
                const topItems = payload.result.items.slice(0, 5).map((item) => item.name).join(', ');
                return `ARKAIOS consultó el recurso en modo ${mode}. Accion: read. Elementos detectados: ${payload.result.items.length}. Primeros elementos: ${topItems}.`;
            }

            if (note === 'Acción segura procesada') {
                return `ARKAIOS recibió tu solicitud en modo ${mode}. Agente: ${agent}. Accion: ${action}. Objetivo: ${objective}. El gateway confirmó la operación, pero este endpoint abierto no devolvió una respuesta conversacional final.`;
            }

            return (
                payload?.result?.note ||
                payload?.result?.text ||
                payload?.message ||
                payload?.reply ||
                'Sin respuesta.'
            );
        };

        const content = buildGatewaySummary(data);

        res.status(200).json({
            choices: [
                {
                    message: {
                        content,
                    },
                },
            ],
            raw: data,
        });
    } catch (error) {
        console.error('Arkaios Proxy error:', error);
        res.status(500).json({ error: 'Failed to fetch from Arkaios', details: error.message });
    }
}
