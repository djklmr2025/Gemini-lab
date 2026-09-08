// Gemini-Lab / ARKAIOS AI Chat API

async function handleChat(req, res) {
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        return res.status(200).end();
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');

    try {
        let prompt = '';
        if (req.body) {
            if (typeof req.body === 'object') {
                prompt = req.body.prompt || req.body.message || req.body.input || '';
            } else if (typeof req.body === 'string') {
                try {
                    const parsed = JSON.parse(req.body);
                    prompt = parsed.prompt || parsed.message || parsed.input || '';
                } catch (e) {
                    prompt = req.body;
                }
            }
        }

        if (!prompt || !prompt.trim()) {
            return res.json({ 
                response: 'Hola, soy el agente inteligente de Gemini-Lab. ¿En qué te puedo colaborar?',
                engine: 'ARKAIOS Gemini-Lab Co-Agent',
                status: 'ok'
            });
        }

        // 1. Intentar proveedor IA rápido (Pollinations)
        let aiResponse = await fetchAiResponse(prompt.trim());
        
        // 2. Si falla, fallback inteligente
        if (!aiResponse) {
            aiResponse = generateSmartFallback(prompt.trim());
        }

        return res.json({ 
            response: aiResponse,
            engine: 'ARKAIOS Gemini-Lab Co-Agent',
            status: 'ok',
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error('Chat API Error:', err);
        return res.status(500).json({ 
            response: generateSmartFallback(String(req.body || '')),
            error: err.message 
        });
    }
}

async function fetchAiResponse(prompt) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);
        const encoded = encodeURIComponent(prompt);
        const resp = await fetch(`https://text.pollinations.ai/${encoded}`, {
            signal: controller.signal,
            headers: { 'User-Agent': 'ARKAIOS-Gemini-Lab' }
        });
        clearTimeout(timeoutId);
        if (resp.ok) {
            const text = await resp.text();
            if (text && text.trim() && !text.includes('PAYMENT_REQUIRED') && !text.includes('error')) {
                return text.trim();
            }
        }
    } catch (e) {
        // Fallback gracefully on timeout
    }
    return null;
}

function generateSmartFallback(prompt) {
    const text = (prompt || '').toLowerCase();

    if (text.includes('videoclip') || text.includes('video') || text.includes('pexels') || text.includes('render')) {
        return `🎬 **ARKAIOS Video Engine Conectado:**\n\n` +
               `Estoy enlazado con **Dynamic Scenario Studio** (puerto 3005). Puedo compilar videoclips 1080p en movimiento sincronizados con tu música sin subtítulos invasivos. Usa el panel **Video Studio** o indícame la pista.`;
    }

    if (text.includes('tiesto') || text.includes('tiësto')) {
        return `🎧 **DJ Tiësto:** Icono de la música electrónica mundial, en el Top 25 DJ Mag y residente en festivales como Tomorrowland y Ultra Music Festival.`;
    }

    return `🏛️ **ARKAIOS Gemini-Lab Activo:**\n\n` +
           `Ecosistema Tridente interconectado (PuterLab IDE + Gemini-Lab + Dynamic Scenario Studio).\n` +
           `¿Deseas compilar un videoclip, generar código o inspeccionar el proyecto?`;
}

module.exports = handleChat;
