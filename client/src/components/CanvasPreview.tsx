/**
 * CanvasPreview Component
 * Cyberpunk Control Room - Tuval Önizleme Alanı
 * 
 * Config sayfasında kullanılır - sadece tuval alanı gösterilir (tile yok)
 */

import React, { useMemo, useEffect, useRef, useState } from 'react';
import { useProject } from '@/contexts/ProjectContext';
import { Layer } from '@/types';

import { InfiniteScroll } from '@/components/ui/InfiniteScroll';
import { getFilterStyle } from '@/lib/renderUtils';

// UVScrollLayer removed in favor of InfiniteScroll

interface CanvasPreviewProps {
  /** Önizleme ölçeği (0-1 arası) */
  scale?: number;
  /** Sınır çizgisi göster */
  showBorder?: boolean;
  /** Grid göster */
  showGrid?: boolean;
}

export function CanvasPreview({
  scale = 0.5,
  showBorder = true,
  showGrid = false
}: CanvasPreviewProps) {
  const { config, selectedLayerId } = useProject();
  const { canvasSize, backgroundColor, layers } = config;

  // Katmanları zIndex'e göre sırala
  // Katmanları zIndex'e göre sırala
  const sortedLayers = useMemo(() =>
    [...layers].sort((a, b) => a.zIndex - b.zIndex),
    [layers]
  );

  const scaledWidth = canvasSize.width * scale;
  const scaledHeight = canvasSize.height * scale;

  return (
    <div className="relative flex items-center justify-center w-full h-full p-4">
      {/* Tuval Container */}
      <div
        className="relative overflow-hidden"
        style={{
          width: scaledWidth,
          height: scaledHeight,
          backgroundColor,
          boxShadow: showBorder
            ? '0 0 0 2px rgba(0, 240, 255, 0.5), 0 0 30px rgba(0, 240, 255, 0.2)'
            : 'none',
        }}
      >
        {/* Grid Overlay */}
        {showGrid && (
          <div
            className="absolute inset-0 pointer-events-none cyber-grid"
            style={{ opacity: 0.3 }}
          />
        )}

        {/* Katmanlar */}
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
              {/* Seçili Katman Göstergesi */}
              {selectedLayerId === layer.id && layer.filters.visible && (
                <div
                  className="absolute inset-0 pointer-events-none z-10"
                  style={{
                    border: '2px dashed rgba(0, 240, 255, 0.8)',
                    boxShadow: 'inset 0 0 10px rgba(0, 240, 255, 0.3)',
                  }}
                />
              )}

              {/* Medya İçeriği */}
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

        {/* Boş Tuval Mesajı */}
        {layers.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <div className="w-16 h-16 mx-auto mb-4 border-2 border-dashed border-primary/30 rounded flex items-center justify-center">
                <span className="text-2xl text-primary/50">+</span>
              </div>
              <p className="text-sm">Tuval boş</p>
              <p className="text-xs mt-1">Medya eklemek için katman oluşturun</p>
            </div>
          </div>
        )}
      </div>

      {/* Boyut Göstergesi */}
      <div className="absolute bottom-2 right-2 text-xs font-tech text-muted-foreground bg-background/80 px-2 py-1 rounded">
        {canvasSize.width} x {canvasSize.height} • {Math.round(scale * 100)}%
      </div>
    </div>
  );
}
