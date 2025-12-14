import React, { useRef, useState, useEffect } from 'react';
import { useGesture } from '@use-gesture/react';
import { Upload, Power, Image as ImageIcon, Trash2, ZoomIn, ZoomOut, RefreshCcw, Undo, Redo, RotateCw, RotateCcw, Lock, Unlock } from 'lucide-react';
import { AppContextType, ImageTransform } from '../types';

interface ControlPanelProps {
  context: AppContextType;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({ context }) => {
  const { state, setImage, toggleActive, setTransform, toggleAspectRatio } = context;
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State for image fade-in animation
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  // History State
  const [history, setHistory] = useState<ImageTransform[]>([{ scale: 1, x: 0, y: 0, rotation: 0 }]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Reset animation and history when a new image is selected
  useEffect(() => {
    setIsImageLoaded(false);
    setHistory([{ scale: 1, x: 0, y: 0, rotation: 0 }]);
    setHistoryIndex(0);
  }, [state.selectedImage]);

  const addToHistory = (newTransform: ImageTransform) => {
    // Prevent duplicating the exact same state
    const current = history[historyIndex];
    if (
      current &&
      Math.abs(current.x - newTransform.x) < 0.1 &&
      Math.abs(current.y - newTransform.y) < 0.1 &&
      Math.abs(current.scale - newTransform.scale) < 0.001 &&
      Math.abs(current.rotation - newTransform.rotation) < 0.1
    ) {
      return;
    }

    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newTransform);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setTransform(history[newIndex]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setTransform(history[newIndex]);
    }
  };

  // --- Gesture Logic ---
  const bind = useGesture(
    {
      onDrag: ({ offset: [x, y], last }) => {
        const newTransform = { ...state.transform, x, y };
        setTransform(newTransform);
        if (last) addToHistory(newTransform);
      },
      onPinch: ({ offset: [s, a], last }) => {
        const newTransform = { ...state.transform, scale: s, rotation: a };
        setTransform(newTransform);
        if (last) addToHistory(newTransform);
      },
    },
    {
      drag: {
        from: () => [state.transform.x, state.transform.y],
      },
      pinch: {
        scaleBounds: { min: 0.5, max: 5 },
        rubberband: true,
        from: () => [state.transform.scale, state.transform.rotation],
      },
    }
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setImage(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  const adjustZoom = (delta: number) => {
    const newScale = Math.max(0.5, Math.min(5, state.transform.scale + delta));
    const newTransform = { ...state.transform, scale: newScale };
    setTransform(newTransform);
    addToHistory(newTransform);
  };

  const rotate90 = (direction: 'cw' | 'ccw') => {
    const delta = direction === 'cw' ? 90 : -90;
    // Simple relative rotation instead of snapping, allowing predictable increments
    const newRotation = state.transform.rotation + delta;
    const newTransform = { ...state.transform, rotation: newRotation };
    setTransform(newTransform);
    addToHistory(newTransform);
  };

  const handleSliderRotation = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    
    // Logic to prevent "jumping" when using slider after freehand/button rotation
    const currentRotation = state.transform.rotation;
    // Normalize current rotation to slider range [-180, 180]
    const currentPhase = ((currentRotation % 360) + 540) % 360 - 180;
    // Find the 'turn' count
    const turns = Math.round((currentRotation - currentPhase) / 360);
    
    // Apply new value preserving the turns
    const newRotation = (turns * 360) + val;
    
    const newTransform = { ...state.transform, rotation: newRotation };
    setTransform(newTransform);
  };
  
  const handleSliderCommit = () => {
    addToHistory(state.transform);
  };

  const resetTransform = () => {
    const newTransform = { scale: 1, x: 0, y: 0, rotation: 0 };
    setTransform(newTransform);
    addToHistory(newTransform);
  };

  return (
    <div className="flex flex-col h-full p-4 space-y-6 overflow-y-auto no-scrollbar">
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
          Kamera Manbasi
        </h2>
        
        {/* Status Indicator & Toggle */}
        <div className="flex items-center justify-between mb-6 bg-gray-50 p-3 rounded-lg">
          <div>
            <span className="font-medium text-gray-700 block">Virtual Kamera</span>
            <span className={`text-xs font-bold ${state.isActive ? 'text-green-600' : 'text-gray-400'}`}>
              {state.isActive ? 'YONIQ' : 'O\'CHIQ'}
            </span>
          </div>

          <button 
            onClick={() => state.selectedImage && toggleActive(!state.isActive)}
            disabled={!state.selectedImage}
            className={`w-12 h-7 flex items-center rounded-full p-1 transition-colors duration-300 focus:outline-none ${
              state.isActive ? 'bg-green-500' : 'bg-gray-300'
            } ${!state.selectedImage ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            title={state.selectedImage ? "Virtual kamerani yoqish" : "Avval rasm tanlang"}
          >
            <div 
              className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-300 ${
                state.isActive ? 'translate-x-5' : 'translate-x-0'
              }`} 
            />
          </button>
        </div>

        {/* Interactive Image Preview Area */}
        <div className="relative aspect-video w-full bg-gray-900 rounded-lg overflow-hidden mb-4 group ring-1 ring-gray-200 shadow-inner">
          {state.selectedImage ? (
            <>
              <div 
                {...bind()}
                className="w-full h-full cursor-grab active:cursor-grabbing flex items-center justify-center overflow-hidden z-0"
                style={{ touchAction: 'none' }}
              >
                <img 
                  src={state.selectedImage} 
                  alt="Selected reference" 
                  onLoad={() => setIsImageLoaded(true)}
                  className={`max-w-none origin-center transition-opacity duration-700 ease-out select-none pointer-events-none ${isImageLoaded ? 'opacity-100' : 'opacity-0'}`}
                  style={{
                    transform: `translate(${state.transform.x}px, ${state.transform.y}px) rotate(${state.transform.rotation}deg) scale(${state.transform.scale})`,
                    width: '100%',
                    height: '100%',
                    objectFit: state.maintainAspectRatio ? 'cover' : 'fill'
                  }}
                  draggable={false}
                />
              </div>

              {/* Floating Toolbar */}
              <div className="absolute top-2 right-2 flex flex-col gap-2 z-10 pointer-events-auto">
                <button 
                  onClick={() => setImage(null)}
                  className="p-2 bg-black/60 text-white rounded-full hover:bg-red-500 backdrop-blur-sm transition-colors shadow-lg"
                  title="Rasmni o'chirish"
                >
                  <Trash2 size={16} />
                </button>
                <button 
                  onClick={() => toggleAspectRatio(!state.maintainAspectRatio)}
                  className={`p-2 rounded-full backdrop-blur-sm transition-colors shadow-lg ${
                     state.maintainAspectRatio ? 'bg-blue-600/80 text-white' : 'bg-black/60 text-white'
                  }`}
                  title={state.maintainAspectRatio ? "To'liq qoplash (Cho'zish)" : "Proporsiyani saqlash"}
                >
                  {state.maintainAspectRatio ? <Lock size={16} /> : <Unlock size={16} />}
                </button>
              </div>

              {/* Bottom Controls Group */}
              <div className="absolute bottom-2 right-2 flex flex-col gap-2 z-10 pointer-events-auto items-end">
                {/* History Controls */}
                <div className="flex gap-2">
                   <button 
                    onClick={handleUndo}
                    disabled={historyIndex === 0}
                    className={`p-2 rounded-full backdrop-blur-sm transition-colors ${
                      historyIndex === 0 
                        ? 'bg-black/30 text-white/30 cursor-not-allowed' 
                        : 'bg-black/60 text-white hover:bg-white/20'
                    }`}
                    title="Orqaga"
                  >
                    <Undo size={16} />
                  </button>
                  <button 
                    onClick={handleRedo}
                    disabled={historyIndex === history.length - 1}
                    className={`p-2 rounded-full backdrop-blur-sm transition-colors ${
                      historyIndex === history.length - 1 
                        ? 'bg-black/30 text-white/30 cursor-not-allowed' 
                        : 'bg-black/60 text-white hover:bg-white/20'
                    }`}
                    title="Oldinga"
                  >
                    <Redo size={16} />
                  </button>
                </div>

                {/* Transform Controls (Zoom & Reset) */}
                <div className="flex gap-2">
                   <button 
                    onClick={() => adjustZoom(-0.1)}
                    className="p-2 bg-black/60 text-white rounded-full hover:bg-white/20 backdrop-blur-sm transition-colors"
                    title="Kichraytirish"
                  >
                    <ZoomOut size={16} />
                  </button>
                  <button 
                    onClick={resetTransform}
                    className="p-2 bg-black/60 text-white rounded-full hover:bg-white/20 backdrop-blur-sm transition-colors"
                    title="Tiklash"
                  >
                    <RefreshCcw size={16} />
                  </button>
                  <button 
                    onClick={() => adjustZoom(0.1)}
                    className="p-2 bg-black/60 text-white rounded-full hover:bg-white/20 backdrop-blur-sm transition-colors"
                    title="Kattalashtirish"
                  >
                    <ZoomIn size={16} />
                  </button>
                </div>
              </div>
              
              {/* Rotation Buttons (Left Side) */}
              <div className="absolute bottom-2 left-2 flex gap-2 z-10 pointer-events-auto">
                 <button 
                    onClick={() => rotate90('ccw')}
                    className="p-2 bg-black/60 text-white rounded-full hover:bg-white/20 backdrop-blur-sm transition-colors"
                    title="Chapga burish 90°"
                  >
                    <RotateCcw size={16} />
                  </button>
                  <button 
                    onClick={() => rotate90('cw')}
                    className="p-2 bg-black/60 text-white rounded-full hover:bg-white/20 backdrop-blur-sm transition-colors"
                    title="O'ngga burish 90°"
                  >
                    <RotateCw size={16} />
                  </button>
              </div>

              {/* Reset Hint & Scale Info */}
              <div className="absolute top-2 left-2 pointer-events-none z-10">
                 <span className="px-2 py-1 bg-black/40 text-white text-[10px] rounded backdrop-blur-md">
                   {state.transform.rotation.toFixed(0)}° • {(state.transform.scale * 100).toFixed(0)}%
                 </span>
              </div>
            </>
          ) : (
            <div className="w-full h-full bg-gray-100 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-300 rounded-lg">
              <ImageIcon className="mb-2 opacity-50" size={32} />
              <span className="text-xs font-medium">Rasm tanlanmagan</span>
            </div>
          )}
        </div>

        {/* Slider for Fine Rotation (Only if image selected) */}
        {state.selectedImage && (
          <div className="mb-4 bg-gray-50 p-3 rounded-lg flex items-center gap-3">
             <span className="text-xs font-medium text-gray-500 w-12">Burish</span>
             <input 
               type="range" 
               min="-180" 
               max="180" 
               step="1"
               value={((state.transform.rotation % 360 + 540) % 360) - 180} // Normalize to -180...180 range for slider visual
               onChange={handleSliderRotation}
               onMouseUp={handleSliderCommit}
               onTouchEnd={handleSliderCommit}
               className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
             />
             <span className="text-xs font-mono text-gray-600 w-8 text-right">
               {Math.round(state.transform.rotation % 360)}°
             </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden" 
          />
          
          <button 
            onClick={triggerUpload}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-colors active:scale-95 transform duration-100 uppercase"
          >
            <Upload size={18} />
            Galereyadan Rasm Tanlash
          </button>

          {state.selectedImage && (
            <button 
              onClick={() => toggleActive(!state.isActive)}
              className={`w-full flex items-center justify-center gap-2 py-4 px-4 font-bold rounded-lg shadow-md transition-all active:scale-95 transform duration-100 ${
                state.isActive 
                  ? 'bg-red-500 hover:bg-red-600 text-white' 
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              <Power size={20} />
              {state.isActive ? 'VIRTUAL KAMERANI O\'CHIRISH' : 'VIRTUAL KAMERANI YOQISH'}
            </button>
          )}
        </div>
      </div>

      <div className="text-xs text-gray-400 text-center px-4 pb-4">
        <p>Root Talab Qilinmaydi • Xavfsiz Simulyatsiya</p>
        <p className="mt-2 text-green-600 font-mono">Holat: TAYYOR</p>
      </div>
    </div>
  );
};