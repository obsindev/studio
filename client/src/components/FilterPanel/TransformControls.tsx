import React from 'react';
import { LayerFilters } from '@/types';
import { Label } from '@/components/ui/label';
import { NumberInput } from '@/components/ui/NumberInput';
import { Switch } from '@/components/ui/switch';
import { FilterSlider } from './FilterSlider';
import { Maximize2, RotateCw, FlipHorizontal, FlipVertical, Eye } from 'lucide-react';

interface TransformControlsProps {
    filters: LayerFilters;
    onChange: (key: string, value: any) => void;
}

export const TransformControls = ({ filters, onChange }: TransformControlsProps) => {
    return (
        <div className="space-y-4">
            <FilterSlider
                icon={Eye}
                label="Opaklık"
                value={filters.opacity}
                min={0}
                max={100}
                unit="%"
                onChange={(v) => onChange('opacity', v)}
            />

            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground uppercase">X Konum</Label>
                    <NumberInput
                        value={filters.offsetX}
                        onChange={(v) => onChange('offsetX', v)}
                        className="bg-secondary/50 border-primary/20 h-7 text-xs font-tech text-right"
                    />
                </div>
                <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground uppercase">Y Konum</Label>
                    <NumberInput
                        value={filters.offsetY}
                        onChange={(v) => onChange('offsetY', v)}
                        className="bg-secondary/50 border-primary/20 h-7 text-xs font-tech text-right"
                    />
                </div>
            </div>

            <FilterSlider
                icon={Maximize2}
                label="Ölçek"
                value={filters.scale}
                min={0.1}
                max={3}
                step={0.1}
                unit="x"
                onChange={(v) => onChange('scale', v)}
            />

            <FilterSlider
                icon={RotateCw}
                label="Döndürme"
                value={filters.rotation}
                min={0}
                max={360}
                unit="°"
                onChange={(v) => onChange('rotation', v)}
            />

            <div className="flex items-center gap-4 pt-1">
                <div className="flex items-center gap-2">
                    <FlipHorizontal className="w-3.5 h-3.5 text-primary" />
                    <span className="text-[10px] uppercase">Yatay</span>
                    <Switch
                        checked={filters.flipX}
                        onCheckedChange={(v) => onChange('flipX', v)}
                        className="scale-75"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <FlipVertical className="w-3.5 h-3.5 text-primary" />
                    <span className="text-[10px] uppercase">Dikey</span>
                    <Switch
                        checked={filters.flipY}
                        onCheckedChange={(v) => onChange('flipY', v)}
                        className="scale-75"
                    />
                </div>
            </div>
        </div>
    );
};
