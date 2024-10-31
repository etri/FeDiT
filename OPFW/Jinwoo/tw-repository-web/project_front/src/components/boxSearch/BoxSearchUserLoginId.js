'use strict';

import React from 'react';

import BoxSearchContext from "./BoxSearchContext";
import Global from "../../modules/Global";

BoxSearchUserLoginId.ID = {
    SELECT_PICKER:"select-picker-user-login-id",
}

function BoxSearchUserLoginId({dataKey}) {
    const [loading, setLoading] = React.useState(true);
    const [userLoginIdList, setUserLoginIdList] = React.useState([]);
    const {searchData, setSearchData} = React.useContext(BoxSearchContext);

    const getStations = () => {
        let params = new URLSearchParams();
        let options = Global.getFetchOption(params);

        fetch("/system/cim/user/login-id-list.json", options)
            .then(res => res.json())
            .then(
                (res) => {
                    if( res.result === "success" ) {
                        setUserLoginIdList(res.data.userLoginIdList);
                        setLoading(false);
                    } else {
                        alert(res.message);
                    }
                }
            );
    }

    const onChange = (event) => {
        changeValue(event.target.value);
    }

    const changeValue = (userLoginId) => {
        setSearchData( (prevData) => {
            let newData = {...prevData};
            newData[dataKey] = userLoginId;
            return newData;
        });
        let value = userLoginId?userLoginId:"";
        $('#'+BoxSearchUserLoginId.ID.SELECT_PICKER).val(value).prop('selected', true).change();
        $('#'+BoxSearchUserLoginId.ID.SELECT_PICKER).selectpicker("refresh");
    }

    React.useEffect( () => {
        changeValue(null);
        getStations();
    }, []);

    React.useEffect( () => {
        $('#'+BoxSearchUserLoginId.ID.SELECT_PICKER).selectpicker("refresh");
    });

    return (
        <div className="input-group">
            <span className="input-group-addon"> 로그인ID </span>
            <select className="selectpicker" name={BoxSearchUserLoginId.ID.SELECT_PICKER} id={BoxSearchUserLoginId.ID.SELECT_PICKER} onChange={onChange} value={searchData&&searchData[dataKey]?searchData[dataKey]:""}>
                <option value="" hidden selected> 로그인ID 선택 </option>
                {loading? null : (
                    userLoginIdList.map( (item) => (
                        <option key={item.userId} value={item.userId}>{item.userLoginId} </option>
                    ))
                )}
            </select>
        </div>
    );
}

export default BoxSearchUserLoginId;