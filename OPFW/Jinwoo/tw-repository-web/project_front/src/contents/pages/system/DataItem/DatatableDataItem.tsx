'use strict';

import { MutableRefObject, useEffect, useRef } from "react";

import Global from "@/modules/Global";
import { errorHandlerAjax } from "@/utils/ajaxUtil";

type props = {
    searchData:any;
    onClickDetail:(data:any)=>void;
    onClickModify:(data:any)=>void;
    onClickDelete:(data:any)=>void
}

const DatatableDataItem = ({searchData, onClickDetail, onClickModify, onClickDelete}:props) => {
    const datatable : MutableRefObject<any> = useRef();
    const tableRef : MutableRefObject<any> = useRef();
    const data : MutableRefObject<any> = useRef();

    useEffect( () => {
        data.current = searchData;
        if( null != datatable.current ) {
            datatable.current.ajax.reload();
        }
    },[searchData]);

    useEffect( () => {
        let options : any = Global.getDatatableCommonOption();
        options.order = [[1, 'desc']];
        options.ajax = {
            url : "/user/data-item/list.json"
            ,method : "post"
            ,data : function(d:any) {
                d = Object.assign(d, data.current);
            }
            ,error : function(xhr:XMLHttpRequest) {
                errorHandlerAjax(xhr);
            }
        };
        options.columns = [
            { width: "120px",   name : "name",                 data:"name",               title : "이름",               className : "dt-head-center dt-body-left" },
            { width: "100px",   name : "service_id",           data:"serviceId",          title : "서비스ID",           className : "dt-head-center dt-body-left" },
            { width: "150px",   name : "institution_name",     data:"institutionName",    title : "제공기관",           className : "dt-head-center dt-body-left" },
            { width: "200px",   name : "external_url",         data:"externalUrl",        title : "외부 URL",           className : "dt-head-center dt-body-left" },
            { width: "200px",   name : "rest_ip",              data:"restIp",             title : "REST IP",           className : "dt-head-center dt-body-left" },
            { width: "100px",   name : "rest_port",            data:"restPort",           title : "REST PORT",         className : "dt-head-center dt-body-left" },
            {
                "width": "120px",
                "render":
                    function (data:any, type:any, row:any) {
                        let html = "";
                        html += "<button type='button' class='btn btn-sm btn-outline-primary detail' data-toggle='tooltip' title='상세보기'><i class='material-icons'>pageview</i></button>&nbsp;";
                        html += "<button type='button' class='btn btn-sm btn-outline-primary modify' data-toggle='tooltip' title='수정'><i class='material-icons'>create</i></button>&nbsp;";
                        html += "<button type='button' class='btn btn-sm btn-outline-primary delete' data-toggle='tooltip' title='삭제'><i class='material-icons'>delete</i></button>&nbsp;";
                        return html;
                    }, "title": "기능", "className": "dt-head-center dt-body-center", "orderable": false,
            }
        ];

        options.columnDefs = [{
                "targets": '_all',
                "defaultContent": ""
            }
        ];

        options.createdRow = function (row:any, data:any, index:any) {
            let buttonResultDetail = row.getElementsByClassName('detail');
            buttonResultDetail[0].addEventListener("click", () => {
                onClickDetail(data);
            });

            let buttonResultModify = row.getElementsByClassName('modify');
            buttonResultModify[0].addEventListener("click", () => {
                onClickModify(data);
            });

            let buttonResultDelete = row.getElementsByClassName('delete');
            buttonResultDelete[0].addEventListener("click", () => {
                onClickDelete(data);
            });
        };


        const $dt: JQuery &  {DataTable?: any} = $(tableRef.current);
        datatable.current = $dt.DataTable(options);
    }, []);

    return (
        <table
            ref={tableRef}
            className="table table-bordered table-striped"
            style={{width: '100%',tableLayout:'fixed'}}>
        </table>
    );
}

export default DatatableDataItem;