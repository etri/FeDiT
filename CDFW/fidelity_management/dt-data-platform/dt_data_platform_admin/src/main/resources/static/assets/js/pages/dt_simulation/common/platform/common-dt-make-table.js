'use strict'
function makeSimulationModelListTable(data, position_id, datatable_id) {
    var strHTML = '';

    strHTML += '		<table class="table" id="' + datatable_id + '">';
    strHTML += `<colgroup>
                                <col style="width: auto;">
                                <col style="width: 30%;">
                                <col style="width: 30%;">
                                <col style="width: auto;">
                                <col style="width: auto;">
                                <col style="width: auto;">
                                <col style="width: auto;">
                            </colgroup>`;
    strHTML += '			<thead>';
    strHTML += '				<tr>';
    strHTML += '        			<th>순번</th>';
    strHTML += '        			<th>모델명</th>';
    strHTML += '        			<th>모델설명</th>';
    strHTML += '        			<th>작업유형</th>';
    strHTML += '        			<th>작성자</th>';
    strHTML += '        			<th>등록일</th>';
    strHTML += '				</tr>';
    strHTML += '			</thead>';
    strHTML += '			<tbody class="table-text-nowrap">';

    $.each(data, function (index, item) {
        strHTML += '			   <tr>';
        strHTML += '					<td>' + (index + 1) + '</td>';
        strHTML += '					<td class="wrap">'
        strHTML += '                        <a href="#none" class="btn-select-simulation-model" data-model-seq="' + item.model_seq + '" data-model-nm="' + item.model_nm + '">' + item.model_nm;
        strHTML += '					</a>';
        strHTML += '					</td>'
        strHTML += '					<td class="wrap">' + (item.model_derpn != null ? item.model_derpn : '') + '</td>';
        strHTML += '					<td>' + item.status_nm + '</td>';
        strHTML += '					<td>' + item.user_id + '</td>';
        strHTML += '					<td>' + item.reg_dt_str + '</td>';
        strHTML += '			   </tr>';
    });

    strHTML += '			</tbody>';
    strHTML += '		</table>';

    $('#' + position_id).html(strHTML);
    return strHTML;
}