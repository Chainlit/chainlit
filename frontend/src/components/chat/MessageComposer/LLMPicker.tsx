import { cn } from '@/lib/utils';
import {
    Popover,
    PopoverContent,
    PopoverTrigger
} from '@radix-ui/react-popover';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useRef, useState } from 'react';
import { useRecoilValue } from 'recoil';

import { ChainlitContext, ILLM, llmsState } from '@chainlit/react-client';

import Icon from '@/components/Icon';
import { Button } from '@/components/ui/button';
import {
    Command,
    CommandGroup,
    CommandItemAnimated,
    CommandListScrollable
} from '@/components/ui/command';
import { useContext } from 'react';

interface Props {
    disabled?: boolean;
    selectedLLM?: ILLM;
    onLLMSelect: (llm: ILLM) => void;
}

export const LLMPicker = ({
    disabled = false,
    selectedLLM,
    onLLMSelect
}: Props) => {
    const apiClient = useContext(ChainlitContext);
    const llms = useRecoilValue(llmsState);
    const [open, setOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const popoverRef = useRef<HTMLDivElement>(null);

    // Handle direct LLM selection
    const handleLLMSelect = (llm: ILLM) => {
        onLLMSelect(llm);
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
                setSelectedIndex((prev) => (prev + 1) % llms.length);
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex((prev) => (prev - 1 + llms.length) % llms.length);
                break;
            case 'Enter':
                e.preventDefault();
                if (llms[selectedIndex]) {
                    handleLLMSelect(llms[selectedIndex]);
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

    // Helper to render icon (either Lucide or local file)
    const renderIcon = (icon: string | undefined, className: string) => {
        if (!icon) return null;

        if (icon.startsWith('/public')) {
            return (
                <img
                    className={cn('rounded-md', className)}
                    src={apiClient.buildEndpoint(icon)}
                    alt="LLM icon"
                />
            );
        }

        return <Icon name={icon} className={className} />;
    };

    if (!llms.length) return null;

    const Chevron = open ? ChevronUp : ChevronDown;

    return (
        <div className="llm-picker-wrapper inline-flex items-center" ref={popoverRef}>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        id="llm-picker-trigger"
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
                        {renderIcon(selectedLLM?.icon, '!size-4')}
                        <span className="max-w-[120px] truncate">
                            {selectedLLM?.name || 'Select LLM'}
                        </span>
                        <Chevron className="!size-3.5 text-muted-foreground" />
                    </Button>
                </PopoverTrigger>

                <PopoverContent
                    id="llm-picker-popover"
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
                                {llms.map((llm, index) => (
                                    <CommandItemAnimated
                                        key={llm.id}
                                        index={index}
                                        isSelected={index === selectedIndex}
                                        onMouseMove={() => handleMouseMove(index)}
                                        onSelect={() => handleLLMSelect(llm)}
                                        className={cn(
                                            'flex items-start gap-2 px-2 py-2 cursor-pointer',
                                            selectedLLM?.id === llm.id && 'bg-accent'
                                        )}
                                    >
                                        {renderIcon(
                                            llm.icon,
                                            cn(
                                                '!size-5 mt-0.5 text-muted-foreground flex-shrink-0',
                                                index === selectedIndex && 'text-foreground'
                                            )
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-sm leading-tight">
                                                {llm.name}
                                            </div>
                                            <div className="text-xs text-muted-foreground mt-0.5 leading-tight">
                                                {llm.description}
                                            </div>
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

export default LLMPicker;
