"use strict";

import React, { MutableRefObject, useEffect, useRef } from "react";
import Global from "@/modules/Global";
import { errorHandlerAjax } from "@/utils/ajaxUtil";

type props = {
  searchData:any;
  onClickModify:(data:any)=>void;
  onClickDelete:(data:any)=>void;
}

const DatatableDataCategory = ({searchData, onClickModify, onClickDelete}: props) => {
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
    options.order = [[0, 'desc']];
    options.ajax = {
      url : "/system/data-category/list.json"
      ,method : "post"
      ,data : function(d:any) {
        d = Object.assign(d, data.current);
      }
      ,error : function(xhr:XMLHttpRequest) {
        errorHandlerAjax(xhr);
      }
    };
    options.columns = [
      { width: "150px",   name : "category",             data:"category",             title : "분류",              className : "dt-head-center dt-body-left" },
      { width: "150px",   name : "name",                 data:"name",                 title : "이름",               className : "dt-head-center dt-body-left" },
      { width: "150px",   name : "icon_file_name",       data:"iconFileName",         title : "아이콘",             className : "dt-head-center dt-body-left" },
      { width: "250px",   name : "description",          data:"description",          title : "설명",              className : "dt-head-center dt-body-left" },
      {
        "width": "150px",
        "render":
          function (data:any, type:any, row:any) {
            let html = "";
            html += "<button type='button' class='btn btn-sm btn-outline-primary modify' data-toggle='tooltip' title='수정'><i class='material-icons'>create</i></button>&nbsp;";
            html += "<button type='button' class='btn btn-sm btn-outline-primary delete' data-toggle='tooltip' title='삭제'><i class='material-icons'>delete</i></button>&nbsp;";
            return html;
          }, "title": "기능", "className": "dt-head-center dt-body-center", "orderable": false,
      }
    ];

    options.columnDefs = [{
      "targets": '_all',
      "defaultContent": ""
    }];

    options.createdRow = function (row:any, data:any, index:any) {
      // let buttonResultDetail = row.getElementsByClassName('detail');
      // buttonResultDetail[0].addEventListener("click", () => {
      //   onClickDetail(data);
      // });
      //

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
};

DatatableDataCategory.defaultProps = {};

export default DatatableDataCategory;