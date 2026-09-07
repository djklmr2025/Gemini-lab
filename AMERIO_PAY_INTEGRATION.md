# Integración de Pasarela de Pagos Amerio (AMR-IO) para Gemini Lab

> **Para:** Gemini (Asistente en Gemini Lab)  
> **De:** Antigravity / Ecosistema ARKAIOS  
> **Repositorio Pasarela:** `https://github.com/djklmr2025/Pasarela-de-pago-AMR` (en local: `c:\ARKAIOS\Pasarela-de-pago-AMR`)  
> **Servicio / Nodo Central:** `https://genimi44-by-wix-app44.web.app`

---

## 🎯 Instrucciones para Gemini Lab

Este archivo contiene la especificación para habilitar pagos, donaciones o recargas de créditos usando el token **Amerio (`AMR-IO`)** con **paridad fija 1 AMR-IO = $1.00 MXN**.

### 1. Crear el Componente `components/AmerioPayButton.tsx`
Crea el archivo `components/AmerioPayButton.tsx` con el siguiente código:

```tsx
import React, { useEffect, useState } from 'react';

declare global {
  interface Window {
    ArkaiosPay?: {
      open: (options: {
        amount: number;
        item: string;
        merchant?: string;
        orderId?: string;
        onSuccess?: (receipt: any) => void;
        onCancel?: () => void;
        onClose?: () => void;
        redirectUrl?: string;
      }) => void;
    };
  }
}

interface AmerioPayButtonProps {
  amount: number;
  itemTitle: string;
  orderId?: string;
  merchantId?: string;
  onPaymentSuccess?: (receipt: any) => void;
  className?: string;
}

export const AmerioPayButton: React.FC<AmerioPayButtonProps> = ({
  amount,
  itemTitle,
  orderId,
  merchantId = 'ARK-GEMINI-LAB',
  onPaymentSuccess,
  className = "px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-xs shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
}) => {
  const [sdkReady, setSdkReady] = useState(false);

  useEffect(() => {
    const scriptId = 'arkaios-pay-sdk';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://genimi44-by-wix-app44.web.app/sdk/arkaios-pay.js';
      script.async = true;
      script.onload = () => setSdkReady(true);
      script.onerror = () => {
        console.warn("Fallo carga desde nodo primario, usando fallback...");
        const fallbackScript = document.createElement('script');
        fallbackScript.src = 'https://arkaios.dpdns.org/sdk/arkaios-pay.js';
        fallbackScript.async = true;
        fallbackScript.onload = () => setSdkReady(true);
        document.body.appendChild(fallbackScript);
      };
      document.body.appendChild(script);
    } else {
      setSdkReady(true);
    }
  }, []);

  const handleCheckout = () => {
    if (!window.ArkaiosPay) {
      alert('Iniciando módulo de cobro Amerio...');
      return;
    }

    window.ArkaiosPay.open({
      amount: amount,
      item: itemTitle,
      orderId: orderId || `GEMINI-${Date.now().toString().slice(-6)}`,
      merchant: merchantId,
      onSuccess: (receipt) => {
        console.log('✅ Pago Aprobado con Amerio:', receipt);
        if (onPaymentSuccess) {
          onPaymentSuccess(receipt);
        }
      },
      onCancel: () => {
        console.log('Pago cancelado.');
      }
    });
  };

  return (
    <button onClick={handleCheckout} className={className}>
      <span>Pagar con Amerio</span>
      <span className="font-mono bg-black/20 px-2 py-0.5 rounded text-[11px]">
        ${amount.toFixed(2)} AMR-IO
      </span>
    </button>
  );
};

export default AmerioPayButton;
```

### 2. Dónde ubicar el botón en Gemini Lab
Puedes colocar este botón:
- En `components/VideoGen.tsx` para cobrar por generación de video con modelo Veo.
- En `components/ArkaiosComponents.tsx` en el sidebar de acciones del ecosistema.
- En un modal de recarga de créditos o suscripción para Reze.

### 3. Parámetros del Protocolo Amerio
- **Token:** `AMR-IO`
- **Tasa de cambio:** $1.00 MXN = 1 AMR-IO
- **Bóveda:** `ARK-TREASURE`
- **SDK Web:** `https://genimi44-by-wix-app44.web.app/sdk/arkaios-pay.js`
- **SDK Agente Node/TS:** `https://genimi44-by-wix-app44.web.app/sdk/arkaios-agent.ts`
- **SDK Agente Python:** `https://genimi44-by-wix-app44.web.app/sdk/arkaios-agent.py`
