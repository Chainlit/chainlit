/**
 * Represents a single selectable option within a mode.
 */
export interface IModeOption {
    id: string;
    name: string;
    description?: string;
    icon?: string;
    default?: boolean;
}

/**
 * Represents a mode category containing multiple selectable options.
 * Examples: Model selection, Reasoning Effort, Approach preference, etc.
 */
export interface IMode {
    id: string;
    name: string;
    options: IModeOption[];
}
