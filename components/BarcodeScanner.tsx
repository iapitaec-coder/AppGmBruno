import React, { useEffect, useRef, useState } from 'react';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScan, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let animationFrameId: number | null = null;
    let isMounted = true;

    if (!('BarcodeDetector' in window)) {
      setError('El escáner de códigos de barras no es compatible con este navegador.');
      return;
    }
    
    // Type definition for BarcodeDetector, since it might not be in default TS libs
    const BarcodeDetector = (window as any).BarcodeDetector;

    const startScan = async () => {
      try {
        const barcodeDetector = new BarcodeDetector({
          formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code']
        });
        
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        const detect = async () => {
          if (!isMounted) return;

          if (videoRef.current && barcodeDetector && videoRef.current.readyState === 4) {
            try {
              const barcodes = await barcodeDetector.detect(videoRef.current);
              if (barcodes.length > 0 && isMounted) {
                  onScan(barcodes[0].rawValue);
                  // No need to call onClose here as it is handled by the parent
                  return; // Stop scanning
              }
            } catch (detectError) {
                console.error("Barcode detection error:", detectError);
            }
          }
          if (isMounted) {
            animationFrameId = requestAnimationFrame(detect);
          }
        }
        detect();

      } catch (err) {
        console.error('Error accessing camera:', err);
        if (err instanceof Error) {
            if (err.name === 'NotAllowedError') {
                setError('Permiso de cámara denegado. Por favor, habilite el acceso a la cámara en la configuración de su navegador.');
            } else {
                 setError(`Error al iniciar la cámara: ${err.message}`);
            }
        } else {
            setError('Ocurrió un error desconocido al acceder a la cámara.');
        }
      }
    };

    startScan();

    return () => {
      isMounted = false;
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center z-50 p-4">
      <div className="relative w-full max-w-lg bg-white rounded-lg shadow-xl">
        <div className="p-4 sm:p-6">
            <h3 className="text-lg font-medium text-center mb-2 text-slate-800">Escanear Código de Barras</h3>
            <p className="text-sm text-center text-slate-500 mb-4">Apunta la cámara al código del producto.</p>
            <div className="relative w-full aspect-video bg-slate-900 rounded-md overflow-hidden shadow-inner">
                <video ref={videoRef} className="w-full h-full object-cover" playsInline />
                <div className="absolute inset-0 flex items-center justify-center p-4">
                    <div className="w-full h-1/2 border-4 border-white border-opacity-50 rounded-lg" style={{boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)'}}></div>
                </div>
            </div>
            
            {error && <p className="text-sm text-center text-red-600 mt-4 bg-red-50 p-3 rounded-md">{error}</p>}
        </div>
        
        <div className="px-4 sm:px-6 py-3 bg-slate-50 rounded-b-lg">
            <button 
                onClick={onClose} 
                className="w-full inline-flex justify-center py-2 px-4 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
                Cancelar
            </button>
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner;
