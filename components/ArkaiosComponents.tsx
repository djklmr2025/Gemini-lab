import React from 'react';

// ============================================================================
// KIT DE INTERFAZ DE MANDO ARKAIOS (V3.0)
// Integra estos componentes en el Sidebar o bajo el botón de Chat de Reze
// ============================================================================

/**
 * Grupo de Botones de Navegación del Ecosistema
 * Estilo: Neón/Cyberpunk, alineación vertical para Sidebar
 */
export const ArkaiosSidebarActions = () => {

    const handleNav = (url: string) => {
        window.open(url, '_blank');
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            marginTop: '20px',
            padding: '15px',
            borderTop: '1px solid rgba(124, 58, 237, 0.3)', // Violeta tenue
            width: '100%'
        }}>
            <div style={{ fontSize: '0.8rem', color: '#a78bfa', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Ecosistema Arkaios
            </div>

            {/* BOTÓN: EL JUEGO DEL GACHAPON EN WLD */}
            <button
                onClick={() => handleNav('https://world.org/es-la/ecosystem/app_20370726003816e5864dbb8485228960')}
                style={neonButtonStyle('#ffffff')} // Blanco/Plata
            >
                <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '10px',
                    boxShadow: '0 0 10px rgba(255,255,255,0.8)',
                    flexShrink: 0
                }}>
                    <span style={{ color: 'black', fontSize: '12px', fontWeight: 'bold' }}>W</span>
                </div>
                <span style={{ fontSize: '0.8rem', lineHeight: '1.2' }}>EL JUEGO DEL GACHAPON EN WLD</span>
            </button>



            {/* BOTÓN 4: EDUCACIÓN LIBRE ARKAIOS — DONACIÓN $100 AMR */}
            <button
                onClick={() => handleNav('https://eduacion-libre-proyecto-arkaios.vercel.app/')}
                style={neonButtonStyle('#f59e0b')} // Oro / Amber
            >
                <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ marginRight: '8px' }}>🎓</span>
                        <span style={{ fontSize: '0.82rem', fontWeight: 'bold' }}>EDUCACIÓN LIBRE ARKAIOS</span>
                    </div>
                    <span style={{ fontSize: '0.68rem', color: '#fef08a', fontWeight: '500', marginTop: '2px', opacity: 0.9 }}>
                        Donación vitalicia $100 AMR • Licencia no comercial
                    </span>
                </div>
            </button>

            {/* BOTÓN 5: YOUTUBE EXTRACTOR */}
            <button
                onClick={() => handleNav('https://youtube-hd-downloader.vercel.app/')}
                style={neonButtonStyle('#ef4444')} // Rojo YouTube
            >
                <span style={{ marginRight: '8px' }}>📹</span>
                EXTRAE TU PLAYLIST
            </button>
        </div>
    );
};

// Helper de estilos para mantener el código limpio
const neonButtonStyle = (color: string): React.CSSProperties => ({
    background: `linear-gradient(90deg, ${color}22 0%, transparent 100%)`, // Fondo semitransparente con gradiente
    border: `1px solid ${color}`,
    borderLeft: `4px solid ${color}`, // Borde izquierdo más grueso
    borderRadius: '4px',
    padding: '12px 16px',
    color: 'white',
    fontWeight: '600',
    fontFamily: '"Orbitron", sans-serif', // Fuente futurista si está disponible
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.3s ease',
    boxShadow: `0 0 10px ${color}44`,
    display: 'flex',
    alignItems: 'center',
});

// ============================================================================
// INSTRUCCIONES DE CURP (Lógica Frontend)
// ============================================================================
/*
  Función auxiliar que Reze puede usar internamente para pre-validar
  antes de mandar la petición a la API.
*/
export const validateMexicanIdentity = (curp: string, phone: string) => {
    // Regex oficial de CURP
    const curpRegex = /^[A-Z]{1}[AEIOU]{1}[A-Z]{2}[0-9]{2}(0[1-9]|1[0-2])(0[1-9]|1[0-9]|2[0-9]|3[0-1])[HM]{1}(AS|BC|BS|CC|CL|CM|CS|CH|DF|DG|GT|GR|HG|JC|MC|MN|MS|NT|NL|OC|PL|QT|QR|SP|SL|SR|TC|TS|TL|VZ|YN|ZS|NE)[B-DF-HJ-NP-TV-Z]{3}[0-9A-Z]{1}[0-9]{1}$/;

    // Validación Teléfono (10 dígitos)
    const phoneRegex = /^[0-9]{10}$/;

    if (!curpRegex.test(curp.toUpperCase())) {
        return { valid: false, msg: "El CURP no tiene un formato válido. Verificalo." };
    }
    if (!phoneRegex.test(phone)) {
        return { valid: false, msg: "El teléfono debe ser de 10 dígitos." };
    }

    return { valid: true, msg: "Formatos válidos. Procediendo a verificación en servidor." };
};
