"use strict";

import React from "react";
import Global from "@/modules/Global";
import { getDateStringWithoutTimeFromString } from "@/utils/timeUtils";

const DatatableDataUseRequest = ({searchData ,onClickDetail, onClickApprove, onClickDeny}
                                     :{searchData:any, onClickDetail: (data:any)=>any, onClickApprove:(itemId:number)=>void, onClickDeny:(itemId:number)=>void}) => {
    const [sortDate, setSortDate] = React.useState<null|Date>(null);
    const datatable = React.useRef();
    const tableRef = React.useRef();
    const data = React.useRef();

    const handleClickDetail = (data:any) => {
        onClickDetail(data);
    }

    const handleClickApprove = (data:any) => {
        onClickApprove(data);
    }

    const handleClickDeny = (data:any) => {
        onClickDeny(data);
    }

    React.useEffect( () => {
        data.current = searchData;
        if( null != datatable.current ) {
            datatable.current.ajax.reload();
        }
    },[searchData]);

    React.useEffect( () => {
        let options = Global.getDatatableCommonOption();
        options.order = [[2, 'desc']];
        options.ajax = {
            url : "/system/data-use-request/list.json"
            ,method : "post"
            ,data : function(d:any) {
                d = Object.assign(d, data.current);
            }
            ,error : function(xhr:any, status:any, err:any) {
                ajaxErrorHandler(xhr);
            }
        };
        options.columns = [
            // { width: "80px",    name : "id",                   title : "ID",               data:"id", className : "dt-head-center dt-body-left" },
            { width: "120px",  name : "name",                  title : "이름",               data:"name", className : "dt-head-center dt-body-left" },
            { width: "100px",  name : "user_name",              title : "신청자",             data:"userName", className : "dt-head-center dt-body-left", "orderable": false },
            {
                "width": "120px", name: "REG_DT",
                "render":
                    function (data, type, row) {
                        let html = "";
                        return getDateStringWithoutTimeFromString(row.regDt);
                    }, "title": "신청일", "className": "dt-head-center dt-body-center",
            },
            { width: "80px",   name : "category",              title : "분류",              data:"category", className : "dt-head-center dt-body-left" },
            { width: "80px",   name : "type",                  title : "타입",              data:"type", className : "dt-head-center dt-body-left" },
            { width: "80px",   name : "status",                title : "상태",              data:"status", className : "dt-head-center dt-body-left" },
            { width: "180px",  name : "expire_time",          title : "만료일",       data:"expireTime", className : "dt-head-center dt-body-left" },
            { width: "120px",   name : "current_call_count",   title : "현재호출횟수",  data:"currentCallCount", className : "dt-head-center dt-body-left" },
            { width: "120px",   name : "max_call_count",       title : "최대호출횟수",  data:"maxCallCount", className : "dt-head-center dt-body-left" },
            {
                "width": "160px",
                "render":
                    function (data, type, row) {
                        let canModify ='';
                        if(row.status!=='waiting'){
                            canModify = 'disabled';
                        }

                        let html = "";
                        html += "<button type='button' class='btn btn-sm btn-outline-primary detail' data-toggle='tooltip' title='상세보기'><i class='material-icons'>pageview</i></button>&nbsp;";
                        html += "<button type='button' class='btn btn-sm btn-outline-primary approve' title='승인'" + canModify + ">승인</button>&nbsp;";
                        html += "<button type='button' class='btn btn-sm btn-outline-primary deny' title='거절'" + canModify + ">거절</button>&nbsp;";
                        // html += "<button type='button' class='btn btn-sm btn-outline-primary delete' data-toggle='tooltip' title='삭제'><i class='material-icons'>delete</i></button>&nbsp;";
                        return html;
                    }, "title": "기능", "className": "dt-head-center dt-body-center", "orderable": false,
            }
        ];

        options.columnDefs = [{
            "targets": '_all',
            "defaultContent": ""
        }
        ];

        options.createdRow = function (row, data, index) {
            let buttonResultDetail = row.getElementsByClassName('detail');
            buttonResultDetail[0].addEventListener("click", () => {
                handleClickDetail(data);
            });

            let buttonResultModify = row.getElementsByClassName('approve');
            buttonResultModify[0].addEventListener("click", () => {
                handleClickApprove(data);
            });

            let buttonResultDelete = row.getElementsByClassName('deny');
            buttonResultDelete[0].addEventListener("click", () => {
                handleClickDeny(data);
            });
        };


        const $dt: JQuery &  {DataTable?: any} = $(tableRef.current);
        datatable.current = $dt.DataTable(options);

        // datatable.current.on( 'draw', function () {
        //     setSortDate(new Date());
        // } );
    }, []);

    return (
        <table
            ref={tableRef}
            className="table table-bordered table-striped"
            style={{width: '100%',tableLayout:'fixed'}}>
        </table>
    );
}

export default DatatableDataUseRequest;