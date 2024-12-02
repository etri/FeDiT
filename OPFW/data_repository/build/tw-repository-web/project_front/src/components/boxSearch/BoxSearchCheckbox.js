'use strict';

import React from 'react';
import BoxSearchContext from "./BoxSearchContext";

function BoxSearchCheckbox({title, elementId, dataKey}){
    const {searchData, setSearchData, onSearch} = React.useContext(BoxSearchContext);

    const onChange = () => {
        let checked = $('#'+elementId).prop('checked');
        setSearchData( (prevData) => {
            let newData = {...prevData};
            newData[dataKey] = checked;
            return newData;
        });
    }

    React.useEffect( () => {
        $('#'+elementId).change(function() {
            onChange();
        })
    },[]);

    React.useEffect( () => {
        let searchDataChecked = false;
        if(searchData&&searchData[dataKey]){
            searchDataChecked = searchData[dataKey];
        }

        let checked = $('#'+elementId).prop('checked');
        if(searchDataChecked!==checked){
            $('#'+elementId).prop('checked', searchDataChecked).change();
        }
    },[searchData]);

    return (
        <div className="input-group">
            <span className="input-group-addon">{title}</span>
            <input type="checkbox" id={elementId} name={elementId} data-toggle="toggle"/>
        </div>
    );
}

export default BoxSearchCheckbox;