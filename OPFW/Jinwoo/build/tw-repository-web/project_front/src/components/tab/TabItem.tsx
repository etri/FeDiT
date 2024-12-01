'use strict';

import {TabItemProps} from "@/components/tab/TabTypes";
import {sanitizeForId} from "@/utils/stringUtils";

const TabItem: React.FC<TabItemProps> = ({ label, children }) => {

    return (
        <div
            className="tab-panel"
            role="tabpanel"
            aria-labelledby={`tab-${sanitizeForId(label)}`}
            id={`panel-${sanitizeForId(label)}`}
        >
            {children}
        </div>
    )
}

export default TabItem;