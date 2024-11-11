import React, { MutableRefObject } from "react";
import Global from "@/modules/Global";
import { errorHandlerAjax } from "@/utils/ajaxUtil";

type props = {
  searchData:any;
  onClickAssign:(data:any)=>void;
}

const DatatableDataItemInstitution = ({searchData, onClickAssign}: props) => {
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
    options.order = [[0, 'desc']];
    options.ajax = {
      url : "/system/institution/list.json"
      ,method : "post"
      ,data : function(d:any) {
        d = Object.assign(d, data.current);
      }
      ,error : function(xhr:XMLHttpRequest) {
        errorHandlerAjax(xhr);
      }
    };
    options.columns = [
      { width: "150px",   name : "name",                 data:"name",                 title : "이름",               className : "dt-head-center dt-body-left" },
      { width: "150px",   name : "address",              data:"address",              title : "주소",               className : "dt-head-center dt-body-left" },
      { width: "100px",   name : "address_detail",       data:"addressDetail",        title : "상세주소",            className : "dt-head-center dt-body-left" },
      { width: "150px",   name : "phone_number",         data:"phoneNumber",          title : "전화번호",            className : "dt-head-center dt-body-left" },
      {
        "width": "150px",
        "render":
          function (data:any, type:any, row:any) {
            let html = "";
            html += "<button type='button' class='btn btn-sm btn-outline-primary assignment' data-toggle='tooltip' title='설정'><i class='material-icons'>assignment_turned_in</i></button>&nbsp;";
            return html;
          }, "title": "기능", "className": "dt-head-center dt-body-center", "orderable": false,
      }
    ];

    options.columnDefs = [{
      "targets": '_all',
      "defaultContent": ""
    }];

    options.createdRow = function (row:any, data:any, index:any) {
      let buttonResultDetail = row.getElementsByClassName('assignment');
      buttonResultDetail[0].addEventListener("click", () => {
        onClickAssign(data);
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

DatatableDataItemInstitution.defaultProps = {};

export default DatatableDataItemInstitution;