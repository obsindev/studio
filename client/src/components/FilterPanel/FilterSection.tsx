import React from 'react';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { ChevronRight, ChevronDown, Trash2 } from 'lucide-react';

interface FilterSectionProps {
    id: string;
    label: string;
    icon: React.ElementType;
    isPermanent?: boolean;
    isEnabled: boolean;
    onToggle?: (enabled: boolean) => void;
    onRemove?: () => void;
    children: React.ReactNode;
}

export const FilterSection = ({
    id,
    label,
    icon: Icon,
    isPermanent = false,
    isEnabled,
    onToggle,
    onRemove,
    children,
}: FilterSectionProps) => {
    const [isOpen, setIsOpen] = React.useState(true);

    return (
        <Collapsible
            open={isOpen}
            onOpenChange={setIsOpen}
            className="border border-primary/20 bg-card/20 rounded shadow-sm overflow-hidden"
        >
            <div className={`flex items-center gap-2 px-3 py-2 bg-secondary/30 ${!isEnabled ? 'opacity-60' : ''}`}>
                <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-5 w-5 p-0 hover:bg-primary/20">
                        {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                    </Button>
                </CollapsibleTrigger>

                <Icon className={`w-4 h-4 ${isEnabled ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className="flex-1 text-xs font-display uppercase tracking-wider truncate">
                    {label}
                </span>

                <div className="flex items-center gap-2">
                    {!isPermanent && (
                        <Switch
                            size="sm"
                            checked={isEnabled}
                            onCheckedChange={onToggle}
                            className="scale-75 h-4"
                        />
                    )}
                    {!isPermanent && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onRemove}
                            className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                    )}
                </div>
            </div>

            <CollapsibleContent>
                <div className={`p-4 space-y-4 border-t border-primary/10 ${!isEnabled ? 'bg-black/20 italic' : ''}`}>
                    {children}
                </div>
            </CollapsibleContent>
        </Collapsible>
    );
};
