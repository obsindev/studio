import React from 'react';
import { Input } from './input';

interface NumberInputProps {
    value: number;
    onChange: (val: number) => void;
    className?: string;
    step?: string;
    placeholder?: string;
}

export function NumberInput({
    value,
    onChange,
    className,
    ...props
}: NumberInputProps) {
    const [localValue, setLocalValue] = React.useState(value.toString());

    // Update local state when value from prop changes (if different)
    React.useEffect(() => {
        if (parseFloat(localValue) !== value) {
            setLocalValue(value.toString());
        }
    }, [value, localValue]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVal = e.target.value;
        setLocalValue(newVal);

        // Only send updates if it's a valid number and doesn't end with a dot
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
