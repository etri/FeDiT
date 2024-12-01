'use strict';

import React, { MutableRefObject } from "react";

import Global from "@/modules/Global";
import { errorHandlerAjax } from "@/utils/ajaxUtil";
import { getDateStringWithoutTimeFromString } from "@/utils/timeUtils";

type props = {
    searchData:any;
    onClickDetail:(data:any)=>void;
    onClickApprove:(data:any)=>void;
    onClickDeny:(data:any)=>void
}

const DatatableDataRegistRequest = ({searchData, onClickDetail, onClickApprove, onClickDeny} : props) => {
    const [sortDate, setSortDate] = React.useState<null|Date>(null);
    const datatable : MutableRefObject<any> = React.useRef();
    const tableRef : MutableRefObject<any> = React.useRef();
    const data : MutableRefObject<any> = React.useRef();

    React.useEffect( () => {
        data.current = searchData;
        if( null != datatable.current ) {
            datatable.current.ajax.reload();
        }
    },[searchData]);

    React.useEffect( () => {
        let options : any = Global.getDatatableCommonOption();
        options.order = [[1, 'desc']];
        options.ajax = {
            url : "/system/data-regist-request/list.json"
            ,method : "post"
            ,data : function(d:any) {
                d = Object.assign(d, data.current);
            }
            ,error : function(xhr:any, status:any, err:any) {
                errorHandlerAjax(xhr);
            }
        };
        options.columns = [
            { width: "120px",    name : "name",                 data:"name",                   title : "이름",          className : "dt-head-center dt-body-left" },
            {
                "width": "120px", name: "REG_DT",
                "render":
                  function (data:any, type:any, row:any) {
                      let html = "";
                      return getDateStringWithoutTimeFromString(row.regDt);
                  }, "title": "신청일", "className": "dt-head-center dt-body-center",
            },
            { width: "150px",   name : "institution_name",     data:"institutionName",        title : "제공기관",       className : "dt-head-center dt-body-left"},
            { width: "120px",   name : "",                     data:"managerName",            title : "담당자",         className : "dt-head-center dt-body-left" , "orderable": false},
            { width: "180px",   name : "",                     data:"managerPhoneNumber",     title : "담당자 연락처",   className : "dt-head-center dt-body-left" , "orderable": false},
            {
                "width": "80px",
                "render":
                    function (data:any, type:any, row:any) {
                        let html = "";
                        if(row.deprecatedTime!==undefined&&row.deprecatedTime!==null){
                            html+="사용중지";
                        } else if(row.approvalTime!==undefined&&row.aprrovalTime!==null){
                            html+="승인";
                        } else if(row.denialTime!==undefined&&row.denialTime!==null){
                            html+="거절";
                        } else {
                            html+="승인대기";
                        }
                        return html;
                    }, "title": "상태", "className": "dt-head-center dt-body-center", "orderable": false,
            },
            {
                "width": "160px",
                "render":
                    function (data:any, type:any, row:any) {
                        let canModify ='';
                        if(row.deprecatedTime!==undefined&&row.deprecatedTime!==null){
                            canModify = 'disabled';
                        } else if(row.approvalTime!==undefined&&row.aprrovalTime!==null){
                            canModify = 'disabled';
                        } else if(row.denialTime!==undefined&&row.denialTime!==null){
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

        options.createdRow = function (row:any, data:any, index:any) {
            let buttonResultDetail = row.getElementsByClassName('detail');
            buttonResultDetail[0].addEventListener("click", () => {
                onClickDetail(data);
            });

            let buttonResultModify = row.getElementsByClassName('approve');
            buttonResultModify[0].addEventListener("click", () => {
                onClickApprove(data);
            });

            let buttonResultDelete = row.getElementsByClassName('deny');
            buttonResultDelete[0].addEventListener("click", () => {
                onClickDeny(data);
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

export default DatatableDataRegistRequest;