import { cn } from '@/lib/utils';
import {
    Popover,
    PopoverContent,
    PopoverTrigger
} from '@radix-ui/react-popover';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useContext, useRef, useState } from 'react';

import { ChainlitContext, IMode, IModeOption } from '@chainlit/react-client';

import Icon from '@/components/Icon';
import { Button } from '@/components/ui/button';
import {
    Command,
    CommandGroup,
    CommandItemAnimated,
    CommandListScrollable
} from '@/components/ui/command';

interface Props {
    mode: IMode;
    disabled?: boolean;
    selectedOptionId?: string;
    onOptionSelect: (modeId: string, optionId: string) => void;
}

/**
 * ModePicker displays a single mode category and allows selection from its options.
 * Multiple ModePicker instances can be rendered for different mode categories.
 */
export const ModePicker = ({
    mode,
    disabled = false,
    selectedOptionId,
    onOptionSelect
}: Props) => {
    const apiClient = useContext(ChainlitContext);
    const [open, setOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const popoverRef = useRef<HTMLDivElement>(null);

    const options = mode.options;
    const selectedOption = options.find(opt => opt.id === selectedOptionId) || options[0];

    // Handle option selection
    const handleOptionSelect = (option: IModeOption) => {
        onOptionSelect(mode.id, option.id);
        setOpen(false);
    };

    // Keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!open) {
            if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
                e.preventDefault();
                setOpen(true);
            }
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex((prev) => (prev + 1) % options.length);
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex((prev) => (prev - 1 + options.length) % options.length);
                break;
            case 'Enter':
                e.preventDefault();
                if (options[selectedIndex]) {
                    handleOptionSelect(options[selectedIndex]);
                }
                break;
            case 'Escape':
                e.preventDefault();
                setOpen(false);
                break;
        }
    };

    const handleMouseMove = (index: number) => {
        setSelectedIndex(index);
    };

    const handleMouseLeave = () => {
        // Keep current selection on mouse leave
    };

    // Helper to render icon - supports Lucide names, local paths, and URLs
    const renderIcon = (icon: string | undefined, className: string) => {
        if (!icon) return null;

        // Local public file path
        if (icon.startsWith('/public')) {
            return (
                <img
                    className={cn('rounded-md', className)}
                    src={apiClient.buildEndpoint(icon)}
                    alt="Mode option icon"
                />
            );
        }

        // Remote URL
        if (icon.startsWith('http://') || icon.startsWith('https://')) {
            return (
                <img
                    className={cn('rounded-md', className)}
                    src={icon}
                    alt="Mode option icon"
                />
            );
        }

        // Lucide icon name
        return <Icon name={icon} className={className} />;
    };

    if (!options.length) return null;

    const Chevron = open ? ChevronUp : ChevronDown;

    return (
        <div className="mode-picker-wrapper inline-flex items-center" ref={popoverRef}>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        id={`mode-picker-trigger-${mode.id}`}
                        variant="ghost"
                        size="sm"
                        disabled={disabled}
                        className={cn(
                            'inline-flex items-center gap-1.5 h-7 px-2 rounded-md',
                            'text-xs font-medium',
                            'hover:bg-muted transition-colors',
                            'focus:outline-none focus-visible:ring-1 focus-visible:ring-ring',
                            open && 'bg-muted'
                        )}
                        onKeyDown={handleKeyDown}
                    >
                        {renderIcon(selectedOption?.icon, '!size-4')}
                        <span className="max-w-[120px] truncate">
                            {selectedOption?.name || mode.name}
                        </span>
                        <Chevron className="!size-3.5 text-muted-foreground" />
                    </Button>
                </PopoverTrigger>

                <PopoverContent
                    id={`mode-picker-popover-${mode.id}`}
                    align="start"
                    side="top"
                    sideOffset={4}
                    className={cn(
                        'p-1 rounded-md border shadow-lg bg-popover',
                        'animate-in fade-in-0 zoom-in-95 duration-150',
                        'w-[280px]'
                    )}
                    onKeyDown={handleKeyDown}
                    onMouseLeave={handleMouseLeave}
                >
                    <Command className="overflow-hidden bg-transparent">
                        <CommandListScrollable maxItems={6} className="custom-scrollbar">
                            <CommandGroup className="p-0">
                                {options.map((option, index) => (
                                    <CommandItemAnimated
                                        key={option.id}
                                        index={index}
                                        isSelected={index === selectedIndex}
                                        onMouseMove={() => handleMouseMove(index)}
                                        onSelect={() => handleOptionSelect(option)}
                                        className={cn(
                                            'flex items-start gap-2 px-2 py-2 cursor-pointer',
                                            selectedOptionId === option.id && 'bg-accent'
                                        )}
                                    >
                                        {renderIcon(
                                            option.icon,
                                            cn(
                                                '!size-5 mt-0.5 text-muted-foreground flex-shrink-0',
                                                index === selectedIndex && 'text-foreground'
                                            )
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-sm leading-tight">
                                                {option.name}
                                            </div>
                                            {option.description && (
                                                <div className="text-xs text-muted-foreground mt-0.5 leading-tight">
                                                    {option.description}
                                                </div>
                                            )}
                                        </div>
                                    </CommandItemAnimated>
                                ))}
                            </CommandGroup>
                        </CommandListScrollable>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    );
};

export default ModePicker;
