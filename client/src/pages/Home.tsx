/**
 * Home Page - Ana Sayfa
 * Cyberpunk Control Room - Canlı Görüntü Sayfası
 * 
 * JSON yapılandırmasını okuyarak sahneyi oluşturur
 * Tuval dışındaki alan tile edilerek gösterilir
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Link } from 'wouter';
import { ProjectConfig, DEFAULT_PROJECT_CONFIG, Layer } from '@/types';
import { Button } from '@/components/ui/button';
import { Settings, Layers, RefreshCw } from 'lucide-react';

// UV Scroll Component - requestAnimationFrame ile sürekli animasyon
function UVScrollLayer({ layer }: { layer: Layer }) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const animationRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    const animate = (time: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = time;
      const delta = (time - lastTimeRef.current) / 1000; // saniye cinsinden
      lastTimeRef.current = time;

      setOffset(prev => ({
        x: (prev.x + layer.filters.uvScrollX * delta * 100) % 1000,
        y: (prev.y + layer.filters.uvScrollY * delta * 100) % 1000,
      }));

      animationRef.current = requestAnimationFrame(animate);
    };

    if (layer.filters.uvScrollX !== 0 || layer.filters.uvScrollY !== 0) {
      animationRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [layer.filters.uvScrollX, layer.filters.uvScrollY]);

  return (
    <div
      className="w-full h-full"
      style={{
        backgroundImage: `url("${layer.source}")`,
        backgroundRepeat: 'repeat',
        backgroundSize: '100% 100%',
        backgroundPosition: `${offset.x}px ${offset.y}px`,
      }}
    />
  );
}

export default function Home() {
  const [config, setConfig] = useState<ProjectConfig>(DEFAULT_PROJECT_CONFIG);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  // Yapılandırmayı sunucudan yükle
  const loadConfig = useCallback(async () => {
    try {
      const response = await fetch('/api/config');
      if (response.ok) {
        const serverConfig = await response.json();
        if (serverConfig) {
          setConfig(serverConfig);
        }
      }
    } catch (error) {
      console.error('Yapılandırma yüklenemedi:', error);
    }
  }, []);

  // İlk yükleme ve periyodik yenileme
  useEffect(() => {
    loadConfig();

    // Her 2 saniyede bir sunucudan config'i kontrol et
    const interval = setInterval(loadConfig, 2000);

    return () => clearInterval(interval);
  }, [loadConfig]);

  // Pencere boyutunu takip et
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

  // Katmanları zIndex'e göre sırala
  const sortedLayers = useMemo(() =>
    [...config.layers].sort((a, b) => a.zIndex - b.zIndex),
    [config.layers]
  );

  // CSS filter string oluştur
  const getFilterStyle = (layer: Layer): React.CSSProperties => {
    const { filters } = layer;

    if (!filters.visible) {
      return { display: 'none' };
    }

    const filterString = [
      `opacity(${filters.opacity / 100})`,
      `hue-rotate(${filters.hueRotate}deg)`,
      `brightness(${filters.brightness / 100})`,
      `contrast(${filters.contrast / 100})`,
      `saturate(${filters.saturate / 100})`,
      filters.blur > 0 ? `blur(${filters.blur}px)` : '',
    ].filter(Boolean).join(' ');

    const transformString = [
      `translate(${filters.offsetX}px, ${filters.offsetY}px)`,
      `scale(${filters.scale})`,
      `rotate(${filters.rotation}deg)`,
      filters.flipX ? 'scaleX(-1)' : '',
      filters.flipY ? 'scaleY(-1)' : '',
    ].filter(Boolean).join(' ');

    return {
      filter: filterString,
      transform: transformString,
      transformOrigin: 'center center',
    };
  };

  // Tile pozisyonlarını hesapla
  const tilePositions = useMemo(() => {
    const { width: canvasW, height: canvasH } = config.canvasSize;
    const { width: windowW, height: windowH } = windowSize;

    if (windowW === 0 || windowH === 0) return [];

    const positions: { x: number; y: number; isMain: boolean }[] = [];

    // Merkez tuvalin pozisyonu
    const centerX = Math.floor(windowW / 2 - canvasW / 2);
    const centerY = Math.floor(windowH / 2 - canvasH / 2);

    // Kaç tile gerektiğini hesapla
    const tilesLeft = Math.ceil(centerX / canvasW) + 1;
    const tilesRight = Math.ceil((windowW - centerX - canvasW) / canvasW) + 1;
    const tilesTop = Math.ceil(centerY / canvasH) + 1;
    const tilesBottom = Math.ceil((windowH - centerY - canvasH) / canvasH) + 1;

    for (let row = -tilesTop; row <= tilesBottom; row++) {
      for (let col = -tilesLeft; col <= tilesRight; col++) {
        const x = centerX + col * canvasW;
        const y = centerY + row * canvasH;

        // Görünür alanda mı kontrol et
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

  // Tek bir tuval render et
  const renderCanvas = (isMain: boolean) => (
    <div
      className="absolute overflow-hidden"
      style={{
        width: config.canvasSize.width,
        height: config.canvasSize.height,
        backgroundColor: config.backgroundColor,
        // Ana tuval için hafif vurgu
        boxShadow: isMain
          ? '0 0 0 2px rgba(0, 240, 255, 0.3), 0 0 40px rgba(0, 240, 255, 0.1)'
          : 'none',
        // Tile'lar için hafif karartma
        opacity: isMain ? 1 : 0.7,
      }}
    >
      {/* Katmanlar */}
      {sortedLayers.map((layer) => (
        <div
          key={layer.id}
          className="absolute inset-0 flex items-center justify-center"
          style={{
            zIndex: layer.zIndex,
            ...getFilterStyle(layer),
          }}
        >
          {layer.type === 'video' ? (
            <video
              src={layer.source}
              autoPlay
              loop
              muted
              playsInline
              className="max-w-full max-h-full object-contain"
            />
          ) : (
            layer.filters.uvScrollX !== 0 || layer.filters.uvScrollY !== 0 ? (
              <UVScrollLayer layer={layer} />
            ) : (
              <img
                src={layer.source}
                alt={layer.name}
                className="max-w-full max-h-full object-contain"
                draggable={false}
              />
            )
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div
      className="fixed inset-0 overflow-hidden"
      style={{ backgroundColor: '#000' }}
    >
      {/* Tile'lanmış Tuval Alanı */}
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

      {/* Boş Durum */}
      {config.layers.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white/50">
            <Layers className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg">Henüz katman eklenmemiş</p>
            <p className="text-sm mt-2">Config sayfasından katman ekleyin</p>
          </div>
        </div>
      )}

      {/* Kontrol Paneli (Hover'da görünür) */}
      <div className="fixed top-4 right-4 opacity-0 hover:opacity-100 transition-opacity duration-300 z-50">
        <div className="cyber-panel p-3 bg-card/90 backdrop-blur-sm flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={loadConfig}
            className="h-8 w-8 text-muted-foreground hover:text-primary"
            title="Yenile"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Link href="/config">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-primary"
              title="Config Sayfası"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </Link>
          <div className="text-xs font-tech text-muted-foreground pl-2 border-l border-primary/30">
            {config.canvasSize.width}×{config.canvasSize.height}
          </div>
        </div>
      </div>

      {/* Bilgi Göstergesi */}
      <div className="fixed bottom-4 left-4 opacity-0 hover:opacity-100 transition-opacity duration-300 z-50">
        <div className="cyber-panel p-2 bg-card/90 backdrop-blur-sm text-xs font-tech text-muted-foreground">
          <div className="flex items-center gap-3">
            <span>Katman: {config.layers.length}</span>
            <span>|</span>
            <span>Tile: {tilePositions.length}</span>
            <span>|</span>
            <span>{config.name}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
