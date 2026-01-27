/**
 * FilterPanel Component
 * Cyberpunk Control Room - Katman Filtre/Özellik Paneli
 * 
 * OBS benzeri filtre kontrolleri: opacity, offset, scale, rotation, vb.
 */

import React from 'react';
import { useProject } from '@/contexts/ProjectContext';
import { DEFAULT_FILTERS } from '@/types';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  RotateCcw,
  Move,
  Maximize2,
  RotateCw,
  Sun,
  Contrast,
  Droplets,
  CircleDot,
  FlipHorizontal,
  FlipVertical,
  Palette,
  Eye,
} from 'lucide-react';

// Sayısal giriş bileşeni - Yazarken state güncellemelerinin araya girmesini engeller
function NumberInput({
  value,
  onChange,
  className,
  ...props
}: {
  value: number;
  onChange: (val: number) => void;
  className?: string;
  step?: string;
  placeholder?: string;
}) {
  const [localValue, setLocalValue] = React.useState(value.toString());

  // Dışarıdan gelen değer değişirse local state'i güncelle (farklıysa)
  React.useEffect(() => {
    if (parseFloat(localValue) !== value) {
      setLocalValue(value.toString());
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    setLocalValue(newVal);

    // Sadece geçerli bir sayı ise ve sonu nokta ile bitmiyorsa güncellemeyi gönder
    if (newVal === '' || newVal === '-') return;

    const num = parseFloat(newVal);
    if (!isNaN(num) && !newVal.endsWith('.')) {
      onChange(num);
    }
  };

  const handleBlur = () => {
    if (localValue === '' || localValue === '-' || isNaN(parseFloat(localValue))) {
      onChange(0);
      setLocalValue('0');
    } else {
      const parsed = parseFloat(localValue);
      onChange(parsed);
      setLocalValue(parsed.toString());
    }
  };

  return (
    <Input
      type="text"
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
      className={className}
      {...props}
    />
  );
}

// Filtre Slider bileşeni - Performans için dışarıda tanımlandı
interface FilterSliderProps {
  icon: React.ElementType;
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
}

const FilterSlider = React.memo(({
  icon: Icon,
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange,
}: FilterSliderProps) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm">
        <Icon className="w-4 h-4 text-primary" />
        <span>{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <NumberInput
          value={value}
          onChange={onChange}
          className="w-16 h-7 text-right font-tech text-xs bg-secondary/50 border-primary/20"
        />
        <span className="text-[10px] font-tech text-muted-foreground w-4">
          {unit}
        </span>
      </div>
    </div>
    <Slider
      value={[value]}
      min={min}
      max={max}
      step={step}
      onValueChange={([v]) => onChange(v)}
      className="[&_[role=slider]]:bg-primary [&_[role=slider]]:border-primary [&_.relative]:bg-secondary [&_[data-orientation=horizontal]>[data-orientation=horizontal]]:bg-primary"
    />
  </div>
));

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

  const handleFilterChange = (key: keyof typeof filters, value: number | boolean) => {
    updateLayerFilters(selectedLayer.id, { [key]: value });
  };

  const handleResetFilters = () => {
    updateLayerFilters(selectedLayer.id, DEFAULT_FILTERS);
  };

  return (
    <div className="cyber-panel h-full flex flex-col">
      {/* Panel Başlığı */}
      <div className="p-3 border-b border-primary/30 flex items-center justify-between">
        <h2 className="font-display text-sm uppercase tracking-wider text-primary">
          Özellikler
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleResetFilters}
          className="h-7 px-2 text-muted-foreground hover:text-primary hover:bg-primary/20"
        >
          <RotateCcw className="w-3 h-3 mr-1" />
          <span className="text-xs">Sıfırla</span>
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Katman Adı */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">
              Katman Adı
            </Label>
            <Input
              value={selectedLayer.name}
              onChange={(e) => updateLayer(selectedLayer.id, { name: e.target.value })}
              className="bg-secondary border-primary/30 focus:border-primary"
            />
          </div>

          <Separator className="bg-primary/20" />

          {/* Görünürlük */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-primary" />
              <span className="text-sm">Görünür</span>
            </div>
            <Switch
              checked={filters.visible}
              onCheckedChange={(v) => handleFilterChange('visible', v)}
            />
          </div>

          <Separator className="bg-primary/20" />

          {/* Opaklık */}
          <FilterSlider
            icon={Eye}
            label="Opaklık"
            value={filters.opacity}
            min={0}
            max={100}
            unit="%"
            onChange={(v) => handleFilterChange('opacity', v)}
          />

          <Separator className="bg-primary/20" />

          {/* Konum */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Move className="w-4 h-4 text-primary" />
              <span>Konum</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">X Offset</Label>
                <Input
                  type="number"
                  value={filters.offsetX}
                  onChange={(e) => handleFilterChange('offsetX', Number(e.target.value))}
                  className="bg-secondary border-primary/30 focus:border-primary font-tech"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Y Offset</Label>
                <Input
                  type="number"
                  value={filters.offsetY}
                  onChange={(e) => handleFilterChange('offsetY', Number(e.target.value))}
                  className="bg-secondary border-primary/30 focus:border-primary font-tech"
                />
              </div>
            </div>
          </div>

          <Separator className="bg-primary/20" />

          {/* Dönüşüm */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Maximize2 className="w-4 h-4 text-primary" />
              <span>Dönüşüm</span>
            </div>

            <FilterSlider
              icon={Maximize2}
              label="Ölçek"
              value={filters.scale}
              min={0.1}
              max={3}
              step={0.1}
              unit="x"
              onChange={(v) => handleFilterChange('scale', v)}
            />

            <FilterSlider
              icon={RotateCw}
              label="Döndürme"
              value={filters.rotation}
              min={0}
              max={360}
              unit="°"
              onChange={(v) => handleFilterChange('rotation', v)}
            />

            {/* Çevirme */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <FlipHorizontal className="w-4 h-4 text-primary" />
                <span className="text-sm">Yatay</span>
                <Switch
                  checked={filters.flipX}
                  onCheckedChange={(v) => handleFilterChange('flipX', v)}
                />
              </div>
              <div className="flex items-center gap-2">
                <FlipVertical className="w-4 h-4 text-primary" />
                <span className="text-sm">Dikey</span>
                <Switch
                  checked={filters.flipY}
                  onCheckedChange={(v) => handleFilterChange('flipY', v)}
                />
              </div>
            </div>
          </div>

          <Separator className="bg-primary/20" />

          {/* Renk Ayarları */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Palette className="w-4 h-4 text-primary" />
              <span>Renk Ayarları</span>
            </div>

            <FilterSlider
              icon={Palette}
              label="Renk Tonu"
              value={filters.hueRotate}
              min={0}
              max={360}
              unit="°"
              onChange={(v) => handleFilterChange('hueRotate', v)}
            />

            <FilterSlider
              icon={Sun}
              label="Parlaklık"
              value={filters.brightness}
              min={0}
              max={200}
              unit="%"
              onChange={(v) => handleFilterChange('brightness', v)}
            />

            <FilterSlider
              icon={Contrast}
              label="Kontrast"
              value={filters.contrast}
              min={0}
              max={200}
              unit="%"
              onChange={(v) => handleFilterChange('contrast', v)}
            />

            <FilterSlider
              icon={Droplets}
              label="Doygunluk"
              value={filters.saturate}
              min={0}
              max={200}
              unit="%"
              onChange={(v) => handleFilterChange('saturate', v)}
            />
          </div>

          <Separator className="bg-primary/20" />

          {/* Efektler */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <CircleDot className="w-4 h-4 text-primary" />
              <span>Efektler</span>
            </div>

            <FilterSlider
              icon={CircleDot} label="Bulanıklık"
              value={filters.blur}
              min={0}
              max={20}
              unit="px"
              onChange={(v) => handleFilterChange('blur', v)}
            />
          </div>

          <Separator className="bg-primary/20" />

          {/* UV Scroll */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Move className="w-4 h-4 text-primary" />
              <span>UV Kaydırma (Hız)</span>
            </div>

            <div className="space-y-6">
              <FilterSlider
                icon={Move}
                label="X Hızı"
                value={filters.uvScrollX}
                min={-10}
                max={10}
                step={0.1}
                onChange={(v) => handleFilterChange('uvScrollX', v)}
              />

              <FilterSlider
                icon={Move}
                label="Y Hızı"
                value={filters.uvScrollY}
                min={-10}
                max={10}
                step={0.1}
                onChange={(v) => handleFilterChange('uvScrollY', v)}
              />
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Alt Bilgi */}
      <div className="p-2 border-t border-primary/30 text-xs text-muted-foreground text-center font-tech">
        {selectedLayer.type.toUpperCase()} • {selectedLayer.id.slice(-8)}
      </div>
    </div>
  );
}
