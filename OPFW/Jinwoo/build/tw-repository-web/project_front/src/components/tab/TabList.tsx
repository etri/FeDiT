'use strict';

import { TabItemProps, TabListProps } from "TabTypes";
import { sanitizeForId } from "../../utils/stringUtils";
import {ReactElement, useState} from "react";
import TabItem from "./TabItem";
import React from "react";
// import "@scss/base.scss"
import "./Tabs.scss"

const TabList: React.FC<TabListProps> = ({ children, tabClickCallback, activeTabIndex = 0 }) => {
    const [activeTab, setActiveTab] = useState(activeTabIndex);
    const handleTabClick = (index: number) => {
        setActiveTab(index);
        if(tabClickCallback)
            tabClickCallback(index);
    };

    const tabs = React.Children.toArray(children).filter(
        (child): child is ReactElement<TabItemProps> =>
            React.isValidElement(child) && child.type === TabItem
    );

    return (
        <div className="tabs">
            <nav className="tab-list-wrapper">
                <ul className="tab-list" role="tablist" aria-orientation="horizontal">
                    {tabs.map((tab, index) => (
                        <li key={`tab-${index}`}>
                            <button
                                type="button"
                                key={`tab-btn-${index}`}
                                role="tab"
                                id={`tab-${sanitizeForId(tab.props.label)}`}
                                aria-controls={`panel-${sanitizeForId(tab.props.label)}`}
                                aria-selected={activeTab === index}
                                onClick={() => handleTabClick(index)}
                                className={`tab-btn ${
                                    activeTab === index && "tab-btn--active"
                                }`}
                            >{tab.props.label}</button>
                        </li>
                    ))}
                </ul>
            </nav>
            {tabs[activeTab]}
        </div>
    );
};

export default TabList;