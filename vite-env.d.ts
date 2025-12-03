/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_GOOGLE_API_KEY: string
    readonly VITE_GROK_API_KEY: string
    readonly VITE_SUPERMEMORY_API_KEY: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
