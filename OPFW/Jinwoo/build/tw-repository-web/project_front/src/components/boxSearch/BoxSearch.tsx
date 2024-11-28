'use strict';

import React, { useEffect } from "react";

import BoxSearchContext from "./BoxSearchContext";
import { userEvent } from "@storybook/test";

type props = {
    onSearchCb: (data:any)=>void;
    onResetCb: ()=>void;
    children: React.ReactNode;
    rerenderTime?:number;
};

const BoxSearch = ({onSearchCb, onResetCb, children, rerenderTime}:props) => {
    const [searchData, setSearchData] = React.useState({});

    useEffect(() => {
        onReset();
    }, [rerenderTime]);

    const onSearch = () => {
        onSearchCb(searchData);
    }
    const onReset = () => {
        setSearchData({})
        onResetCb();
    }

    return (
        <div className="col-xs-12">
            <div className="box box-success">
                <div className="box-header">
                    <h3 className="box-title"><i className='material-icons'
                                                 style={{fontSize: '16px'}}>play_arrow</i>&nbsp;&nbsp;검색조건
                    </h3>
                </div>
                <div className="box-body">
                    {/*<div className="row">*/}
                        <BoxSearchContext.Provider value = {{ searchData, setSearchData, onSearch }}>
                            {children}
                        </BoxSearchContext.Provider>
                    {/*</div>*/}
                </div>
                <div className="box-footer">
                    <div className="btn-group pull-right">
                        <button type="button" className="btn btn-outline-primary" id="searchBtn" onClick={onSearch}>검색
                        </button>
                        <button type="button" className="btn btn-outline-primary" id="resetBtn" onClick={onReset}>리셋
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default BoxSearch;