import {ReactElement, ReactNode} from "react";

export interface TabItemProps {
    label: string;
    children: ReactNode;
}

export interface TabListProps {
    activeTabIndex: number;
    tabClickCallback: null|((index:number)=>void);
    children: ReactElement<TabItemProps> | ReactElement<TabItemProps>[];
}