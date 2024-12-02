/**
 * sms Excel 업로드
 */
var excelCnt = 0;
function smsExcelInit() {
	$('#fileupload').fileupload({
		add: function (e, data) {
			var fileType = data.files[0].name.split('.').pop(), allowdtypes = 'xls,XLS,xlsx,XLSX';
            if (allowdtypes.indexOf(fileType) < 0) {
                alert('엑셀파일만 등록 가능합니다. '+fileType);
                return false;
            }
            
            if(excelCnt == 0){
            	data.submit();
            }else if(excelCnt > 0 &&  confirm('기존 목록이 삭제됩니다! 진행하시겠습니까?')){
            	excelCnt = 0;
            	data.submit();
            }else{
        		return ;
        	}
            
            //data.submit();
        },
        dataType: 'json',
        done: function (e, res) {
        	var data = res.result;
        	if ("success" == data.result) {
        		var list = data.receiveList;
        		excelCnt ++;
        		reveiwList(list);
			}else {
				alert(data.result);
				alert(data.message);
			}
        }
    });
};