import React, { useEffect, useRef, useState, useCallback } from 'react';
import { RefreshCw, X, CheckCircle2, CameraOff, ImagePlus, Eye, EyeOff, Lock, ShieldCheck } from 'lucide-react';
import { AppContextType } from '../types';

interface MockCameraAppProps {
  context: AppContextType;
  onNavigate: (tab: 'settings' | 'camera') => void;
}

export const MockCameraApp: React.FC<MockCameraAppProps> = ({ context, onNavigate }) => {
  const { state, setImage, toggleActive, setTransform } = context;
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isSimulated, setIsSimulated] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [captured, setCaptured] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [flash, setFlash] = useState(false);

  // Helper to safely stop tracks
  const stopTracks = (mediaStream: MediaStream | null) => {
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => {
        try {
          track.stop();
        } catch (e) {
          console.error("Error stopping track:", e);
        }
      });
    }
  };

  // Robust Camera Initialization Effect
  useEffect(() => {
    let mounted = true;
    let currentStream: MediaStream | null = null;

    const initCamera = async () => {
      setIsLoading(true);
      setPermissionDenied(false);
      setIsSimulated(false);

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        if (mounted) {
          console.warn("Camera API not supported");
          setIsSimulated(true);
          setIsLoading(false);
        }
        return;
      }

      try {
        let mediaStream: MediaStream;
        try {
          // Attempt environment camera
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' },
            audio: false,
          });
        } catch (firstErr: any) {
          if (firstErr.name === 'NotAllowedError' || firstErr.name === 'PermissionDeniedError') {
             throw firstErr;
          }
          console.warn("Environment camera failed, trying fallback...", firstErr);
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        }

        if (!mounted) {
          stopTracks(mediaStream);
          return;
        }

        currentStream = mediaStream;
        setStream(mediaStream);
        setIsLoading(false);

      } catch (err: any) {
        if (!mounted) return;
        
        setIsLoading(false);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          console.warn("Camera permission denied.");
          setPermissionDenied(true);
        } else {
          console.error("Camera initialization failed:", err);
          setIsSimulated(true);
        }
      }
    };

    initCamera();

    return () => {
      mounted = false;
      stopTracks(currentStream);
      setStream(null);
    };
  }, []);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, state.isActive]);

  const triggerDownload = (dataUrl: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `vcam_capture_${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGalleryClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setImage(reader.result);
          toggleActive(true); 
          setTransform({ scale: 1, x: 0, y: 0, rotation: 0 });
        }
      };
      reader.readAsDataURL(file);
    }
    if (e.target) e.target.value = '';
  };

  const handleCapture = useCallback(() => {
    setFlash(true);
    setTimeout(() => setFlash(false), 150);

    // 1. Virtual Mode
    if (state.isActive && state.selectedImage && containerRef.current) {
        const container = containerRef.current;
        const dpr = window.devicePixelRatio || 1;
        
        const canvas = document.createElement('canvas');
        const rect = container.getBoundingClientRect();
        
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
           ctx.scale(dpr, dpr);
           const img = new Image();
           img.crossOrigin = "anonymous";
           img.onload = () => {
               ctx.fillStyle = '#000';
               ctx.fillRect(0, 0, rect.width, rect.height);

               let renderW, renderH;
               if (state.maintainAspectRatio) {
                 const imgAspect = img.width / img.height;
                 const canvasAspect = rect.width / rect.height;
                 if (imgAspect > canvasAspect) {
                     renderH = rect.height;
                     renderW = img.width * (rect.height / img.height);
                 } else {
                     renderW = rect.width;
                     renderH = img.height * (rect.width / img.width);
                 }
               } else {
                 renderW = rect.width;
                 renderH = rect.height;
               }
               
               ctx.save();
               ctx.translate(rect.width / 2, rect.height / 2);
               ctx.translate(state.transform.x, state.transform.y);
               ctx.rotate((state.transform.rotation * Math.PI) / 180);
               ctx.scale(state.transform.scale, state.transform.scale);
               ctx.drawImage(img, -renderW / 2, -renderH / 2, renderW, renderH);
               ctx.restore();

               const finalDataUrl = canvas.toDataURL('image/jpeg', 0.92);
               setCapturedImage(finalDataUrl);
               setCaptured(true);
               triggerDownload(finalDataUrl);
           };
           img.src = state.selectedImage!;
        }
        return;
    } 
    
    // 2. Real Camera Mode
    if (!isSimulated && !permissionDenied && videoRef.current && videoRef.current.readyState >= 2) {
      try {
        const video = videoRef.current;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          
          setCapturedImage(dataUrl);
          setCaptured(true);
          triggerDownload(dataUrl);
        }
      } catch (e) {
        console.error("Capture failed:", e);
      }
      return;
    }

    // 3. Fallback
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#101010';
      ctx.fillRect(0, 0, 640, 480);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.80);
      setCapturedImage(dataUrl);
      setCaptured(true);
      triggerDownload(dataUrl);
    }
  }, [state.isActive, state.selectedImage, state.transform, state.maintainAspectRatio, isSimulated, permissionDenied, setImage, setTransform, toggleActive]);

  // Toast Auto-dismiss
  useEffect(() => {
    if (captured) {
      const timer = setTimeout(() => setCaptured(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [captured]);

  const showVirtualFeed = state.isActive && state.selectedImage;

  const handleRetry = () => {
      onNavigate('settings');
      setTimeout(() => onNavigate('camera'), 50);
  };

  const handleVirtualToggle = () => {
    if (state.selectedImage) {
        toggleActive(!state.isActive);
    } else {
        handleGalleryClick();
    }
  };

  return (
    <div className="flex flex-col h-full bg-black relative text-white">
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />

      {/* Flash Effect */}
      <div className={`absolute inset-0 bg-white z-50 pointer-events-none transition-opacity duration-150 ease-out ${flash ? 'opacity-80' : 'opacity-0'}`} />

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
        <div className="flex justify-between items-center pointer-events-auto">
          <X className="text-white/90 cursor-pointer hover:text-white transition-colors drop-shadow-md" onClick={() => onNavigate('settings')} size={28} />
          <div className="flex flex-col items-center">
             <span className="font-semibold text-lg tracking-wide drop-shadow-md">Kamera</span>
             {state.isActive && state.selectedImage && (
                 <div className="flex items-center gap-1 mt-1">
                   <ShieldCheck size={12} className="text-green-400" />
                   <span className="text-[10px] font-bold text-green-400 tracking-wider">ROOTSIZ REJIM</span>
                 </div>
             )}
          </div>
          <RefreshCw className="text-white/90 cursor-pointer hover:text-white transition-colors drop-shadow-md" size={24} onClick={handleRetry} />
        </div>
      </div>

      {/* Main Viewport */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-gray-900">
        {showVirtualFeed ? (
           <div ref={containerRef} className="w-full h-full relative overflow-hidden">
             <img 
               src={state.selectedImage!} 
               alt="Virtual Feed" 
               className="absolute w-full h-full object-cover"
               style={{
                 transform: `translate(${state.transform.x}px, ${state.transform.y}px) rotate(${state.transform.rotation}deg) scale(${state.transform.scale})`,
                 transformOrigin: 'center',
                 objectFit: state.maintainAspectRatio ? 'cover' : 'fill'
               }}
             />
             <div className="absolute top-4 right-4 bg-red-600 text-white text-[10px] px-2 py-0.5 rounded shadow-sm font-bold uppercase z-30 flex items-center gap-1.5">
               <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div> JONLI
             </div>
           </div>
        ) : (
          <div className="w-full h-full relative bg-black flex items-center justify-center">
             {isLoading ? (
                <div className="flex flex-col items-center gap-3 text-gray-400">
                  <div className="w-8 h-8 border-2 border-t-blue-500 border-gray-600 rounded-full animate-spin"></div>
                  <span className="text-xs tracking-wider">YUKLANMOQDA</span>
                </div>
             ) : permissionDenied ? (
                <div className="flex flex-col items-center justify-center text-center p-6 animate-in fade-in zoom-in-95 duration-300">
                   <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4 text-red-500">
                      <CameraOff size={32} />
                   </div>
                   <h3 className="text-white font-bold text-lg mb-2">Kameraga ruxsat yo'q</h3>
                   <p className="text-gray-400 text-sm mb-6 max-w-[240px]">
                     Siz baribir galereyadan rasm yuklab virtual kameradan foydalanishingiz mumkin.
                   </p>
                   <button onClick={handleGalleryClick} className="flex items-center gap-2 px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium text-sm transition-all border border-gray-700">
                     <ImagePlus size={16} /> Rasm Yuklash
                   </button>
                </div>
             ) : isSimulated ? (
                <div className="flex flex-col items-center justify-center text-gray-500 gap-2">
                   <CameraOff size={24} />
                   <span className="text-xs">Signal Yo'q</span>
                </div>
             ) : (
               <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform scale-100" />
             )}
          </div>
        )}

        {/* Viewfinder Overlay */}
        {!isLoading && !permissionDenied && (
          <div className="absolute inset-0 pointer-events-none opacity-50">
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-white/30 rounded-lg">
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-white"></div>
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-white"></div>
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-white"></div>
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-white"></div>
             </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="h-36 bg-black flex flex-col justify-end pb-8 z-20">
         <div className="flex items-center justify-around px-8">
            <button 
                onClick={handleGalleryClick} 
                className={`w-12 h-12 rounded-full border flex items-center justify-center overflow-hidden transition-all active:scale-90 duration-200 ${
                  state.selectedImage && state.isActive 
                    ? 'bg-green-900/30 border-green-500' 
                    : 'bg-gray-900 border-gray-700 hover:border-gray-500'
                }`}
                title="Galereyadan tanlash"
            >
              {state.selectedImage ? (
                <img src={state.selectedImage} className="w-full h-full object-cover opacity-80" alt="Gallery" />
              ) : (
                 <ImagePlus size={20} className="text-gray-400" />
              )}
            </button>

            <button 
              onClick={handleCapture}
              disabled={isLoading}
              className={`w-20 h-20 rounded-full border-[5px] flex items-center justify-center transition-all duration-150 active:scale-95 ${
                 isLoading ? 'border-gray-700 opacity-50' : 'border-white hover:bg-white/10'
              }`}
            >
              <div className={`w-16 h-16 rounded-full ${isLoading ? 'bg-gray-700' : 'bg-white'}`}></div>
            </button>
            
            {/* Virtual Switch Toggle */}
            <div className="w-12 h-12 flex items-center justify-center">
                <button 
                    onClick={handleVirtualToggle}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-90 duration-200 ${
                        state.isActive && state.selectedImage
                            ? 'bg-green-600/20 text-green-500 ring-1 ring-green-500/50' 
                            : 'bg-gray-800 text-gray-500 hover:text-white'
                    }`}
                    title={state.isActive ? "Virtualni o'chirish" : (state.selectedImage ? "Virtualni yoqish" : "Rasm tanlash")}
                >
                    {state.isActive && state.selectedImage ? <Eye size={22} /> : <EyeOff size={22} />}
                </button>
            </div>
         </div>
         <div className="text-center mt-2">
             <span className="text-[10px] text-gray-500 font-mono">
               {state.isActive && state.selectedImage ? "VIRTUAL KAMERA FAOL" : "REAL KAMERA"}
             </span>
         </div>
      </div>

      {/* Toast Notification */}
      {captured && (
        <div className="absolute bottom-40 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="bg-gray-900/90 backdrop-blur text-white pl-2 pr-4 py-2 rounded-full shadow-2xl flex items-center gap-3 border border-white/10">
                <div className="w-8 h-8 rounded-full bg-black/50 overflow-hidden border border-white/20">
                   {capturedImage ? <img src={capturedImage} className="w-full h-full object-cover" /> : <CheckCircle2 className="p-1.5 text-green-500" />}
                </div>
                <span className="text-xs font-semibold pr-1">
                    {state.isActive ? "Virtual Rasm Saqlandi" : "Rasm Saqlandi"}
                </span>
            </div>
        </div>
      )}
    </div>
  );
};