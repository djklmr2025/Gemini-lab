// ============================================================
// ARKAIOS EDU-AGENT API
// Conecta Gemini Lab con el catalogo vivo del repo educativo.
// ============================================================

const PEXELS_API_KEY = process.env.PEXELS_API_KEY || '4vj6qTzLM9oc0gN7bdgr3vCO7jRDIBe0zJgknfq9geibx9hdQ16TVxpz';
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || process.env.VITE_GOOGLE_API_KEY;

const ARKAIOS_EDU_BASE = process.env.ARKAIOS_EDU_BASE || 'https://eduacion-libre-proyecto-arkaios.vercel.app';
const ARKAIOS_EDU_TOOLS_URL = `${ARKAIOS_EDU_BASE}/api/arkaios-tools`;
const ARKAIOS_EDU_PDF_URL = `${ARKAIOS_EDU_BASE}/api/export-pdf`;

const BRIDGE_COMPATIBLE_FILES = new Set([
  'plantilla-imagenes-v2.html',
  'plantilla-cuadros-imagenes-v2.html',
  'plantilla_circulos_jack.html',
  'generador-fotos-infantiles.html',
  'generador-ia-imagenes.html',
  'hoja_milimetrica_interactiva.html',
  'material-educativo-reutilizable.html',
  'buscador-imagenes-educativo.html',
  'pixabay-descargador-lote.html',
  'biografia_profesional.html',
  'brecha-digital.html',
  'cultura-de-paz.html'
]);

const ORCHESTRATOR_COMPATIBLE_FILES = new Set([
  'plantilla_escolar_carta_mx_autoajuste_y_areas_editables.html',
  'biografia_profesional.html'
]);

const FALLBACK_CATALOG = [
  {
    id: 'plantilla_imagenes_v2',
    name: 'Plantilla Imágenes v2',
    file: 'plantilla-imagenes-v2.html',
    description: 'Cuadrícula flexible de imágenes compatible con carga automática por URL/Pexels/IA.',
    category: 'imagenes',
    listed: true
  },
  {
    id: 'plantilla_cuadros_imagenes_v2',
    name: 'Cuadros Imágenes v2',
    file: 'plantilla-cuadros-imagenes-v2.html',
    description: 'Cuadros de imágenes para impresión y recortar.',
    category: 'imagenes',
    listed: true
  },
  {
    id: 'plantilla_circulos_jack',
    name: 'Círculos Jack Skellington',
    file: 'plantilla_circulos_jack.html',
    description: 'Formatos circulares para stickers, sellos, pines y parches escolares.',
    category: 'imagenes',
    listed: true
  },
  {
    id: 'generador_fotos_infantiles',
    name: 'Generador Fotos Infantiles',
    file: 'generador-fotos-infantiles.html',
    description: 'Generación y formato de fotos tamaño infantil (2.5x3 cm) con recorte.',
    category: 'imagenes',
    listed: true
  },
  {
    id: 'generador_ia_imagenes',
    name: 'Generador IA de Imágenes',
    file: 'generador-ia-imagenes.html',
    description: 'Estudio de generación de imágenes con inteligencia artificial en vivo.',
    category: 'ia',
    listed: true
  },
  {
    id: 'hoja_milimetrica_interactiva',
    name: 'Hoja Milimétrica Interactiva',
    file: 'hoja_milimetrica_interactiva.html',
    description: 'Canvas interactivo de hoja milimétrica para trazado técnico y matemáticas.',
    category: 'herramientas',
    listed: true
  },
  {
    id: 'material_educativo_reutilizable',
    name: 'Biblioteca de Material Reutilizable',
    file: 'material-educativo-reutilizable.html',
    description: 'Catálogo y gestión de PDFs y plantillas editables reutilizables.',
    category: 'biblioteca',
    listed: true
  },
  {
    id: 'pixabay_descargador_lote',
    name: 'Pixabay Descargador Lote',
    file: 'pixabay-descargador-lote.html',
    description: 'Descarga masiva de imágenes de Pixabay en formato ZIP por lote.',
    category: 'herramientas',
    listed: true
  },
  {
    id: 'plantilla_escolar_carta_mx',
    name: 'Plantilla Escolar Carta MX',
    file: 'plantilla_escolar_carta_mx_autoajuste_y_areas_editables.html',
    description: 'Documentos, informes y tareas escolares tamaño Carta MX con áreas editables.',
    category: 'documentos',
    listed: true
  }
];

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'https://arkaios-n8n.onrender.com/webhook/arkaios-gateway';
const N8N_API_KEY = process.env.N8N_API_KEY || 'ARKAIOS-N8N-SECURE-KEY-2026';

async function elemiaRemember(content, tag = 'edu-agent') {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500);

    await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${N8N_API_KEY}`
      },
      body: JSON.stringify({
        EVENT_TYPE: 'EDU_AGENT_REQUEST',
        SOURCE_IP: 'gemini-lab',
        NOTES: `[${tag}] ${content}`
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
  } catch (e) {
    console.error("Webhook n8n timeout/error:", e.message);
  }
}

async function fetchEducationalCatalog() {
  try {
    const response = await fetch(ARKAIOS_EDU_TOOLS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool: 'list_templates' })
    });

    if (!response.ok) {
      throw new Error(`Edu tools status ${response.status}`);
    }

    const data = await response.json();
    if (!Array.isArray(data.templates) || data.templates.length === 0) {
      throw new Error('Catalogo vacio');
    }

    return data.templates.map((item) => ({
      id: item.id || item.file,
      name: item.name || item.label || item.file,
      file: item.file,
      description: item.description || '',
      category: item.category || item.section || 'general',
      listed: item.listed !== false
    }));
  } catch (error) {
    return FALLBACK_CATALOG;
  }
}

function buildCatalogPrompt(catalog) {
  return catalog.map((item) => {
    return `- id="${item.id}" | file="${item.file}" | name="${item.name}" | category="${item.category}" | desc="${item.description}"`;
  }).join('\n');
}

function normalizeText(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function translateTopicFallback(rawTopic = '') {
  let topic = normalizeText(rawTopic);

  const phraseMap = [
    ['figuras geometricas', 'geometric shapes'],
    ['animales del oceano', 'ocean animals'],
    ['sistema solar', 'solar system'],
    ['frutas tropicales', 'tropical fruits'],
    ['vida marina', 'marine life'],
    ['animales marinos', 'sea animals']
  ];

  for (const [needle, replacement] of phraseMap) {
    if (topic.includes(needle)) topic = topic.replace(needle, replacement);
  }

  const wordMap = {
    dinosaurios: 'dinosaurs',
    dinosaurio: 'dinosaur',
    volcanes: 'volcanoes',
    volcan: 'volcano',
    planetas: 'planets',
    planeta: 'planet',
    animales: 'animals',
    animal: 'animal',
    oceano: 'ocean',
    frutas: 'fruits',
    fruta: 'fruit',
    tropicales: 'tropical',
    tropical: 'tropical',
    geometricas: 'geometric',
    geometrica: 'geometric',
    figuras: 'shapes',
    figura: 'shape',
    primaria: 'elementary',
    preescolar: 'preschool',
    ninos: 'kids',
    ninas: 'kids',
    infantil: 'kids',
    escolares: 'school',
    escolar: 'school'
  };

  return topic
    .split(/[^a-zA-Z]+/)
    .filter(Boolean)
    .map((token) => wordMap[token] || token)
    .join(' ')
    .trim();
}

function parseIntentFallback(userRequest = '') {
  const normalizedRequest = normalizeText(userRequest);
  const gridMatch = normalizedRequest.match(/(\d+)\s*x\s*(\d+)/);
  const explicitCountMatch = normalizedRequest.match(/\b(\d+)\b/);

  let rows = gridMatch ? Number(gridMatch[1]) : 0;
  let cols = gridMatch ? Number(gridMatch[2]) : 0;
  let count = rows && cols ? rows * cols : (explicitCountMatch ? Number(explicitCountMatch[1]) : 9);

  let grid = '3x3';
  if (gridMatch) {
    grid = `${rows}x${cols}`;
  } else if (count > 0) {
    const side = Math.ceil(Math.sqrt(count));
    const sideOther = Math.ceil(count / side);
    grid = side >= sideOther ? `${sideOther}x${side}` : `${side}x${sideOther}`;
  }

  let cleanedTopic = normalizedRequest
    .replace(/\b\d+\s*x\s*\d+\b/g, ' ')
    .replace(/\b\d+\b/g, ' ')
    .replace(/\b(necesito|quiero|dame|crea|crear|una|un|unas|unos|con|para|de|del|la|las|el|los|en|cuadricula|grid|imagenes|imagen|foto|fotos|plantilla|grado|anos|ano|materia)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleanedTopic) cleanedTopic = normalizedRequest;
  const translatedTopic = translateTopicFallback(cleanedTopic) || 'educational flashcards';

  return {
    preferred_template_file: 'plantilla-imagenes-v2.html',
    grid: grid,
    topic: translatedTopic,
    count: count,
    lang: 'es',
    reasoning: 'Inferencia dinámica (Modo sin Gemini API)'
  };
}

async function parseIntentWithGemini(userRequest, catalog) {
  if (!GOOGLE_API_KEY) {
    console.warn('[edu-agent] GOOGLE_API_KEY no configurada, usando fallback');
    return parseIntentFallback(userRequest);
  }

  const systemPrompt = `Eres el nucleo de ARKAIOS Educacion. Analiza la peticion del usuario y devuelve SOLO un JSON valido con esta estructura:
{
  "preferred_template_file": "archivo.html",
  "grid": "NxM",
  "topic": "tema en ingles para buscar imagenes",
  "count": numero_de_imagenes,
  "lang": "es",
  "source": "pexels",
  "reasoning": "explicacion breve"
}

CATALOGO VIVO DEL REPO EDUCATIVO:
${buildCatalogPrompt(catalog)}

REGLAS DE SELECCIÓN DE PLANTILLA:
- Para stickers, círculos, sellos, pines o parches -> "plantilla_circulos_jack.html".
- Para fotos infantiles 2.5x3cm o credenciales -> "generador-fotos-infantiles.html".
- Para hoja milimétrica, gráficos o dibujo técnico -> "hoja_milimetrica_interactiva.html".
- Para informes, tareas, ensayos o documentos -> "plantilla_escolar_carta_mx_autoajuste_y_areas_editables.html".
- Para descarga masiva ZIP o Pixabay en lote -> "pixabay-descargador-lote.html".
- Para estudio de IA o generación directa -> "generador-ia-imagenes.html".
- Para biblioteca de archivos/materiales reutilizables -> "material-educativo-reutilizable.html".
- Para cuadrículas de imágenes o consulta general -> "plantilla-imagenes-v2.html" o "plantilla-cuadros-imagenes-v2.html".
- count debe coincidir con el grid cuando sea posible.
- topic SIEMPRE en inglés para mejores resultados en Pexels/IA.
- Usa source: "ai" SI el usuario pide explícitamente "generar", "crear con IA", "dibujar", "ilustrar". De lo contrario usa "pexels".
- Responde SOLO JSON, sin markdown.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${systemPrompt}\n\nPeticion del usuario: "${userRequest}"` }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 500 },
          safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
          ]
        })
      }
    );

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    const cleaned = jsonMatch ? jsonMatch[0] : rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    return JSON.parse(cleaned) || parseIntentFallback(userRequest);
  } catch (error) {
    console.warn("[edu-agent] Fallo Gemini, usando fallback:", error.message);
    return parseIntentFallback(userRequest);
  }
}

function resolveTemplate(intent, catalog) {
  const preferredFile = String(intent.preferred_template_file || '').trim().toLowerCase();

  const exact = catalog.find((item) => String(item.file).toLowerCase() === preferredFile);
  if (exact) return exact;

  const compatible = catalog.find((item) => BRIDGE_COMPATIBLE_FILES.has(item.file) || ORCHESTRATOR_COMPATIBLE_FILES.has(item.file));
  return compatible || catalog[0] || FALLBACK_CATALOG[0];
}

function normalizeGrid(rawGrid, rawCount) {
  const safeGrid = String(rawGrid || '3x3').trim().toLowerCase();
  const match = safeGrid.match(/^(\d+)x(\d+)$/);
  if (!match) {
    return { grid: '3x3', count: Math.max(Number(rawCount) || 9, 9) };
  }

  const rows = Number(match[1]);
  const cols = Number(match[2]);
  const gridCount = rows * cols;
  const count = Number(rawCount) || gridCount;

  return {
    grid: `${rows}x${cols}`,
    count: count < gridCount ? gridCount : count
  };
}

async function fetchImagesFromPexels(topic, count) {
  const perPage = Math.min(count, 80);
  const response = await fetch(
    `https://api.pexels.com/v1/search?query=${encodeURIComponent(topic)}&per_page=${perPage}&orientation=square`,
    { headers: { Authorization: PEXELS_API_KEY } }
  );

  if (!response.ok) throw new Error(`Pexels error: ${response.status}`);

  const data = await response.json();
  if (!Array.isArray(data.photos) || data.photos.length === 0) {
    throw new Error(`Pexels no devolvió imágenes para: ${topic}`);
  }
  return data.photos.map((photo) => ({
    url: photo.src.large,
    thumb: photo.src.medium,
    alt: photo.alt || topic,
    photographer: photo.photographer
  }));
}

function isDocumentRequest(request = '') {
  const text = String(request).toLowerCase();
  return [
    'tarea',
    'trabajo',
    'investig',
    'resumen',
    'ensayo',
    'exposi',
    'informe',
    'actividad',
    'referencia',
    'bibliograf'
  ].some((token) => text.includes(token));
}

function buildCartaTemplateSchema() {
  return {
    id: 'carta-mx-inteligente',
    title: 'Plantilla Escolar Carta MX',
    modules: [
      { id: 'titles.mainTitle', type: 'text', label: 'Titulo principal' },
      { id: 'titles.subtitle', type: 'text', label: 'Subtitulo' },
      { id: 'fields.field0', type: 'text', label: 'Nombre' },
      { id: 'fields.field1', type: 'text', label: 'Materia' },
      { id: 'fields.field2', type: 'text', label: 'Profesor(a)' },
      { id: 'fields.field3', type: 'text', label: 'Fecha' },
      { id: 'fields.fieldTopic', type: 'text', label: 'Tema' },
      { id: 'blocks.0', type: 'text', label: 'Bloque de contenido 1' },
      { id: 'blocks.1', type: 'text', label: 'Bloque de contenido 2' },
      { id: 'blocks.2', type: 'text', label: 'Bloque de contenido 3' },
      { id: 'references', type: 'text', label: 'Referencias' },
      { id: 'layout', type: 'select', label: 'Imagenes por hoja' },
      { id: 'images.0', type: 'image', label: 'Imagen 1' },
      { id: 'images.1', type: 'image', label: 'Imagen 2' },
      { id: 'images.2', type: 'image', label: 'Imagen 3' },
      { id: 'images.3', type: 'image', label: 'Imagen 4' },
      { id: 'images.4', type: 'image', label: 'Imagen 5' },
      { id: 'images.5', type: 'image', label: 'Imagen 6' }
    ]
  };
}

function buildNestedWorkspace(fill = {}, images = {}) {
  const workspace = {
    fields: {},
    titles: {},
    blocks: ['', '', ''],
    references: '',
    layout: '3',
    images: []
  };

  for (const [key, value] of Object.entries(fill)) {
    if (!key || value == null) continue;
    if (key.startsWith('fields.')) {
      workspace.fields[key.slice('fields.'.length)] = String(value);
      continue;
    }
    if (key.startsWith('titles.')) {
      workspace.titles[key.slice('titles.'.length)] = String(value);
      continue;
    }
    if (key.startsWith('blocks.')) {
      const idx = Number(key.slice('blocks.'.length));
      if (!Number.isNaN(idx) && idx >= 0) workspace.blocks[idx] = String(value);
      continue;
    }
    if (key === 'references') {
      workspace.references = String(value);
      continue;
    }
    if (key === 'layout') {
      workspace.layout = String(value);
    }
  }

  for (const [key, value] of Object.entries(images)) {
    if (!key.startsWith('images.') || typeof value !== 'string') continue;
    const idx = Number(key.slice('images.'.length));
    if (Number.isNaN(idx) || idx < 0) continue;
    workspace.images[idx] = value;
  }

  workspace.fields.fieldTopic = workspace.fields.fieldTopic || workspace.titles.mainTitle || '';
  workspace.titles.subtitle = workspace.titles.subtitle || 'Material generado por ARKAIOS Edu';
  workspace.layout = ['3', '6', '9', '12'].includes(String(workspace.layout)) ? String(workspace.layout) : '3';

  return workspace;
}

async function fetchOrchestratedPrefill(request, topic) {
  const response = await fetch(`${ARKAIOS_EDU_BASE}/api/arkaios-orquestador`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: request,
      template: buildCartaTemplateSchema(),
      data: {
        fields: { fieldTopic: topic },
        titles: { mainTitle: topic }
      }
    })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error || 'No se pudo prellenar la plantilla educativa');
  }

  return {
    reply: data.reply || 'Contenido prellenado por ARKAIOS.',
    workspace: buildNestedWorkspace(data.fill || {}, data.images || {})
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { request, mode } = req.body || {};
  if (!request) return res.status(400).json({ error: 'Campo "request" requerido' });

  // Diagnóstico de variables de entorno
  console.log('[edu-agent] GOOGLE_API_KEY presente:', !!GOOGLE_API_KEY);
  console.log('[edu-agent] ARKAIOS_EDU_BASE:', ARKAIOS_EDU_BASE);

  try {
    const catalog = await fetchEducationalCatalog();
    const intent = await parseIntentWithGemini(request, catalog);

    // Normalizar campos faltantes del intent
    if (!intent.topic || intent.topic === 'undefined') {
      const fallback = parseIntentFallback(request);
      intent.topic = fallback.topic;
    }
    intent.grid = intent.grid || '3x3';
    intent.count = Number(intent.count) || 9;

    // Para peticiones de imágenes, excluir plantillas de orquestador de la selección
    const isDoc = isDocumentRequest(request);
    const templateCatalog = isDoc
      ? catalog
      : catalog.filter((item) => !ORCHESTRATOR_COMPATIBLE_FILES.has(item.file));

    const normalized = normalizeGrid(intent.grid, intent.count);
    let selectedTemplate = resolveTemplate(intent, templateCatalog.length > 0 ? templateCatalog : catalog);

    if (isDoc) {
      const cartaTemplate = catalog.find((item) => ORCHESTRATOR_COMPATIBLE_FILES.has(item.file));
      if (cartaTemplate) selectedTemplate = cartaTemplate;
    }

    await elemiaRemember(
      `[EDU-REQUEST] "${request}" -> topic=${intent.topic}, grid=${normalized.grid}, preferred=${intent.preferred_template_file}, selected=${selectedTemplate.file}`,
      'edu-request'
    );

    // Modo: redirigir al generador de imágenes IA externo
    if (mode === 'ai_generate') {
      const generatorUrl = `${ARKAIOS_EDU_BASE}/generador-ia-imagenes.html?prompt=${encodeURIComponent(intent.topic)}&resolution=768x768&count=${normalized.count}&autostart=1`;
      return res.status(200).json({
        ok: true,
        mode: 'ai_generate',
        generatorUrl,
        intent,
        selectedTemplate
      });
    }

    // Modo: generar imágenes con IA en el cliente
    if (intent.source === 'ai') {
      return res.status(200).json({
        ok: true,
        mode: 'client_ai_generate',
        templateFile: selectedTemplate.file,
        templateLabel: selectedTemplate.name,
        grid: normalized.grid,
        topic: intent.topic,
        count: normalized.count,
        reasoning: `${intent.reasoning} | Generación de imágenes con IA en vivo`,
        baseUrl: ARKAIOS_EDU_BASE,
        pdfUrl: `${ARKAIOS_EDU_PDF_URL}?url=`
      });
    }

    // Solo usar orquestador si el usuario pidió un documento Y la plantilla es compatible
    const isOrchestrator = isDocumentRequest(request) && ORCHESTRATOR_COMPATIBLE_FILES.has(selectedTemplate.file);

    // Modo: plantilla con orquestador (documentos escolares)
    if (isOrchestrator) {
      const orchestrated = await fetchOrchestratedPrefill(request, intent.topic);
      const payload = encodeURIComponent(Buffer.from(JSON.stringify(orchestrated.workspace), 'utf8').toString('base64'));
      const templateUrl = `${ARKAIOS_EDU_BASE}/${selectedTemplate.file}?agent=1&topic=${encodeURIComponent(intent.topic)}&payload=${payload}`;
      const pdfUrl = `${ARKAIOS_EDU_PDF_URL}?url=${encodeURIComponent(templateUrl)}`;

      return res.status(200).json({
        ok: true,
        mode: 'prefill',
        templateUrl,
        pdfUrl,
        templateFile: selectedTemplate.file,
        templateLabel: selectedTemplate.name,
        templateSource: 'orchestrator-compatible',
        grid: normalized.grid,
        topic: intent.topic,
        reasoning: `${intent.reasoning} | Plantilla prellenada con ARKAIOS Orquestador: ${selectedTemplate.name}`,
        workspacePreview: orchestrated.workspace,
        catalogCount: catalog.length
      });
    }

    // Modo: plantilla con imágenes de Pexels (flujo principal)
    const images = await fetchImagesFromPexels(intent.topic, normalized.count);
    const imageUrls = images.map((item) => item.url).join('|');
    const templateUrl = `${ARKAIOS_EDU_BASE}/${selectedTemplate.file}?agent=1&grid=${normalized.grid}&images=${encodeURIComponent(imageUrls)}&topic=${encodeURIComponent(intent.topic)}`;
    const pdfUrl = `${ARKAIOS_EDU_PDF_URL}?url=${encodeURIComponent(templateUrl)}`;

    return res.status(200).json({
      ok: true,
      templateUrl,
      pdfUrl,
      templateFile: selectedTemplate.file,
      templateLabel: selectedTemplate.name,
      templateSource: BRIDGE_COMPATIBLE_FILES.has(selectedTemplate.file) ? 'bridge-compatible' : 'fallback-compatible',
      imageCount: images.length,
      grid: normalized.grid,
      topic: intent.topic,
      reasoning: `${intent.reasoning} | Plantilla conectada desde catalogo vivo: ${selectedTemplate.name}`,
      images,
      catalogCount: catalog.length
    });

  } catch (error) {
    console.error('[edu-agent] Error:', error);
    return res.status(500).json({
      error: 'Error procesando la peticion',
      details: error.message,
      stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
    });
  }
}
