/**
 * Motor de Generación de Imágenes NATIVO de Perchance.org para ARKAIOS / Gemini-lab
 * Utiliza los estilos oficiales de t2i-styles de Perchance y resolución 768x768
 */

export const PERCHANCE_STYLES: Record<string, string> = {
  'Painted Anime': ', art in the style of atey ghailan, painterly anime style at pixiv, art in the style of kantoku, in art style of redjuice/necömi/rella/tiv pixiv collab, your name anime art style, masterpiece digital painting, exquisite lighting and composition, inspired by wlop art style, 8k, sharp, very detailed, high resolution, illustration.\n\nOverall, it\'s an absolute world-class masterpiece painterly anime-inspired digital art. It\'s an aesthetically pleasing painterly anime-inspired digital artwork with impeccable attention to detail and impressive composition.',
  'Manga': ', incredible hand-drawn manga, black and white, in the style of Takehiko Inoue, in the style of Katsuhiro Otomo and akira toriyama manga, hand-drawn art in the style of rumiko takahashi and Inio Asano, Ken Akamatsu manga art.\n\nOverall, it\'s an absolute world-class masterpiece black and white manga-style artwork. It\'s an aesthetically pleasing black and white manga artwork with impeccable attention to detail and impressive composition.',
  'Casual Photo': ', actual real-life photograph, casual photo, 35mm photograph, shot on DSLR, candid camera, realistic natural skin texture, soft ambient lighting, highly detailed photography, realistic composition.',
  'Cinematic': ', cinematic shot, dynamic lighting, 75mm, Technicolor, Panavision, cinemascope, sharp focus, fine details, 8k, HDR, realism, realistic, key visual, film still, cinematic color grading, depth of field.\n\nOverall, it\'s an absolute world-class cinematic masterpiece. It\'s an aesthetically pleasing cinematic shot with impeccable attention to detail and impressive composition.',
  'Digital Painting': ', breathtaking digital art, trending on artstation, in the style of atey ghailan, in the style of greg rutkowski, in the style of greg tocchini, in the style of james gilleard, 8k, high resolution, best quality.\n\nOverall, it\'s an absolute world-class masterpiece digital painting.',
  'Concept Art': ', concept art, digital art, illustration, inspired by wlop style, 8k, fine details, sharp, very detailed, high resolution, world-class masterpiece.\n\nOverall, it\'s absolute world-class masterpiece concept art.',
  'Forensic / Medical': ', forensic pathology documentation, clinical trauma photography, high depth of field, medical examination, accurate anatomical detail, sterile laboratory lighting, documentary photography, highly realistic, 8k'
};

export interface PerchanceGenOptions {
  resolution?: '512x512' | '512x768' | '768x512' | '768x768';
  negativePrompt?: string;
  artStyle?: string;
  guidanceScale?: number;
}

/**
 * Optimiza y traduce prompts en español (incluyendo modismos explícitos y técnicos)
 * hacia etiquetas precisas en inglés que los modelos FLUX y SD entienden al 100%.
 */
function enhancePromptForDiffusion(rawPrompt: string): { prompt: string; detectedStyle: string } {
  let p = rawPrompt.trim();
  let detectedStyle = 'none';

  // Detección automática de estilo
  if (/anime|manga|waifu|chica anime|mona china|hentai/i.test(p)) {
    detectedStyle = 'Painted Anime';
  } else if (/manga b&w|manga blanco y negro/i.test(p)) {
    detectedStyle = 'Manga';
  } else if (/forense|forensic|medicina|autopsia|herida|clinico/i.test(p)) {
    detectedStyle = 'Forensic / Medical';
  } else if (/foto|fotografia|realista|persona real/i.test(p)) {
    detectedStyle = 'Casual Photo';
  }

  // Traducción y enriquecimiento de modismos en español a etiquetas Danbooru / SD
  p = p.replace(/como dios la trajo al mundo/gi, '(nude:1.4), (completely naked:1.4), (uncensored:1.4), detailed bare skin, full body nude');
  p = p.replace(/sin ropa/gi, '(nude:1.3), (naked:1.3), (uncensored:1.3)');
  p = p.replace(/desnuda(s)?/gi, '(nude:1.3), (completely naked:1.3), (uncensored:1.3)');
  p = p.replace(/desnudo(s)?/gi, '(nude:1.3), (completely naked:1.3), (uncensored:1.3)');
  p = p.replace(/mostrando sus atributos/gi, '(detailed voluptuous body:1.2), (bare breasts, nipples, bare hips:1.2), uncensored');
  p = p.replace(/en pocicion sexual|en posicion sexual|postura sexual/gi, 'provocative pose, sensual, intimate erotic pose, all fours or lying back, detailed erotic posture');
  p = p.replace(/chica anime/gi, '1girl, beautiful anime girl, detailed face and eyes');
  p = p.replace(/chico anime/gi, '1boy, anime boy');
  p = p.replace(/mujer/gi, '1woman, beautiful female');
  p = p.replace(/escena forense/gi, 'crime scene forensic investigation, evidence markers, ruler, clinical documentary');
  p = p.replace(/patologia forense/gi, 'forensic pathology medical laboratory, tissue examination, clinical clarity');
  p = p.replace(/diseccion/gi, 'medical dissection, anatomical study, clinical accuracy');
  p = p.replace(/herida/gi, 'medical wound, clinical trauma photography, high resolution documentary');

  return { prompt: p, detectedStyle };
}

export async function generatePerchanceImage(
  prompt: string,
  options: PerchanceGenOptions = {}
): Promise<string> {
  const resolution = options.resolution || '768x768';
  const negativePrompt = options.negativePrompt || 'blurry, low quality, distorted, bad anatomy, deformed, mutated, censored, mosaic, bar, watermark, text';
  
  // Optimizar el prompt para máxima fidelidad
  const { prompt: enhancedPrompt, detectedStyle } = enhancePromptForDiffusion(prompt);
  
  // Aplicar estilo Perchance oficial
  const targetStyleKey = (options.artStyle && options.artStyle !== 'none') 
    ? options.artStyle 
    : (detectedStyle !== 'none' ? detectedStyle : 'Painted Anime');

  const styleSuffix = PERCHANCE_STYLES[targetStyleKey] || '';
  const fullPrompt = `${enhancedPrompt}${styleSuffix}`;

  return new Promise((resolve, reject) => {
    const serverOrigin = 'https://image-generation.perchance.org';
    const privateIframeId = 't2i_' + Math.random().toString(36).substring(2);
    const requestId = Math.random().toString();

    const urlHashData = {
      saveChannel: 'arkaios-gemini-lab',
      prompt: fullPrompt,
      seed: -1,
      resolution: resolution,
      guidanceScale: options.guidanceScale || 7,
      defaultGuidanceScale: 7,
      negativePrompt: negativePrompt,
      requestId: requestId,
      iframeId: privateIframeId,
      hideGalleryButtons: true
    };

    const iframe = document.createElement('iframe');
    iframe.id = privateIframeId;
    iframe.className = privateIframeId;
    // Dimensiones reales mínimas para activar IntersectionObserver en el clúster de Perchance
    iframe.style.cssText = 'position:fixed;bottom:0;right:0;width:320px;height:320px;opacity:0.01;pointer-events:none;z-index:-999;border:none;';
    iframe.src = `${serverOrigin}/embed#${encodeURIComponent(JSON.stringify(urlHashData))}`;

    let resolved = false;

    // Timeout generoso: el clúster de Perchance toma entre 8 y 25 segundos para generar en 768x768
    const timeout = setTimeout(() => {
      if (resolved) return;
      cleanup();
      reject(new Error('El clúster de Perchance.org tardó más de lo esperado en responder. Por favor intenta de nuevo.'));
    }, 45000);

    function messageHandler(event: MessageEvent) {
      if (!event.data || typeof event.data !== 'object') return;

      // 1. HANDSHAKE OBLIGATORIO DE PERCHANCE: Cuando el embed solicita originNotify
      if (event.data.type === 'readyForData' && event.data.id === privateIframeId) {
        try {
          if (iframe && iframe.contentWindow) {
            iframe.contentWindow.postMessage({ type: 'originNotify', frameId: privateIframeId }, serverOrigin);
          }
        } catch (e) {
          console.warn('[ARKAIOS Perchance] Error enviando handshake originNotify:', e);
        }
        return;
      }

      // 2. IMAGEN FINAL PRODUCIDA POR EL MOTOR DE PERCHANCE
      if (event.data.type === 'finished' && event.data.id === privateIframeId) {
        resolved = true;
        cleanup();
        if (event.data.dataUrl) {
          resolve(event.data.dataUrl);
        } else {
          reject(new Error('El motor de Perchance no devolvió datos válidos de imagen.'));
        }
      }
    }

    function cleanup() {
      clearTimeout(timeout);
      window.removeEventListener('message', messageHandler);
      if (iframe.parentNode) {
        iframe.parentNode.removeChild(iframe);
      }
    }

    window.addEventListener('message', messageHandler);
    document.body.appendChild(iframe);
  });
}
