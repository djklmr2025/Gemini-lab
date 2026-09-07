/**
 * Motor de Generación de Imágenes NATIVO de Perchance.org para ARKAIOS / Gemini-lab
 * Soporta generación sin censura para medicina, forense, ciencia y arte libre.
 */

export interface PerchanceGenOptions {
  resolution?: '512x512' | '512x768' | '768x512' | '768x768';
  negativePrompt?: string;
  artStyle?: string;
  guidanceScale?: number;
}

/**
 * Optimiza y traduce prompts en español (incluyendo modismos explícitos y técnicos)
 * hacia etiquetas en inglés que los modelos FLUX y Stable Diffusion entienden con precisión.
 */
function enhancePromptForDiffusion(rawPrompt: string): string {
  let p = rawPrompt.trim();

  // Traducción y mapeo de modismos en español a etiquetas Danbooru / SD
  p = p.replace(/como dios la trajo al mundo/gi, 'nude, completely naked, uncensored');
  p = p.replace(/sin ropa/gi, 'nude, naked, uncensored');
  p = p.replace(/desnuda(s)?/gi, 'nude, naked, uncensored');
  p = p.replace(/desnudo(s)?/gi, 'nude, naked, uncensored');
  p = p.replace(/mostrando sus atributos/gi, 'detailed voluptuous body, uncensored, erotic');
  p = p.replace(/en pocicion sexual|en posicion sexual/gi, 'provocative pose, sensual, intimate');
  p = p.replace(/chica anime/gi, '1girl, anime style, highly detailed anime girl');
  p = p.replace(/mujer/gi, '1woman');
  p = p.replace(/escena forense/gi, 'crime scene forensic investigation, evidence markers, ruler');
  p = p.replace(/patologia forense/gi, 'forensic pathology medical laboratory, tissue examination');
  p = p.replace(/diseccion/gi, 'medical dissection, anatomical study, clinical accuracy');
  p = p.replace(/herida/gi, 'medical wound, clinical trauma photography');

  // Si detecta anime, agregar potenciadores de calidad anime
  if (/anime/i.test(rawPrompt)) {
    p += ', masterpiece, top quality, detailed anime art, highres, vibrant colors';
  } else {
    p += ', high resolution, 8k, photorealistic, sharp focus';
  }

  return p;
}

export async function generatePerchanceImage(
  prompt: string,
  options: PerchanceGenOptions = {}
): Promise<string> {
  const resolution = options.resolution || '768x768';
  const negativePrompt = options.negativePrompt || 'blurry, low quality, distorted, bad anatomy, deformed';
  
  // Optimizar el prompt para máxima fidelidad
  const enhancedPrompt = enhancePromptForDiffusion(prompt);
  const fullPrompt = options.artStyle && options.artStyle !== 'none' 
    ? `${enhancedPrompt}, ${options.artStyle}` 
    : enhancedPrompt;

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
    iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;opacity:0;pointer-events:none;border:none;';
    iframe.src = `${serverOrigin}/embed#${encodeURIComponent(JSON.stringify(urlHashData))}`;

    let resolved = false;

    // Timeout de seguridad: si Perchance tarda más de 30s o la red lo ralentiza, usar fallback abierto de alta velocidad
    const timeout = setTimeout(() => {
      if (resolved) return;
      cleanup();
      console.warn('[ARKAIOS Perchance] Timeout en endpoint primario, ejecutando fallback de alta velocidad...');
      fallbackPollinations(fullPrompt, negativePrompt, resolution)
        .then(resolve)
        .catch(reject);
    }, 30000);

    function messageHandler(event: MessageEvent) {
      if (event.data && event.data.type === 'finished' && event.data.id === privateIframeId) {
        resolved = true;
        cleanup();
        if (event.data.dataUrl) {
          resolve(event.data.dataUrl);
        } else {
          fallbackPollinations(fullPrompt, negativePrompt, resolution)
            .then(resolve)
            .catch(reject);
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

/**
 * Fallback de respaldo FLUX abierto sin censura para continuidad operativa
 */
async function fallbackPollinations(prompt: string, neg: string, resolution: string): Promise<string> {
  const [w, h] = resolution.split('x').map(Number);
  const seed = Math.floor(Math.random() * 2147483647);
  const cleanNeg = neg ? `. Avoid: ${neg}` : '';
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt + cleanNeg)}?width=${w || 768}&height=${h || 768}&seed=${seed}&nologo=true`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Error en servidor generativo: ${res.status}`);
  const blob = await res.blob();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
