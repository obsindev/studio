import React from 'react';
import { Slider } from '@/components/ui/slider';
import { NumberInput } from '@/components/ui/NumberInput';

interface FilterSliderProps {
    icon: React.ElementType;
    label: string;
    value: number;
    min: number;
    max: number;
    step?: number;
    unit?: string;
    disabled?: boolean;
    onChange: (value: number) => void;
}

export const FilterSlider = React.memo(({
    icon: Icon,
    label,
    value,
    min,
    max,
    step = 1,
    unit = '',
    disabled = false,
    onChange,
}: FilterSliderProps) => (
    <div className={`space-y-2 ${disabled ? 'opacity-40 pointer-events-none' : ''}`}>
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
