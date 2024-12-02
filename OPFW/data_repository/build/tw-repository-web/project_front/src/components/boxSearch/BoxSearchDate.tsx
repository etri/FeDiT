'use strict';

import React from 'react';

import BoxSearchContext from "./BoxSearchContext";
import {getDateString} from "@/utils/timeUtils";

const BoxSearchDate = ({title, startDataKey, endDataKey}:{title:string, startDataKey:string, endDataKey:string}) => {
    const {searchData, setSearchData} = React.useContext(BoxSearchContext);

    const getStartDate = (dateValue:string) => {
        if(dateValue===null||dateValue===undefined||dateValue.length===0){
            return dateValue;
        }
        return dateValue+" 00:00:00";
    }

    const getEndDate = (dateValue:string) => {
        if(dateValue===null||dateValue===undefined||dateValue.length===0){
            return dateValue;
        }
        let date = new Date(dateValue+" 00:00:00");
        date.setDate(date.getDate()+1);
        return getDateString(date);
    }

    const onChangeStartDate = (event:any) => {
        let endDateElement = document.getElementById(endDataKey);
        if( null == endDateElement || ("" === endDateElement.value) ){
            setSearchData( (prevData:any) => {
                let newData = {...prevData};
                newData.viewValueStartDate = event.target.value;
                newData[startDataKey] = getStartDate(event.target.value);
                return newData;
            });
        } else {
            let startDate = new Date(event.target.value);
            let endDate = new Date(endDateElement.value);
            if (startDate > endDate) {
                setSearchData( (prevData:any) => {
                    let newData = {...prevData};
                    newData.viewValueStartDate = null;
                    newData[startDataKey] = null;
                    return newData;
                });

                alert("시작일 항목이 종료일 항목보다 이후 입니다.");
            }else{
                setSearchData( (prevData:any) => {
                    let newData = {...prevData};
                    newData.viewValueStartDate = event.target.value;
                    newData[startDataKey] = getStartDate(event.target.value);
                    return newData;
                });
            }
        }
    }

    const onChangeEndDate = (event:any) => {
        let startDateElement = document.getElementById(startDataKey);
        if( null == startDateElement || ("" === startDateElement.value) ){
            setSearchData( (prevData:any) => {
                let newData = {...prevData};
                newData.viewValueEndDate = event.target.value;
                newData[endDataKey] = getEndDate(event.target.value);
                return newData;
            });
        }else {
            let startDate = new Date(startDateElement.value);
            let endDate = new Date(event.target.value);
            if (startDate > endDate) {
                setSearchData( (prevData:any) => {
                    let newData = {...prevData};
                    newData.viewValueEndDate = event.target.value;
                    newData[endDataKey] = null;
                    return newData;
                });
                alert("시작일 항목이 종료일 항목보다 이후 입니다.");
            }else{
                setSearchData( (prevData:any) => {
                    let newData = {...prevData};
                    newData.viewValueEndDate = event.target.value;
                    newData[endDataKey] = getEndDate(event.target.value);
                    return newData;
                });
            }
        }
    }

    React.useEffect( () => {
        $("#"+startDataKey).datepicker({format: "yyyy-mm-dd"
                                                        ,autoclose: true
                                                        ,language: "ko"
                                                        ,todayBtn: "linked"
                                                        ,clearBtn: true}).on('changeDate', onChangeStartDate);

        $("#"+endDataKey).datepicker({format: "yyyy-mm-dd"
                                                        ,autoclose: true
                                                        ,language: "ko"
                                                        ,todayBtn: "linked"
                                                        ,clearBtn: true}).on('changeDate', onChangeEndDate);
    }, []);

    return (
        <div className="input-group">
            <span className="input-group-addon">{title}</span>
            <input type="text" className="form-control datepicker" name={startDataKey} id={startDataKey}
                   placeholder={"시작일"} value={searchData&&searchData.viewValueStartDate?searchData.viewValueStartDate:""}/>
            <span className="input-group-addon"> ~ </span>
            <input type="text" className="form-control datepicker" name={endDataKey} id={endDataKey}
                   placeholder={"종료일"} value={searchData&&searchData.viewValueEndDate?searchData.viewValueEndDate:""}/>
        </div>
    );
}

export default BoxSearchDate;