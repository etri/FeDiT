'use strict';

import React, {useEffect, useState, useRef, useCallback} from "react";
import ReactDOM from "react-dom";
import SearchBar from "@/components/SearchBar";
import PublicHeader, {TOP_MENU} from "@/components/publicHeader/PublicHeader";
import DataListContent from "./DataListContents";
import PublicFooter from "@/components/publicFooter/PublicFooter";
import {PublicContainer} from "@/components/PublicContainer";
import {PublicMain} from "@/components/PublicMain";
import DataItemCategoriesMini from "@/components/dataItemCategoriesMini/DataItemCategoriesMini";

const DataList = () => {
    const [searchTxt, setSearchTxt] = useState('')
    const [category, setCategory] = useState(null)
    const [searchValue, setSearchValue] = useState('')
    const [mounted, setMounted] = useState(true)

    const onSearchBarKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && !e.nativeEvent.isComposing && searchTxt.trim() !== '') {
            e.preventDefault()
            let categoryQuery = category&&category!==''?`&category=${category}`:'';
            window.location.href = `/find-data.mng?keyword=${searchTxt}${categoryQuery}`
        }
    }, [searchTxt])

    useEffect(() => {
        const queryString = window.location.search;
        const params = new URLSearchParams(queryString)

        const categoryQuery = params.get('category');
        if(categoryQuery!==null) setCategory(categoryQuery);

        const keyword = params.get("keyword")
        if (keyword!==null) setSearchTxt(keyword);

        if((categoryQuery===null||categoryQuery.trim()==='')
            &&(keyword===null||searchTxt.trim()==='')){
            setMounted(false)
        }
    }, []);

    useEffect(() => {
        if (mounted && searchTxt) {
            setSearchValue(searchTxt)
            setMounted(false)
        }

        if (mounted && category) {
            setMounted(false)
        }
    }, [searchTxt, category]);

    return (
        <PublicContainer>
            <PublicHeader/>
            <PublicMain>
                {!mounted && <DataItemCategoriesMini category={category}/>}
                <SearchBar searchTxt={searchTxt} placeholder={!mounted && "Search data (eg.대기오염정보)"} setSearchTxt={setSearchTxt} onSearchBarKeyDown={onSearchBarKeyDown} />
                {!mounted && <DataListContent searchValue={searchValue} category={category}/>}
            </PublicMain>
            <PublicFooter/>
        </PublicContainer>
    )
}

let domContainer = document.querySelector('#contentContainer');
ReactDOM.render(<DataList />, domContainer);