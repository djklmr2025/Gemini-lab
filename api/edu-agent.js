// ============================================================
// ARKAIOS EDU-AGENT API
// Recibe petición en lenguaje natural → parsea intent con Gemini
// → busca imágenes en Pexels → devuelve config lista para la plantilla
// ============================================================

const PEXELS_API_KEY = process.env.PEXELS_API_KEY || '4vj6qTzLM9oc0gN7bdgr3vCO7jRDIBe0zJgknfq9geibx9hdQ16TVxpz';
const GOOGLE_API_KEY = process.env.VITE_GOOGLE_API_KEY || process.env.GOOGLE_API_KEY;

const ARKAIOS_EDU_BASE = 'https://eduacion-libre-proyecto-arkaios.vercel.app';

// Mapa de plantillas disponibles con descripción para que la IA elija
const TEMPLATES = {
  'plantilla-imagenes-v2': {
    file: 'plantilla-imagenes-v2.html',
    desc: 'Cuadrícula de imágenes en hoja tamaño carta. Ideal para fichas, fotos escolares, recortes.',
    grids: ['1x2','2x2','3x3','4x4','5x5','6x6','8x8']
  },
  'plantilla-cuadros-imagenes-v2': {
    file: 'plantilla-cuadros-imagenes-v2.html',
    desc: 'Cuadros de imágenes con bordes y etiquetas. Ideal para láminas con nombres.',
    grids: ['2x2','3x3','4x4']
  },
  'generador-fotos-infantiles': {
    file: 'generador-fotos-infantiles.html',
    desc: 'Fotos infantiles 2.5x3cm en cuadrícula densa. Ideal para credenciales y perfiles.',
    grids: ['auto']
  },
  'pixabay-descargador-lote': {
    file: 'pixabay-descargador-lote.html',
    desc: 'Descarga masiva de imágenes de Pixabay sobre un tema.',
    grids: ['auto']
  }
};

async function parseIntentWithGemini(userRequest) {
  if (!GOOGLE_API_KEY) {
    // Fallback sin IA: valores por defecto razonables
    return {
      template: 'plantilla-imagenes-v2',
      grid: '3x3',
      topic: userRequest,
      count: 9,
      lang: 'es',
      reasoning: 'Fallback sin API key de Gemini'
    };
  }

  const systemPrompt = `Eres el núcleo de ARKAIOS Educación. Analiza la petición del usuario y devuelve SOLO un JSON válido con esta estructura:
{
  "template": "nombre-de-la-plantilla",
  "grid": "NxM",
  "topic": "tema en inglés para buscar imágenes",
  "count": número_de_imágenes,
  "lang": "es",
  "reasoning": "breve explicación de por qué elegiste estos parámetros"
}

PLANTILLAS DISPONIBLES:
${Object.entries(TEMPLATES).map(([k,v]) => `- "${k}": ${v.desc} | Grids soportados: ${v.grids.join(', ')}`).join('\n')}

REGLAS:
- count debe ser igual a rows*cols del grid elegido (o múltiplo si el usuario pide más)
- Si el usuario menciona un tamaño específico como "5cm" o "2.5x3" usa generador-fotos-infantiles
- topic SIEMPRE en inglés para mejores resultados en Pexels
- Si pide muchas imágenes (más de 25), usa 5x5 o 6x6
- Responde SOLO JSON, sin markdown, sin explicación extra`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GOOGLE_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${systemPrompt}\n\nPetición del usuario: "${userRequest}"` }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 500 }
      })
    }
  );

  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

  // Limpiar markdown si Gemini lo añadió
  const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned);
}

async function fetchImagesFromPexels(topic, count) {
  const perPage = Math.min(count, 80);
  const response = await fetch(
    `https://api.pexels.com/v1/search?query=${encodeURIComponent(topic)}&per_page=${perPage}&orientation=square`,
    { headers: { Authorization: PEXELS_API_KEY } }
  );

  if (!response.ok) throw new Error(`Pexels error: ${response.status}`);

  const data = await response.json();
  return data.photos.map(p => ({
    url: p.src.large,
    thumb: p.src.medium,
    alt: p.alt || topic,
    photographer: p.photographer
  }));
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { request, mode, bridge_token } = req.body;
  if (!request) return res.status(400).json({ error: 'Campo "request" requerido' });

  // Modo ai_generate: devuelve URL del generador IA en vez de buscar en Pexels
  if (mode === 'ai_generate') {
    const intent = await parseIntentWithGemini(request);
    const genUrl = `https://eduacion-libre-proyecto-arkaios.vercel.app/generador-ia-imagenes.html?prompt=${encodeURIComponent(intent.topic)}&resolution=768x768&count=${intent.count||9}&autostart=1`;
    return res.status(200).json({ ok:true, mode:'ai_generate', generatorUrl: genUrl, intent, bridge_note:'Abre generatorUrl para generar con Perchance AI' });
  }

  try {
    // 1. Parsear intent con Gemini
    const intent = await parseIntentWithGemini(request);

    // 2. Validar template
    const templateKey = TEMPLATES[intent.template] ? intent.template : 'plantilla-imagenes-v2';
    const templateInfo = TEMPLATES[templateKey];

    // 3. Buscar imágenes en Pexels
    const images = await fetchImagesFromPexels(intent.topic, intent.count || 9);

    // 4. Construir URL de la plantilla con params
    const imageUrls = images.map(i => i.url).join('|');
    const templateUrl = `${ARKAIOS_EDU_BASE}/${templateInfo.file}?agent=1&grid=${intent.grid}&images=${encodeURIComponent(imageUrls)}&topic=${encodeURIComponent(intent.topic)}`;

    res.status(200).json({
      ok: true,
      intent,
      template: templateKey,
      templateFile: templateInfo.file,
      templateUrl,
      images,
      imageCount: images.length,
      grid: intent.grid,
      topic: intent.topic,
      reasoning: intent.reasoning
    });

  } catch (error) {
    console.error('EduAgent error:', error);
    res.status(500).json({ error: 'Error procesando la petición', details: error.message });
  }
}
