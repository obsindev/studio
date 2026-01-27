/**
 * LayerList Component
 * Cyberpunk Control Room - Katman Listesi Paneli
 * 
 * OBS benzeri katman yönetimi: sıralama, görünürlük, seçim
 */

import { Reorder } from 'framer-motion';
import { useProject } from '@/contexts/ProjectContext';
import { Layer } from '@/types';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Eye,
  EyeOff,
  Trash2,
  Copy,
  GripVertical,
  Image,
  Film,
  FileImage,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCallback, useState, useEffect } from 'react';

interface LayerListProps {
  onAddLayer?: () => void;
}

export function LayerList({ onAddLayer }: LayerListProps) {
  const {
    config,
    selectedLayerId,
    setSelectedLayerId,
    updateLayerFilters,
    removeLayer,
    duplicateLayer,
    reorderLayers,
    setLayers,
  } = useProject();

  // Yerel durum ile sıralamayı yöneterek 'atlamaları' ve 'uçmaları' engelle
  const [localLayers, setLocalLayers] = useState<Layer[]>([]);

  // Config değiştiğinde (yeni katman eklendiğinde veya silindiğinde) yerel durumu güncelle
  useEffect(() => {
    const sortedGlobal = [...config.layers].sort((a, b) => b.zIndex - a.zIndex);

    // Eğer katman sayısı değişmişse veya ID listesi farklıysa güncelle
    const globalIds = sortedGlobal.map(l => l.id).join(',');
    const localIds = localLayers.map(l => l.id).join(',');

    if (globalIds !== localIds) {
      setLocalLayers(sortedGlobal);
    }
  }, [config.layers, localLayers]);

  // Katmanları zIndex'e göre ters sırala (en üstteki en üstte görünsün)
  // localLayers yoksa (ilk render) normal hesapla
  const displayLayers = localLayers.length > 0 ? localLayers : [...config.layers].sort((a, b) => b.zIndex - a.zIndex);

  const getMediaIcon = (type: Layer['type']) => {
    switch (type) {
      case 'image':
        return <Image className="w-4 h-4" />;
      case 'gif':
        return <FileImage className="w-4 h-4" />;
      case 'video':
        return <Film className="w-4 h-4" />;
      default:
        return <Image className="w-4 h-4" />;
    }
  };

  const handleVisibilityToggle = useCallback((layerId: string, currentVisible: boolean) => {
    updateLayerFilters(layerId, { visible: !currentVisible });
  }, [updateLayerFilters]);

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <div className="cyber-panel h-full flex flex-col overflow-hidden">
      {/* Panel Başlığı */}
      <div className="p-3 border-b border-primary/30 flex items-center justify-between shrink-0">
        <h2 className="font-display text-sm uppercase tracking-wider text-primary">
          Katmanlar
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={onAddLayer}
          className="h-7 px-2 text-primary hover:bg-primary/20 hover:text-primary"
        >
          <Plus className="w-4 h-4 mr-1" />
          <span className="text-xs">Ekle</span>
        </Button>
      </div>

      {/* Katman Listesi */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <Reorder.Group
          axis="y"
          values={displayLayers}
          onReorder={(newOrder) => {
            // 1. Yerel durumu anında güncelle (Akıcılık için)
            setLocalLayers(newOrder);

            // 2. zIndex'leri yeni sıraya göre güncelle (büyükten küçüğeye)
            const updatedLayers = newOrder.map((layer, index) => ({
              ...layer,
              zIndex: newOrder.length - index
            }));

            // 3. Global durumu güncelle (Kalıcılık için)
            setLayers(updatedLayers);
          }}
          className="p-2 space-y-2"
        >
          {displayLayers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Image className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Henüz katman yok</p>
              <p className="text-xs mt-1">Medya eklemek için + butonuna tıklayın</p>
            </div>
          ) : (
            displayLayers.map((layer, index) => (
              <Reorder.Item
                key={layer.id}
                value={layer}
                dragListener={true}
                onClick={() => setSelectedLayerId(layer.id)}
                transition={{ type: "spring", stiffness: 400, damping: 40 }}
                whileDrag={{
                  scale: 1.03,
                  boxShadow: "0 10px 30px -5px rgba(0, 240, 255, 0.5), 0 8px 15px -6px rgba(0, 240, 255, 0.5)",
                  zIndex: 100
                }}
                className={cn(
                  'relative p-3 rounded cursor-grab active:cursor-grabbing transition-colors duration-200 select-none touch-none',
                  'border border-primary/20 bg-card/40 backdrop-blur-sm',
                  'hover:border-primary/50 hover:bg-primary/5',
                  selectedLayerId === layer.id && 'border-primary bg-primary/10 shadow-[0_0_15px_rgba(0,240,255,0.1)]',
                  !layer.filters.visible && 'opacity-50'
                )}
              >
                <div className="flex items-center gap-3">
                  {/* Sürükleme Tutacağı */}
                  <div className="text-primary/40 shrink-0">
                    <GripVertical className="w-4 h-4" />
                  </div>

                  {/* Medya İkonu */}
                  <div className={cn(
                    'w-9 h-9 md:w-8 md:h-8 rounded flex items-center justify-center shrink-0',
                    'bg-secondary text-primary border border-primary/20'
                  )}>
                    {getMediaIcon(layer.type)}
                  </div>

                  {/* Katman Bilgisi */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-primary/90">{layer.name}</p>
                    <p className="text-[10px] md:text-xs text-muted-foreground capitalize font-tech">
                      {layer.type} • Z:{layer.zIndex}
                    </p>
                  </div>

                  {/* Aksiyon Butonları */}
                  <div className={cn(
                    "flex items-center gap-1.5 md:gap-1 transition-opacity shrink-0",
                    (selectedLayerId === layer.id || !isMobile) ? "opacity-100" : "opacity-0 md:group-hover:opacity-100"
                  )}>
                    {/* Görünürlük */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 md:h-7 md:w-7 text-muted-foreground hover:text-primary hover:bg-primary/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleVisibilityToggle(layer.id, layer.filters.visible);
                      }}
                    >
                      {layer.filters.visible ? (
                        <Eye className="w-4 h-4 md:w-3.5 md:h-3.5" />
                      ) : (
                        <EyeOff className="w-4 h-4 md:w-3.5 md:h-3.5" />
                      )}
                    </Button>

                    {/* Kopyala */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 md:h-7 md:w-7 text-muted-foreground hover:text-primary hover:bg-primary/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        duplicateLayer(layer.id);
                      }}
                    >
                      <Copy className="w-4 h-4 md:w-3.5 md:h-3.5" />
                    </Button>

                    {/* Sil */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 md:h-7 md:w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeLayer(layer.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4 md:w-3.5 md:h-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Seçili Katman Göstergesi */}
                {selectedLayerId === layer.id && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-8 bg-primary rounded-r shadow-[0_0_10px_rgba(0,240,255,0.8)]" />
                )}
              </Reorder.Item>
            ))
          )}
        </Reorder.Group>
      </div>

      {/* Alt Bilgi */}
      <div className="p-3 border-t border-primary/30 text-[10px] md:text-xs text-muted-foreground text-center font-tech tracking-widest bg-secondary/20 shrink-0">
        TOTAL: {config.layers.length} KATMAN
      </div>
    </div >
  );
}
