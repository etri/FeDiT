"use strict";

import React from "react";
import "./DataItemCategoriesStyle";
import DataItemCategoryCardImage from "./DataItemCategoryCardImage";
import "@scss/base.scss";

const DataItemCategoryCard = ({ onClick, title, icon, desc }:{ onClick:()=>void, title:string, icon:string, desc:string }) => {

    return (
        <div className="w-[260px] inline-block select-none"
            onClick={() => onClick()}
            tabIndex={0}
        >
            <div className="card flex flex-row justify-center text-black text-2xl font-bold mb-3 px-2.5">
                <div className="min-w-12 min-h-8">{title}</div>
            </div>
            <DataItemCategoryCardImage icon={icon}/>
            <div className="flex flex-row justify-center text-black text-lg font-medium mb-3 px-2.5">
                <div>{desc}</div>
            </div>
        </div>
    );
}

export default DataItemCategoryCard;