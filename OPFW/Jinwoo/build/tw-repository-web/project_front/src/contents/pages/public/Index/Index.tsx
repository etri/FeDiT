'use strict';

import React, {useState, useCallback} from "react";
import ReactDOM from "react-dom";
import PublicHeader from "@/components/publicHeader/PublicHeader";
import SearchBar from "@/components/SearchBar";
import PublicFooter from "@/components/publicFooter/PublicFooter";
import {PublicMain} from "@/components/PublicMain";
import {PublicContainer} from "@/components/PublicContainer";
import DataItemCategories from "@/components/dataItemCategories/DataItemCategories";

const Index = ({}) => {
    const [searchTxt, setSearchTxt] = useState<string>('')

    const onSearchBarKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && !e.nativeEvent.isComposing) {
            e.preventDefault()
            window.location.href = `/find-data.mng?keyword=${searchTxt}`
        }
    }, [searchTxt])

    return (
        <PublicContainer>
            <PublicHeader/>
            <PublicMain>
                <SearchBar searchTxt={searchTxt} placeholder={"Search data (eg.대기오염정보)"} setSearchTxt={setSearchTxt} onSearchBarKeyDown={onSearchBarKeyDown} />
                <DataItemCategories/>
            </PublicMain>
            <PublicFooter/>
        </PublicContainer>
    );
}

let domContainer = document.querySelector('#contentContainer');
ReactDOM.render(<Index/>, domContainer);