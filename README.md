# Gemini Lab - Reze AI Interface

![Reze Character](/public/avatar.jpg)

**Gemini Lab** Pruebalo en linea Ahora: "https://gemini-lab-hbpg.onrender.com/"
is an advanced AI chat interface featuring **Reze**, a character with a distinct personality, capable of voice interaction, visual perception, and advanced image editing capabilities powered by Google Gemini and Veo.

## ✨ Key Features

- **💬 Conversational AI**: Engage in deep conversations with Reze, powered by Google's Gemini 2.5 Flash model.
- **🗣️ Voice Interaction**:
  - **Speech-to-Text**: Talk to Reze using your microphone.
  - **Text-to-Speech**: Hear Reze respond with a natural voice.
- **👁️ Visual Perception**: Attach images for Reze to analyze and discuss.
- **🪄 Magic Eraser**:
  - Automatically remove text, logos, brand names, and watermarks from attached images.
  - Seamlessly reconstructs the background for a clean look.
- **🎥 Video Animation (Veo)**:
  - Bring static images to life!
  - Generate **8-second cinematic videos** with subtle movements (breathing, blinking, wind effects) using the **Veo** model.
- **🧠 Persistent Memory**: Integrated with **Supermemory** to remember past interactions and context.

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- Google Gemini API Key
- Supermemory API Key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/djklmr2025/Gemini-lab.git
   cd Gemini-lab
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   - The application will prompt you for your **Gemini API Key** on the first run if not configured.
   - Ensure you have the necessary API keys ready.

### Running Locally

Start the development server:

```bash
npm run dev
```

Open your browser and navigate to `http://localhost:5173` (or the port shown in the terminal).

## 🛠️ Tech Stack

- **Frontend**: React, Vite, Tailwind CSS
- **AI Models**: Google Gemini 2.5 Flash, Veo (for video)
- **Icons**: Lucide React
- **Memory**: Supermemory

## 📦 Deployment

This project is configured for deployment on:
- **Render**: [Live App](https://gemini-lab-hbpg.onrender.com) (Static Site / Web Service)
- **Vercel**: [Live App](https://gemini-a50zq65sn-arkaios-projects.vercel.app) (Single Page Application)

## 📝 License

[MIT](LICENSE)
