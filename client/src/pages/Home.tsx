import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Link } from 'wouter';
import { ProjectConfig, DEFAULT_PROJECT_CONFIG, Layer } from '@/types';
import { Button } from '@/components/ui/button';
import { Settings, Layers, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';

import { InfiniteScroll } from '@/components/ui/InfiniteScroll';
import { getFilterStyle } from '@/lib/renderUtils';

// UVScrollLayer removed in favor of InfiniteScroll

export default function Home() {
  const [config, setConfig] = useState<ProjectConfig>(DEFAULT_PROJECT_CONFIG);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [isLoading, setIsLoading] = useState(true);

  const loadConfig = useCallback(async () => {
    try {
      const search = window.location.hash.includes('?')
        ? window.location.hash.split('?')[1]
        : window.location.search.substring(1);
      const params = new URLSearchParams(search);
      const id = params.get('id');

      if (id) {
        const { data, error } = await supabase
          .from('scenes')
          .select('config')
          .eq('id', id)
          .single();

        if (data && !error) {
          setConfig(data.config);
          setIsLoading(false);
          return;
        }
      }

      // Fallback: Local API (Sadece localhost üzerinde deniyoruz)
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        const response = await fetch('/api/config');
        if (response.ok) {
          const serverConfig = await response.json();
          if (serverConfig) {
            setConfig(serverConfig);
          }
        }
      }
    } catch (error) {
      console.error('Yapılandırma yüklenemedi:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfig();
    // Statik yayında periyodik yenilemeyi kaldırıyoruz veya bulut üzerinden yapabiliriz.
    // Şimdilik sadece ilk girişte yüklenecek şekilde bıraktık.
  }, [loadConfig]);

  useEffect(() => {
    const updateSize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const sortedLayers = useMemo(() =>
    [...config.layers].sort((a, b) => a.zIndex - b.zIndex),
    [config.layers]
  );

  const tilePositions = useMemo(() => {
    const { width: canvasW, height: canvasH } = config.canvasSize;
    const { width: windowW, height: windowH } = windowSize;

    if (windowW === 0 || windowH === 0) return [];

    const positions: { x: number; y: number; isMain: boolean }[] = [];

    const centerX = Math.floor(windowW / 2 - canvasW / 2);
    const centerY = Math.floor(windowH / 2 - canvasH / 2);

    const tilesLeft = Math.ceil(centerX / canvasW) + 1;
    const tilesRight = Math.ceil((windowW - centerX - canvasW) / canvasW) + 1;
    const tilesTop = Math.ceil(centerY / canvasH) + 1;
    const tilesBottom = Math.ceil((windowH - centerY - canvasH) / canvasH) + 1;

    for (let row = -tilesTop; row <= tilesBottom; row++) {
      for (let col = -tilesLeft; col <= tilesRight; col++) {
        const x = centerX + col * canvasW;
        const y = centerY + row * canvasH;

        if (x + canvasW > 0 && x < windowW && y + canvasH > 0 && y < windowH) {
          positions.push({
            x,
            y,
            isMain: col === 0 && row === 0,
          });
        }
      }
    }

    return positions;
  }, [config.canvasSize, windowSize]);

  const renderCanvas = (isMain: boolean) => (
    <div
      className="absolute overflow-hidden"
      style={{
        width: config.canvasSize.width,
        height: config.canvasSize.height,
        backgroundColor: config.backgroundColor,
        boxShadow: isMain
          ? '0 0 0 2px rgba(0, 240, 255, 0.3), 0 0 40px rgba(0, 240, 255, 0.1)'
          : 'none',
        opacity: isMain ? 1 : 0.7,
      }}
    >
      {sortedLayers.map((layer) => {
        const activeFilters = layer.filters.activeFilters || [];
        const disabledFilters = layer.filters.disabledFilters || [];
        const isUVActive = activeFilters.includes('uvScroll') && !disabledFilters.includes('uvScroll');
        const isScrolling = isUVActive && (layer.filters.uvScrollX !== 0 || layer.filters.uvScrollY !== 0);

        const content = layer.type === 'video' ? (
          <video
            src={layer.source}
            autoPlay
            loop
            muted
            playsInline
            className="max-w-full max-h-full object-contain"
          />
        ) : (
          <img
            src={layer.source}
            alt={layer.name}
            className="max-w-full max-h-full object-contain"
            draggable={false}
          />
        );

        return (
          <div
            key={layer.id}
            className="absolute inset-0 flex items-center justify-center"
            style={{
              zIndex: layer.zIndex,
              ...getFilterStyle(layer),
            }}
          >
            {isScrolling ? (
              <InfiniteScroll speedX={layer.filters.uvScrollX} speedY={layer.filters.uvScrollY}>
                {content}
              </InfiniteScroll>
            ) : (
              content
            )}
          </div>
        );
      })}
    </div>
  );

  const [showControls, setShowControls] = useState(true);

  // Dokunmatik cihaz kontrolü
  const isTouchDevice = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);

  return (
    <div
      className="fixed inset-0 overflow-hidden"
      style={{ backgroundColor: '#000' }}
      onClick={() => isTouchDevice && setShowControls(!showControls)}
    >
      {isLoading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-[100]">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="absolute inset-0">
            {tilePositions.map((pos, index) => (
              <div
                key={index}
                className="absolute"
                style={{
                  left: pos.x,
                  top: pos.y,
                }}
              >
                {renderCanvas(pos.isMain)}
              </div>
            ))}
          </div>

          {config.layers.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center text-white/30 px-6">
                <Layers className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 opacity-20" />
                <p className="text-sm md:text-lg">Henüz katman eklenmemiş</p>
                <p className="text-xs md:text-sm mt-2 opacity-60">Config sayfasından katman ekleyin</p>
              </div>
            </div>
          )}

          {/* Top Controls Bar */}
          <div className={`fixed top-4 right-4 transition-all duration-300 z-50 ${showControls || !isTouchDevice ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'} ${!isTouchDevice ? 'md:opacity-0 md:hover:opacity-100' : ''}`}>
            <div className="cyber-panel p-2 md:p-3 bg-card/90 backdrop-blur-md flex items-center gap-2 border-primary/30 shadow-[0_0_20px_rgba(0,240,255,0.1)]">
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => { e.stopPropagation(); loadConfig(); }}
                className="h-8 w-8 md:h-9 md:w-9 text-muted-foreground hover:text-primary hover:bg-primary/10"
                title="Yenile"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Link href="/config">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => e.stopPropagation()}
                  className="h-8 w-8 md:h-9 md:w-9 text-muted-foreground hover:text-primary hover:bg-primary/10"
                  title="Yapılandırma"
                >
                  <Settings className="w-4 h-4" />
                </Button>
              </Link>
              <div className="text-[10px] md:text-xs font-tech text-primary/80 pl-2 border-l border-primary/30 ml-1">
                {config.canvasSize.width}×{config.canvasSize.height}
              </div>
            </div>
          </div>

          {/* Bottom Status Bar */}
          <div className={`fixed bottom-4 left-4 transition-all duration-300 z-50 ${showControls || !isTouchDevice ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'} ${!isTouchDevice ? 'md:opacity-0 md:hover:opacity-100' : ''}`}>
            <div className="cyber-panel p-2 px-3 bg-card/90 backdrop-blur-md text-[9px] md:text-xs font-tech text-muted-foreground border-primary/20 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  <span className="text-primary truncate max-w-[80px] md:max-w-none">{config.name}</span>
                </div>
                <span className="opacity-30">|</span>
                <span>{config.layers.length} L</span>
                <span className="hidden xs:inline opacity-30">|</span>
                <span className="hidden xs:inline">{tilePositions.length} TILE</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
