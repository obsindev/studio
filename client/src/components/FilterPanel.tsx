import React from 'react';
import { useProject } from '@/contexts/ProjectContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import {
  Palette,
  Sun,
  Contrast,
  Droplets,
  CircleDot,
  Move,
  Eye,
  Plus,
  Maximize2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { FilterSlider } from './FilterPanel/FilterSlider';
import { FilterSection } from './FilterPanel/FilterSection';
import { TransformControls } from './FilterPanel/TransformControls';

export function FilterPanel() {
  const { selectedLayer, updateLayerFilters, updateLayer } = useProject();

  if (!selectedLayer) {
    return (
      <div className="cyber-panel h-full flex flex-col">
        <div className="p-3 border-b border-primary/30">
          <h2 className="font-display text-sm uppercase tracking-wider text-primary">
            Özellikler
          </h2>
        </div>
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <Palette className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Katman seçilmedi</p>
            <p className="text-xs mt-1">Düzenlemek için bir katman seçin</p>
          </div>
        </div>
      </div>
    );
  }

  const filters = selectedLayer.filters;
  const activeFilters = filters.activeFilters || [];
  const disabledFilters = filters.disabledFilters || [];

  const handleFilterChange = (key: string, value: any) => {
    updateLayerFilters(selectedLayer.id, { [key]: value });
  };

  const toggleFilter = (filterId: string, enabled: boolean) => {
    let newDisabled = [...disabledFilters];
    if (enabled) {
      newDisabled = newDisabled.filter(id => id !== filterId);
    } else {
      if (!newDisabled.includes(filterId)) newDisabled.push(filterId);
    }
    updateLayerFilters(selectedLayer.id, { disabledFilters: newDisabled });
  };

  const addFilter = (filterId: string) => {
    if (!activeFilters.includes(filterId)) {
      updateLayerFilters(selectedLayer.id, {
        activeFilters: [...activeFilters, filterId]
      });
    }
  };

  const removeFilter = (filterId: string) => {
    updateLayerFilters(selectedLayer.id, {
      activeFilters: activeFilters.filter(id => id !== filterId),
      disabledFilters: disabledFilters.filter(id => id !== filterId)
    });
  };

  const AVAILABLE_OPTIONS = [
    { id: 'hueRotate', label: 'Renk Tonu', icon: Palette },
    { id: 'colorAdjust', label: 'Renk Ayarı', icon: Sun },
    { id: 'blur', label: 'Bulanıklık', icon: CircleDot },
    { id: 'uvScroll', label: 'UV Kaydırma', icon: Move },
  ];

  return (
    <div className="cyber-panel h-full flex flex-col overflow-hidden max-h-[calc(100vh-3.5rem)]">
      <div className="p-3 border-b border-primary/30 flex items-center justify-between shrink-0">
        <h2 className="font-display text-sm uppercase tracking-wider text-primary">
          Özellikler
        </h2>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 border-primary/30 text-primary hover:bg-primary/20"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              <span className="text-xs">Filtre Ekle</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-card/95 border-primary/30 backdrop-blur-sm">
            {AVAILABLE_OPTIONS.map(opt => (
              <DropdownMenuItem
                key={opt.id}
                onClick={() => addFilter(opt.id)}
                disabled={activeFilters.includes(opt.id)}
                className="flex items-center gap-2 cursor-pointer hover:bg-primary/20"
              >
                <opt.icon className="w-4 h-4 text-primary" />
                <span className="text-xs">{opt.label}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ScrollArea className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Katman İsmi
              </Label>
              <Input
                value={selectedLayer.name}
                onChange={(e) => updateLayer(selectedLayer.id, { name: e.target.value })}
                className="bg-secondary/50 border-primary/20 focus:border-primary h-8 text-xs font-tech"
              />
            </div>

            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-primary" />
                <span className="text-xs font-display uppercase">Görünür</span>
              </div>
              <Switch
                checked={filters.visible}
                onCheckedChange={(v) => handleFilterChange('visible', v)}
              />
            </div>
          </div>

          <Separator className="bg-primary/20" />

          <FilterSection
            id="transform"
            label="Dönüşüm (Transform)"
            icon={Maximize2}
            isPermanent={true}
            isEnabled={true}
          >
            <TransformControls filters={filters} onChange={handleFilterChange} />
          </FilterSection>

          <div className="space-y-4">
            <h3 className="text-[10px] font-display text-muted-foreground tracking-widest uppercase px-1">
              Eklenmiş Filtreler
            </h3>

            {activeFilters.length === 0 && (
              <div className="text-center py-6 border border-dashed border-primary/10 rounded bg-card/10">
                <p className="text-[10px] text-muted-foreground italic">Henüz filtre eklenmedi</p>
                <p className="text-[9px] text-primary/40">Yukarıdaki "+" butonunu kullanın</p>
              </div>
            )}

            {activeFilters.includes('hueRotate') && (
              <FilterSection
                id="hueRotate"
                label="Renk Tonu Kaydırma"
                icon={Palette}
                isEnabled={!disabledFilters.includes('hueRotate')}
                onToggle={(v) => toggleFilter('hueRotate', v)}
                onRemove={() => removeFilter('hueRotate')}
              >
                <FilterSlider
                  icon={Palette}
                  label="Ton"
                  value={filters.hueRotate}
                  min={0}
                  max={360}
                  unit="°"
                  disabled={disabledFilters.includes('hueRotate')}
                  onChange={(v) => handleFilterChange('hueRotate', v)}
                />
              </FilterSection>
            )}

            {activeFilters.includes('colorAdjust') && (
              <FilterSection
                id="colorAdjust"
                label="Renk Ayarları"
                icon={Sun}
                isEnabled={!disabledFilters.includes('colorAdjust')}
                onToggle={(v) => toggleFilter('colorAdjust', v)}
                onRemove={() => removeFilter('colorAdjust')}
              >
                <FilterSlider
                  icon={Sun}
                  label="Parlaklık"
                  value={filters.brightness}
                  min={0}
                  max={200}
                  unit="%"
                  disabled={disabledFilters.includes('colorAdjust')}
                  onChange={(v) => handleFilterChange('brightness', v)}
                />
                <FilterSlider
                  icon={Contrast}
                  label="Kontrast"
                  value={filters.contrast}
                  min={0}
                  max={200}
                  unit="%"
                  disabled={disabledFilters.includes('colorAdjust')}
                  onChange={(v) => handleFilterChange('contrast', v)}
                />
                <FilterSlider
                  icon={Droplets}
                  label="Doygunluk"
                  value={filters.saturate}
                  min={0}
                  max={200}
                  unit="%"
                  disabled={disabledFilters.includes('colorAdjust')}
                  onChange={(v) => handleFilterChange('saturate', v)}
                />
              </FilterSection>
            )}

            {activeFilters.includes('blur') && (
              <FilterSection
                id="blur"
                label="Bulanıklık"
                icon={CircleDot}
                isEnabled={!disabledFilters.includes('blur')}
                onToggle={(v) => toggleFilter('blur', v)}
                onRemove={() => removeFilter('blur')}
              >
                <FilterSlider
                  icon={CircleDot}
                  label="Yarıçap"
                  value={filters.blur}
                  min={0}
                  max={20}
                  unit="px"
                  disabled={disabledFilters.includes('blur')}
                  onChange={(v) => handleFilterChange('blur', v)}
                />
              </FilterSection>
            )}

            {activeFilters.includes('uvScroll') && (
              <FilterSection
                id="uvScroll"
                label="UV Kaydırma (Efect)"
                icon={Move}
                isEnabled={!disabledFilters.includes('uvScroll')}
                onToggle={(v) => toggleFilter('uvScroll', v)}
                onRemove={() => removeFilter('uvScroll')}
              >
                <FilterSlider
                  icon={Move}
                  label="Yatay Hız"
                  value={filters.uvScrollX}
                  min={-10}
                  max={10}
                  step={0.1}
                  disabled={disabledFilters.includes('uvScroll')}
                  onChange={(v) => handleFilterChange('uvScrollX', v)}
                />
                <FilterSlider
                  icon={Move}
                  label="Dikey Hız"
                  value={filters.uvScrollY}
                  min={-10}
                  max={10}
                  step={0.1}
                  disabled={disabledFilters.includes('uvScroll')}
                  onChange={(v) => handleFilterChange('uvScrollY', v)}
                />
              </FilterSection>
            )}
          </div>
        </div>
      </ScrollArea>

      <div className="p-2 border-t border-primary/30 text-[10px] text-muted-foreground text-center font-tech shrink-0 bg-background/50">
        {selectedLayer.type.toUpperCase()} • {selectedLayer.id.slice(-8)}
      </div>
    </div>
  );
}
