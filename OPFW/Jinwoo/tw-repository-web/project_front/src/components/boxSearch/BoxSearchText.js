'use strict';

import React from 'react';

import BoxSearchContext from "./BoxSearchContext";

function BoxSearchText({title, elementId, dataKey, maxlength}) {
    const {searchData, setSearchData, onSearch} = React.useContext(BoxSearchContext);

    const onChange = (event) => {
        setSearchData( (prevData) => {
            let newData = {...prevData};
            newData[dataKey] = event.target.value;
            return newData;
        });
    }

    const onKeyDown = (event) => {
        if(event.keyCode===13) {
            onSearch(event);
        }
    }

    return (
        <div className="input-group">
            <span className="input-group-addon">{title}</span>
            <input type="text" name={elementId} id={elementId} className="form-control searchOption" placeholder={title+" 입력"} maxLength={maxlength} onChange={onChange} onKeyDown={onKeyDown}
                   value={searchData&&searchData[dataKey]?searchData[dataKey]:""}/>
        </div>
    );
}

export default BoxSearchText;