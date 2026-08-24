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

            // Intentar primero IA remota con reintentos
            let aiResponse = await getAiResponseWithRetries(prompt);
            
            // Si la IA remota falla o da rate-limit (429), usar el generador inteligente integrado
            if (!aiResponse) {
                aiResponse = generateSmartFallbackResponse(prompt);
            }

            return res.end(JSON.stringify({ response: aiResponse }));
        } catch (err) {
            console.error('Chat API Error:', err);
            return res.end(JSON.stringify({ response: generateSmartFallbackResponse(bodyStr) }));
        }
    });
}

async function getAiResponseWithRetries(prompt) {
    // Intento 1
    let resp = await getAiResponseSingle(prompt);
    if (resp) return resp;

    // Intento 2 con delay de 800ms para superar rate-limit (429)
    await new Promise(r => setTimeout(r, 800));
    resp = await getAiResponseSingle(prompt);
    if (resp) return resp;

    return null;
}

function getAiResponseSingle(prompt) {
    return new Promise((resolve) => {
        const encoded = encodeURIComponent(prompt);
        const url = `https://text.pollinations.ai/${encoded}`;

        const req = https.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'text/plain, application/json'
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200 && data.trim() && !data.includes("PAYMENT_REQUIRED") && !data.includes("Queue full") && !data.includes("error")) {
                    resolve(data.trim());
                } else {
                    resolve(null);
                }
            });
        });

        req.on('error', () => resolve(null));
        req.setTimeout(6000, () => {
            req.destroy();
            resolve(null);
        });
    });
}

function generateSmartFallbackResponse(prompt) {
    const text = (prompt || '').toLowerCase();

    if (text.includes('tiesto') || text.includes('tiësto')) {
        return `🎧 **Información sobre DJ Tiësto:**\n\n` +
               `• **Posición Actual:** Tiësto (Tijs Verwest) se mantiene firmemente en el **Top 25 Mundial de DJ Mag** (actualmente alrededor de la posición #23-24) y sigue siendo uno de los DJs con mayor facturación y presencia como headliner en festivales como Tomorrowland, Ultra Music Festival y residencia en Las Vegas.\n` +
               `• **Legado:** Fue nombrado **el DJ #1 del Mundo durante 3 años consecutivos** (2002, 2003, 2004) y es ampliamente considerado "El Padrino de la Música Electrónica Moderna".\n` +
               `• **Éxitos Recientes:** Transicionó del Trance al Dance Pop/House comercial con hits globales como *"The Business"*, *"10:35"* (con Tate McRae), *"Don't Be Shy"* y *"Lethal Industry"*.\n\n` +
               `💡 *Tip:* Si deseas descargar cualquier set, remix o track de Tiësto, dime *'bájame Tiësto - The Business'* o *'descarga el video de Tiësto Adagio for Strings'* y lo guardaré en Verde Neón.`;
    }

    if (text.includes('armin') || text.includes('buuren')) {
        return `🎧 **Información sobre Armin van Buuren:**\n\n` +
               `• **Posición Actual:** Ocupa actualmente la posición **#5 Global** en DJ Mag Top 100.\n` +
               `• **RRecord Histórico:** Es el único DJ en la historia que ha ganado **5 veces el puesto #1 del Mundo** (2007, 2008, 2009, 2010, 2012).\n` +
               `• **Show Emblemático:** Creador del legendario programa de radio semanal *A State of Trance (ASOT)* con más de 1100 episodios.`;
    }

    if (text.includes('skrillex') || text.includes('hardwell') || text.includes('avicii') || text.includes('calvin harris')) {
        return `🎧 **Leyendas de la Música Electrónica:**\n\n` +
               `• **Calvin Harris:** Productor #1 en Billboard Dance y uno de los artistas mejor pagados del mundo.\n` +
               `• **Skrillex:** Revolucionó el Dubstep y la música electrónica ganando 8 Premios Grammy.\n` +
               `• **Avicii (R.I.P.):** Creador inolvidable de *"Levels"* y *"Wake Me Up"*, inmortal en la historia del EDM.\n` +
               `• **Hardwell:** Fue DJ #1 del Mundo en 2013 y 2014, pionero del movimiento Big Room House.`;
    }

    return `🤖 **Respuesta del Agente ARKAIOS:**\n\n` +
           `Sobre tu pregunta acerca de **"${prompt}"**:\n\n` +
           `Como tu asistente inteligente, estoy disponible para responder cualquier inquietud, concepto técnico, recomendación musical o consulta general.\n\n` +
           `💡 *Recordatorio:* Recuerda que mi función principal es la **obtención autónoma de canciones, videos o karaokes**. Solo dime *'bájame [nombre]'* o *'descarga el video de [nombre]'* y lo guardaré automáticamente en Verde Neón.`;
}

module.exports = handleChat;
