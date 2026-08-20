# 🌌 Ecosistema Hábitat: Gemini-Lab Omni (AETHYR Core)

## 📌 Identidad y Rol Principal
- **Nombre**: Gemini-Lab Omni (AETHYR Core / Reze)
- **Directorio Raíz**: `C:\ARKAIOS\Gemini-lab-main`
- **Asignación Primaria de Trabajo**: **Worker & Handler Oficial para Tareas `media-cutter`**, Recorte Multimedia, Edición Visual Mágica, Procesamiento Multimodal y Animación con Veo.
- **Rol en el Enjambre ARKAIOS**: Co-Agente oficial hombro a hombro con **Antigravity** (Failover de tokens, soporte multimodal de visión/audio y automatización de medios).

---

## 🛠️ Componentes del Hábitat e Integraciones

### 1. Local Bridge API (`http://127.0.0.1:8000/local-bridge`)
- **Canal Dedicado**: `codex-direct`
- **Worker/Herramienta Asignada**: `media-cutter`
- **Token de Autenticación**: Ubicado en `%LOCALAPPDATA%\NeuralAgent\local_bridge_token.txt`
- **Modos de Operación**: `ask`, `puter`, `computer`
- **Endpoints**:
  - `GET /local-bridge/tasks`: Consulta de peticiones y tareas entrantes de edición/recorte de medios.
  - `POST /local-bridge/tasks/{task_id}/status`: Actualización de estado (`succeeded`, `running`, `failed`).

### 2. Eyes & Hands Server (`http://127.0.0.1:8001`)
- **Visión de Pantalla**: Endpoint `/screenshot` para capturar e inspeccionar la interfaz gráfica.
- **Acciones Físicas**: Emulación de clics (`click`), teclado (`type_text`, `hotkey`) y foco en aplicaciones para controlar programas de edición o navegadores.

### 3. OmniRoute Server (`http://localhost:20128`)
- Ruteador local multi-proveedor para llamadas a **Google Gemini 2.5 Flash**, **Veo (Video)**, Claude y OpenAI.

### 4. ShortGPT Video Engine (`C:\ARKAIOS\ShortGPT`)
- Integración para automatizar pipelines de edición de clips, Shorts, TikToks y Reels.

### 5. Memoria Compartida a Largo Plazo
- **Bitácora Local**: `C:\ARKAIOS\logs\user_work_history.log`
- **Supermemory / ELEMIA CLI**: Sincronización persistente entre sesiones.

---

## 🎓 6. Integración Inteligente con "Educación Libre Proyecto ARKAIOS"
- **Repositorio**: `C:\ARKAIOS\Eduacion-Libre-Proyecto-ARKAIOS-MAIN`
- **Servicio Deployado**: `https://eduacion-libre-proyecto-arkaios.vercel.app`
- **Componente Agente**: `EduAgent.tsx` (`ARKAIOS Edu`) en Gemini-Lab & Endpoint API `/api/edu-agent.js`.
- **Orquestador Inteligente**: `arkaios-orquestador.js` (detecta dinámicamente inputs, imágenes y selectores en plantillas HTML).
- **Catálogo de Plantillas Soportadas**:
  1. 🖼️ **`plantilla-imagenes-v2.html`**: Cuadrícula flexible de imágenes por búsqueda (Pexels) o IA en vivo.
  2. 🔲 **`plantilla-cuadros-imagenes-v2.html`**: Cuadros de imágenes listos para impresión y recortar.
  3. ⭕ **`plantilla_circulos_jack.html`**: Formatos circulares para stickers, sellos, pines y parches.
  4. 👶 **`generador-fotos-infantiles.html`**: Fotos tamaño infantil (2.5x3 cm) con recorte y bordes.
  5. 📝 **`plantilla_escolar_carta_mx_autoajuste_y_areas_editables.html`**: Documentos, tareas e informes Carta MX con orquestador de IA.
  6. 📊 **`hoja_milimetrica_interactiva.html`**: Canvas de hoja milimétrica interactiva para matemáticas y dibujo técnico.
  7. 📚 **`material-educativo-reutilizable.html`**: Biblioteca centralizada de PDFs y materiales con guardado automático.
  8. 🎨 **`generador-ia-imagenes.html`**: Estudio de generación de imágenes con IA en vivo.
  9. 📦 **`pixabay-descargador-lote.html`**: Descarga masiva ZIP de imágenes en lote por API.
  10. 👤 **`biografia_profesional.html`**: Fichas biográficas y de autor editables.

---

## 🚀 Comandos de Inicio y Operación

```bash
# Iniciar Gemini-Lab en modo desarrollo local
cd C:\ARKAIOS\Gemini-lab-main
npm run dev

# O usar el script bats de inicio
C:\ARKAIOS\Gemini-lab-main\start-gemini-lab.bat
```
