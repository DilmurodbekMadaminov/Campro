import React, { useState } from 'react';
import { Settings, Camera, Smartphone } from 'lucide-react';
import { ControlPanel } from './components/ControlPanel';
import { MockCameraApp } from './components/MockCameraApp';
import { AppContextType, VirtualCamState } from './types';

const App: React.FC = () => {
  // App State
  const [activeTab, setActiveTab] = useState<'settings' | 'camera'>('settings');
  const [virtualCamState, setVirtualCamState] = useState<VirtualCamState>({
    isActive: false,
    selectedImage: null,
    transform: { scale: 1, x: 0, y: 0, rotation: 0 },
    maintainAspectRatio: true,
  });

  // State Helpers
  const contextValue: AppContextType = {
    state: virtualCamState,
    setImage: (image) => setVirtualCamState(prev => ({ 
      ...prev, 
      selectedImage: image,
      // Reset transform when new image is loaded
      transform: { scale: 1, x: 0, y: 0, rotation: 0 } 
    })),
    toggleActive: (isActive) => setVirtualCamState(prev => ({ ...prev, isActive })),
    setTransform: (transform) => setVirtualCamState(prev => ({ ...prev, transform })),
    toggleAspectRatio: (maintain) => setVirtualCamState(prev => ({ ...prev, maintainAspectRatio: maintain })),
  };

  return (
    <div className="w-full h-screen bg-gray-100 flex items-center justify-center">
      {/* Mobile Frame Simulation */}
      <div className="w-full h-full sm:w-[375px] sm:h-[800px] bg-white sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col relative">
        
        {/* Top Status Bar (Fake) */}
        <div className="h-8 bg-gray-900 text-white flex items-center justify-between px-4 text-xs z-30 select-none">
          <span>09:41</span>
          <div className="flex gap-1">
            <span className="opacity-80">5G</span>
            <span className="opacity-80">100%</span>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 relative overflow-hidden">
          {activeTab === 'settings' ? (
            <div className="h-full flex flex-col">
              <div className="p-4 bg-white border-b border-gray-100">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <Smartphone className="text-blue-600" />
                  ProCam
                </h1>
                <p className="text-xs text-gray-400">ProCam Manager v2.4.1</p>
              </div>
              <ControlPanel context={contextValue} />
            </div>
          ) : (
            <MockCameraApp context={contextValue} onNavigate={setActiveTab} />
          )}
        </div>

        {/* Bottom Navigation Bar */}
        <div className="h-16 bg-white border-t border-gray-200 flex flex-row z-30">
          <button 
            onClick={() => setActiveTab('settings')}
            className={`flex-1 flex flex-col items-center justify-center gap-1 ${activeTab === 'settings' ? 'text-blue-600' : 'text-gray-400'}`}
          >
            <Settings size={24} />
            <span className="text-[10px] font-medium uppercase">Sozlamalar</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('camera')}
            className={`flex-1 flex flex-col items-center justify-center gap-1 ${activeTab === 'camera' ? 'text-blue-600' : 'text-gray-400'}`}
          >
            <div className={`p-1 rounded-full ${activeTab === 'camera' ? 'bg-blue-50' : ''}`}>
               <Camera size={24} />
            </div>
            <span className="text-[10px] font-medium uppercase">Kamera</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default App;