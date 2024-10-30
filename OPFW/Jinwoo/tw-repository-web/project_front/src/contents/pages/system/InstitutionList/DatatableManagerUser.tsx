import React, { MutableRefObject } from "react";
import Global from "@/modules/Global";

type props = {
  searchData:any;
  onClickAssignManager:(data:any)=>void;
}

const DatatableManagerUser = ({searchData, onClickAssignManager}: props) => {
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
      url : "/system/user/list-with-role.json"
      ,method : "post"
      ,data : function(d:any) {
        d = Object.assign(d, data.current);
        d.roleAuthList = ["ROLE_MEMBER"];
      }
      ,error : function(xhr:XMLHttpRequest) {
        ajaxErrorHandler(xhr);
      }
    };
    options.columns = [
      { width: "120px",   name : "user_login_id",        data:"userLoginId",          title : "로그인ID",           className : "dt-head-center dt-body-left" },
      { width: "120px",   name : "user_nm",              data:"userNm",               title : "이름",             className : "dt-head-center dt-body-left" },
      { width: "180px",   name : "email",                data:"email",                title : "이메일",             className : "dt-head-center dt-body-left" },
      { width: "180px",   name : "mobile",               data:"mobile",               title : "전화번호",            className : "dt-head-center dt-body-left" },
      {
        "width": "100px",
        "render":
          function (data:any, type:any, row:any) {
            let html = "";
            html += "<button type='button' class='btn btn-sm btn-outline-primary assignment' data-toggle='tooltip' title='관리자설정'><i class='material-icons'>assignment_turned_in</i></button>&nbsp;";
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
          onClickAssignManager(data);
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

DatatableManagerUser.defaultProps = {};

export default DatatableManagerUser;