'use strict';

import React from 'react';

import Global from "../../../modules/Global";
import DatatableRawData from "../RawData/DatatableRawData";

function DatatableCollectorMonitoring({hasWritePermission, searchData}) {
    const datatable = React.useRef();
    const tableRef = React.useRef();
    const data = React.useRef();

    React.useEffect( () => {
        data.current = searchData;
        if( null != datatable.current ) {
            datatable.current.ajax.reload();
        }
    },[searchData]);

    React.useEffect( () => {
        let options = Global.getDatatableCommonOption();
        options.order = [[1, 'desc']];
        options.ajax = {
            url : "/system/collector/list.json"
            ,method : "post"
            ,data : function(d) {
                d = Object.assign(d, data.current);
            }
            ,error : function(xhr, status, err) {
                ajaxErrorHandler(xhr);
            }
        };
        options.columns = [
            { width: "80px", name : "id",                title : "id",                data:"id",               className : "dt-head-center dt-body-left" },
            { width: "80px", name : "dtype",             title : "dtype",             data:"dtype",            className : "dt-head-center dt-body-left" },
            { width: "80px", name : "name",              title : "name",              data:"name",             className : "dt-head-center dt-body-left" },
            { width: "80px", name : "label",             title : "label",             data:"label",             className : "dt-head-center dt-body-left" },
            { width: "80px", name : "use_metric_memory", title : "use_metric_memory", data:"useMetricMemory",  className : "dt-head-center dt-body-left" },
            { width: "80px", name : "cron_pattern",      title : "cron_pattern",      data:"cronPattern",      className : "dt-head-center dt-body-left" },
            { width: "80px", name : "api_url",           title : "api_url",           data:"apiUrl",           className : "dt-head-center dt-body-left" }
        ];


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

export default DatatableCollectorMonitoring;