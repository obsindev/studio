/**
 * Config Page
 * Cyberpunk Control Room - Yapılandırma Sayfası
 * 
 * Katman yönetimi, filtre ayarları, tuval yapılandırması
 * Sol: Katman listesi | Orta: Önizleme | Sağ: Özellikler
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'wouter';
import { ProjectProvider, useProject } from '@/contexts/ProjectContext';
import { LayerList } from '@/components/LayerList';
import { FilterPanel } from '@/components/FilterPanel';
import { CanvasPreview } from '@/components/CanvasPreview';
import { CanvasSettings } from '@/components/CanvasSettings';
import { AddMediaDialog } from '@/components/AddMediaDialog';
import { ConfigActions } from '@/components/ConfigActions';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Layers as LayersIcon,
  Play,
  Grid3X3,
  ZoomIn,
  ZoomOut,
  Maximize,
  ExternalLink,
  BookOpen,
  Settings as SettingsIcon,
  Menu,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

function ConfigContent() {
  const { config } = useProject();
  const [isAddMediaOpen, setIsAddMediaOpen] = useState(false);
  const [previewScale, setPreviewScale] = useState(0.5);
  const [showGrid, setShowGrid] = useState(false);
  const [activeTab, setActiveTab] = useState('preview');

  // Tuval boyutuna göre otomatik ölçek hesapla
  const calculateAutoScale = useCallback(() => {
    // Mobil/Tablet ayrımı için window genişliğini kontrol et
    const isMobile = window.innerWidth < 768;
    const isTablet = window.innerWidth >= 768 && window.innerWidth < 1200;

    // Alan hesaplama (sidebars + padding dikkate alınarak)
    let availableWidth = window.innerWidth;
    if (!isMobile) {
      availableWidth -= 288; // Sol panel (w-72)
      availableWidth -= 320; // Sağ panel (w-80)
    }
    availableWidth -= 48; // Paddingler

    let availableHeight = window.innerHeight - 150; // Header + Toolbar + Footer

    const scaleX = availableWidth / config.canvasSize.width;
    const scaleY = availableHeight / config.canvasSize.height;
    return Math.min(scaleX, scaleY, 1);
  }, [config.canvasSize]);

  useEffect(() => {
    const handleResize = () => {
      setPreviewScale(calculateAutoScale());
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [calculateAutoScale]);

  const handleZoomIn = () => {
    setPreviewScale(prev => Math.min(prev + 0.1, 2));
  };

  const handleZoomOut = () => {
    setPreviewScale(prev => Math.max(prev - 0.1, 0.1));
  };

  const handleFitToScreen = () => {
    setPreviewScale(calculateAutoScale());
  };

  return (
    <div className="min-h-screen bg-background cyber-grid flex flex-col overflow-hidden">
      {/* Header - Responsive */}
      <header className="h-14 border-b border-primary/30 bg-card/80 backdrop-blur-sm flex items-center justify-between px-4 shrink-0 z-50 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <LayersIcon className="w-5 h-5 md:w-6 md:h-6 text-primary" />
            <h1 className="font-display text-sm md:text-lg tracking-wider text-primary truncate max-w-[120px] md:max-w-none">
              OBS STUDIO
            </h1>
          </div>
          <span className="hidden xs:inline-block text-[10px] md:text-xs font-tech text-muted-foreground px-2 py-0.5 bg-secondary rounded border border-primary/20">
            CONFIG
          </span>
        </div>

        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          {/* Desktop Controls */}
          <div className="hidden sm:flex items-center gap-2">
            <CanvasSettings />
            <ConfigActions />
          </div>

          <Link href="/">
            <Button
              variant="default"
              size="sm"
              className="bg-primary text-primary-foreground hover:bg-primary/90 h-8 md:h-9 px-3"
            >
              <Play className="w-3.5 h-3.5 md:mr-2" />
              <span className="hidden md:inline">Yayını Aç</span>
              <ExternalLink className="w-3 h-3 ml-2 hidden xs:inline" />
            </Button>
          </Link>

          {/* Mobile Actions (CanvasSettings moved to toolbar) */}
          <div className="sm:hidden flex items-center gap-1">
            <ConfigActions />
          </div>
        </div>
      </header>

      {/* Main Content - Desktop & Mobile Divergence */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* Sol Panel - Desktop-only sidebar */}
        <aside className="hidden lg:block w-72 border-r border-primary/30 bg-card/40 overflow-hidden">
          <LayerList onAddLayer={() => setIsAddMediaOpen(true)} />
        </aside>

        {/* Orta Alan - Main Workspace */}
        <main className="flex-1 flex flex-col overflow-hidden">

          {/* Mobile Tabs - Only visible on small screens */}
          <div className="lg:hidden bg-card/60 border-b border-primary/20 flex items-center justify-center p-1 shrink-0">
            <div className="flex bg-secondary/30 rounded-lg p-0.5 w-full max-w-sm">
              <button
                onClick={() => setActiveTab('layers')}
                className={`flex-1 flex items-center justify-center py-1.5 rounded-md text-[10px] font-display transition-all ${activeTab === 'layers' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'text-muted-foreground'}`}
              >
                <LayersIcon className="w-3.5 h-3.5 mr-1.5" />
                KATMANLAR
              </button>
              <button
                onClick={() => setActiveTab('preview')}
                className={`flex-1 flex items-center justify-center py-1.5 rounded-md text-[10px] font-display transition-all ${activeTab === 'preview' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'text-muted-foreground'}`}
              >
                <Play className="w-3.5 h-3.5 mr-1.5" />
                İZLE
              </button>
              <button
                onClick={() => setActiveTab('filters')}
                className={`flex-1 flex items-center justify-center py-1.5 rounded-md text-[10px] font-display transition-all ${activeTab === 'filters' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'text-muted-foreground'}`}
              >
                <Filter className="w-3.5 h-3.5 mr-1.5" />
                FİLTRE
              </button>
            </div>
          </div>

          <div className="flex-1 relative flex overflow-hidden">
            {/* View Switching Logic for Mobile */}

            {/* Layers View (Mobile Tab) */}
            <div className={`absolute inset-0 z-10 bg-background lg:hidden transition-transform duration-300 ${activeTab === 'layers' ? 'translate-x-0' : '-translate-x-full'}`}>
              <LayerList onAddLayer={() => setIsAddMediaOpen(true)} />
            </div>

            {/* Filters View (Mobile Tab) */}
            <div className={`absolute inset-0 z-10 bg-background lg:hidden transition-transform duration-300 ${activeTab === 'filters' ? 'translate-x-0' : 'translate-x-full'}`}>
              <FilterPanel />
            </div>

            {/* Preview Area (Always present in desktop, primary in mobile) */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Toolbar */}
              <div className="h-10 md:h-12 border-b border-primary/20 bg-card/20 flex items-center justify-between px-3 md:px-4 shrink-0 overflow-x-auto no-scrollbar">
                <div className="flex items-center gap-2 md:gap-4 shrink-0">
                  <span className="text-[10px] md:text-xs font-tech text-muted-foreground truncate hidden xs:inline">
                    {config.name}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] md:text-xs font-tech text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                      {config.canvasSize.width}×{config.canvasSize.height}
                    </span>
                    {/* Mobile-only CanvasSettings here */}
                    <div className="sm:hidden scale-75 origin-left">
                      <CanvasSettings />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 md:gap-4">
                  <div className="hidden xs:flex items-center gap-2">
                    <Grid3X3 className="w-3.5 h-3.5 text-muted-foreground" />
                    <Switch
                      checked={showGrid}
                      onCheckedChange={setShowGrid}
                      className="scale-75 data-[state=checked]:bg-primary"
                    />
                  </div>

                  <div className="flex items-center gap-0.5 md:gap-2 bg-secondary/20 p-0.5 rounded-md border border-primary/10">
                    <Button
                      variant="ghost" size="icon" onClick={handleZoomOut}
                      className="h-7 w-7 md:h-8 md:w-8 text-muted-foreground hover:text-primary"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </Button>
                    <span className="text-[9px] md:text-xs font-tech text-muted-foreground w-8 md:w-10 text-center">
                      {Math.round(previewScale * 100)}%
                    </span>
                    <Button
                      variant="ghost" size="icon" onClick={handleZoomIn}
                      className="h-7 w-7 md:h-8 md:w-8 text-muted-foreground hover:text-primary"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost" size="icon" onClick={handleFitToScreen}
                      className="h-7 w-7 md:h-8 md:w-8 text-muted-foreground hover:text-primary hidden sm:flex"
                    >
                      <Maximize className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Visualization Area */}
              <div className="flex-1 overflow-auto bg-[#050508] relative scan-lines group">
                <CanvasPreview
                  scale={previewScale}
                  showBorder={true}
                  showGrid={showGrid}
                />
              </div>

              {/* Status Bar */}
              <div className="h-7 border-t border-primary/20 bg-card/40 flex items-center justify-between px-3 text-[9px] md:text-xs font-tech text-muted-foreground shrink-0">
                <div className="flex items-center gap-3 overflow-hidden">
                  <span className="truncate">KATMAN: {config.layers.length}</span>
                  <span className="hidden sm:inline opacity-30">|</span>
                  <span className="hidden sm:inline truncate">GÜNCELLEME: {new Date(config.lastModified).toLocaleTimeString('tr-TR')}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" />
                  <span className="hidden xs:inline">LIVE SINK</span>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Sağ Panel - Desktop-only sidebar */}
        <aside className="hidden lg:block w-80 border-l border-primary/30 bg-card/40 overflow-hidden">
          <FilterPanel />
        </aside>
      </div>

      {/* Medya Ekleme Dialog */}
      <AddMediaDialog
        open={isAddMediaOpen}
        onOpenChange={setIsAddMediaOpen}
      />
    </div>
  );
}

export default function Config() {
  return (
    <ProjectProvider>
      <ConfigContent />
    </ProjectProvider>
  );
}
