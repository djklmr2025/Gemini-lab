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
  label?: string;
}

export const AmerioPayButton: React.FC<AmerioPayButtonProps> = ({
  amount,
  itemTitle,
  orderId,
  merchantId = 'ARK-GEMINI-LAB',
  onPaymentSuccess,
  className = "px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-xs shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer",
  label = "Pagar con Amerio"
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
        console.warn("Fallo carga desde nodo primario, usando fallback dpdns...");
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
      alert('Iniciando pasarela de cobro Amerio (AMR-IO)...');
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
        console.log('Pago cancelado por el usuario.');
      }
    });
  };

  return (
    <button onClick={handleCheckout} className={className}>
      <span>{label}</span>
      <span className="font-mono bg-black/20 px-2 py-0.5 rounded text-[11px]">
        ${amount.toFixed(2)} AMR-IO
      </span>
    </button>
  );
};

export default AmerioPayButton;
