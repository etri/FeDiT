'use strict';

import React from 'react';

import Global from "../modules/Global"

function MenuInfoTag() {
    const [loading, setLoading] = React.useState(true);
    const [dataInitial, setDataInitial] = React.useState(null);

    const fetchInitial = () => {
        let params = new URLSearchParams();
        let options = Global.getFetchOption(params);

        fetch("/menu/get-info-tag.json", options)
            .then(res => res.json())
            .then(
                (res) => {
                    if( res.result === "success" ) {
                        setDataInitial(res.data);
                        setLoading(false);
                    } else {
                        alert(res.message);
                    }
                }
            );
    }

    React.useEffect( () => {
        fetchInitial();
    }, []);

    const getContents = () => {
        if(loading){
            return null;
        }

        let content_h1 = [];
        let content_desc = [];
        let content_ol = [];
        let content_upperMenuList = [];
        if(null != dataInitial.currentMenuNm){
            if(!strUtil.isEmpty(dataInitial.currentMenuDesc)){
                content_desc.push(<small> {dataInitial.currentMenuDesc} </small>);
            }

            content_h1.push(<h1>
                                <i className={dataInitial.currentMenuIcon}/>{dataInitial.currentMenuNm}
                                {content_desc}
                            </h1>);

            content_upperMenuList = dataInitial.upperMenuNameList.map( (item, index) => {
                return (<li>
                            {index===0?<i className='material-icons'>home</i>:null}
                            {item}
                       </li>);
            });
            content_ol.push(<ol className="breadcrumb">
                                {content_upperMenuList}
                           </ol> );
        }

        return (
            <React.Fragment>
                {content_h1}
                {content_ol}
            </React.Fragment>
        );
    }

    return (
        <React.Fragment>
            {getContents()}
        </React.Fragment>
    );
}

export default MenuInfoTag;