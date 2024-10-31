import {ReactElement} from "react";

export const BoxSearchDateContent = {
    LocalDate: 'LocalDate',
    LocalDateTime: 'LocalDateTime'
} as const;

export type BoxSearchDateContentType = typeof BoxSearchDateContent[keyof typeof BoxSearchDateContent];

export interface BoxSearchOptionProps {
    value?: string;
    label: string;
}