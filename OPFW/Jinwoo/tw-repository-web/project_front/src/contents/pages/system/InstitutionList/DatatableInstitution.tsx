import React, { MutableRefObject } from "react";
import Global from "@/modules/Global";

type props = {
  hasWritePermission:boolean;
  searchData:any;
  onClickDetail:(data:any)=>void;
  onClickModify:(data:any)=>void;
  onClickDelete:(data:any)=>void
}

const DatatableInstitution = ({hasWritePermission, searchData, onClickDetail, onClickModify, onClickDelete}: props) => {
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
        ajaxErrorHandler(xhr);
      }
    };
    options.columns = [
      { width: "150px",   name : "name",                 data:"name",                 title : "이름",               className : "dt-head-center dt-body-left" },
      { width: "150px",   name : "manager_user_name",    data:"managerUserName",      title : "관리자",             className : "dt-head-center dt-body-left" },
      { width: "150px",   name : "address",              data:"address",              title : "주소",               className : "dt-head-center dt-body-left" },
      { width: "100px",   name : "address_detail",       data:"addressDetail",        title : "상세주소",            className : "dt-head-center dt-body-left" },
      { width: "150px",   name : "phone_number",         data:"phoneNumber",          title : "전화번호",            className : "dt-head-center dt-body-left" },
      {
        "width": "150px",
        "render":
          function (data:any, type:any, row:any) {
            let html = "";
            html += "<button type='button' class='btn btn-sm btn-outline-primary detail' data-toggle='tooltip' title='상세보기'><i class='material-icons'>pageview</i></button>&nbsp;";
            if(hasWritePermission) {
              html += "<button type='button' class='btn btn-sm btn-outline-primary modify' data-toggle='tooltip' title='수정'><i class='material-icons'>create</i></button>&nbsp;";
              html += "<button type='button' class='btn btn-sm btn-outline-primary delete' data-toggle='tooltip' title='삭제'><i class='material-icons'>delete</i></button>&nbsp;";
            }
            return html;
          }, "title": "기능", "className": "dt-head-center dt-body-center", "orderable": false,
      }
    ];

    options.columnDefs = [{
      "targets": '_all',
      "defaultContent": ""
    }];

    options.createdRow = function (row:any, data:any, index:any) {
      let buttonResultDetail = row.getElementsByClassName('detail');
      buttonResultDetail[0].addEventListener("click", () => {
        onClickDetail(data);
      });

      if(hasWritePermission) {
        let buttonResultModify = row.getElementsByClassName('modify');
        buttonResultModify[0].addEventListener("click", () => {
          onClickModify(data);
        });

        let buttonResultDelete = row.getElementsByClassName('delete');
        buttonResultDelete[0].addEventListener("click", () => {
          onClickDelete(data);
        });
      }
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

DatatableInstitution.defaultProps = {};

export default DatatableInstitution;