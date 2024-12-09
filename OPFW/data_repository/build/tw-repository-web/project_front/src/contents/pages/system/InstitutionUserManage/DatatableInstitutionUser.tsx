import React, { MutableRefObject } from "react";
import Global from "@/modules/Global";

type props = {
  searchData:any;
  onClickModify:(data:any)=>void;
}

const DatatableInstitutionUser = ({searchData, onClickModify}: props) => {
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
      url : "/system/user/list-belong-institution.json"
      ,method : "post"
      ,data : function(d:any) {
        d = Object.assign(d, data.current);
      }
      ,error : function(xhr:XMLHttpRequest) {
        ajaxErrorHandler(xhr);
      }
    };
    options.columns = [
      { width: "150px",   name : "user_login_id",        data:"userLoginId",          title : "로그인ID",           className : "dt-head-center dt-body-left" },
      { width: "150px",   name : "user_nm",              data:"userNm",               title : "이름",               className : "dt-head-center dt-body-left" },
      { width: "150px",   name : "email",                data:"email",                title : "이메일",             className : "dt-head-center dt-body-left" },
      // { width: "150px",   name : "mobile",               data:"mobile",               title : "전화번호",            className : "dt-head-center dt-body-left" },
      {
        "width": "80px", name : "user_st", "title": "유저상태",
        "render":
          function (data:any, type:any, row:any) {
            if(row.userSt==="1"){
              return "사용중";
            } else if(row.userSt==="8"){
              return "사용중지";
            }
            return "탈퇴";
          }, "className": "dt-head-center dt-body-center",
      },
      {
        "width": "150px", "title": "기능",
        "render":
          function (data:any, type:any, row:any) {
            let html = "";
            // html += "<button type='button' class='btn btn-sm btn-outline-primary detail' data-toggle='tooltip' title='상세보기'><i class='material-icons'>pageview</i></button>&nbsp;";
            html += "<button type='button' class='btn btn-sm btn-outline-primary modify' data-toggle='tooltip' title='수정'><i class='material-icons'>create</i></button>&nbsp;";
            return html;
          }, "className": "dt-head-center dt-body-center", "orderable": false,
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

        let buttonResultModify = row.getElementsByClassName('modify');
        buttonResultModify[0].addEventListener("click", () => {
          onClickModify(data);
        });
      //
      //   let buttonResultDelete = row.getElementsByClassName('delete');
      //   buttonResultDelete[0].addEventListener("click", () => {
      //     handleClickDelete(data);
      //   });
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

DatatableInstitutionUser.defaultProps = {};

export default DatatableInstitutionUser;