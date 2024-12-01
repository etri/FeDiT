
var upFileList = new Map();
var fileBaseUrl = "/fileUtil/";
var fileUpUrl = fileBaseUrl + "fileUploade.json";
var fileDownUrl = fileBaseUrl + "fileDownload.json";
var fileCheckUrl = fileBaseUrl + "fileCheck.json";

/**
 * 파일 업로드 함수 
 * @param inputId  	: html input='file' 파일 업로드 input id명 
 * @param fileType	: 업로드파일 형식 -> image(이미지파일), docu(문서파일), '', null(모든파일)
 * @param upType	: 업로파일 종류 (서버 저장위치 설정)  
 * @param callBack
 * @param maxSize
 * @param maxCount
 * @param frmValId
 * @param dispId
 * @param oldFiles
 */
function initFileUp(inputId, fileType, upType, callBack, maxSize, maxCount, frmValId, dispId, oldFiles) {
	if(inputId==null || inputId.trim()=="") {
		alert("파일업 초기화중..\n\r오류가 발생하여 정상적으로 동작하지 않을 수 있습니다.");
		return;
	}
	
	if($('#'+dispId).length) $('#'+dispId).empty();
	
	var flist = upFileList.get(inputId);	
	if(flist!=null && flist.length>1) {
		for(var i=0; i<flist.length; i++) fn_deleteFile(inputId, i+1, frmValId, "no");
	}
	upFileList.set(inputId, null);
	
	if(oldFiles!=null && oldFiles.trim()!="") {
		if(typeof callback != 'function') callBack = _comp_fileup;
		var old_flist = oldFiles.split('|');
		var d = new Map();
		for(var i=0; i<old_flist.length; i++) {
			var oldf = old_flist[i]; 
			if(oldf!=null && oldf.length>2) {
				var fi = oldf.split('?');
				if(fi.length > 2) {
					d.srcFileNm = fi[0];
					d.destFullNm = oldf;
					callBack(inputId, d, frmValId, dispId);
				}
			}
		} 
	}
		
	$("#"+inputId).fileupload({
		url : fileUpUrl,
		dataType: 'json',    
		formData: function (form) {
            var data = form.serializeArray();
            data.push({name:"inputId", value:inputId});
            data.push({name:"upType", value:upType});
            return data;
        },
		add : function (e, data) {
			var flist = upFileList.get(inputId);
			if(flist==null || flist==undefined) {
				upFileList.set(inputId, new Array());
				flist = upFileList.get(inputId);
				flist[0] = "";
			}
			var fcnt = 0;
			for(var i=0; i<flist.length; i++) if(flist[i].length>0) fcnt++;
			
			if(fcnt >= maxCount) {
				alert("최대 "+maxCount+"개의 파일을 업로드합니다.");
				return false;
			}
			if(maxSize>0 && maxSize<data.files[0].size) {
				var maxStr = "바이트";
				var maxS = maxCount;
				if(maxS > 1000) {maxS = maxS/1000; maxStr="Kb"}
				if(maxS > 1000) {maxS = maxS/1000; maxStr="Mb"}
				alert("파일 허용 최대용량이 "+maxS+maxStr+"입니다.");
				return false;
			}
			var fileExt = data.files[0].name.split('.').pop().toLowerCase();
			
			if(fileType == "image") {
				var allowdtypes = 'jpeg,jpg,png,gif';
				
				if(allowdtypes.indexOf(fileExt) < 0) {
					alert(allowdtypes + ' 이미지파일만 등록 가능합니다. ');
	                return false;
				}
			} else if(fileType == "docu") {
				var allowdtypes = 'doc,docx,xls,xlsx,ppt,pptx,hwp,pdf,txt,jpg,bmp,png,gif';
				
				if(allowdtypes.indexOf(fileExt) < 0) {
					alert(allowdtypes + '문서 파일만 등록 가능합니다. ');
	                return false;
				}
			}
			
			data.submit();
		},
		done: function (e, res) {
        	var data = res.result;
        	if ("success" == data.result) {
        		if(typeof callback != 'function') callBack = _comp_fileup;
        		callBack(inputId, data, frmValId, dispId);
			}else {
				alert(data.message);
			}
        },
        fail: function(e, data){
            alert('서버와 통신 중 문제가 발생했습니다');
        }
	});
}

function fileDown(finfo) {
	if(finfo==null || finfo==undefined) {
		alert("파일정보가 없습니다.");
		return;
	}
	$.ajax({
		url : fileCheckUrl,
		method : "POST",
		data : {finfo : finfo},
		dataType : "json",
		success : function(res) {
			if(res.result == "success") {
				location.href= fileDownUrl + "?finfo="+encodeURI(finfo);
			} else {
				alert(res.message);
			}
		},
        fail: function(e, data){
            alert('서버와 통신 중 문제가 발생했습니다');
        }
	});
}

function _comp_fileup(inputId, data, frmValId, dispId) {
	var flist = upFileList.get(inputId);
	if(flist==null || flist==undefined) {
		upFileList.set(inputId, new Array());
		flist = upFileList.get(inputId);
		flist[0] = "";
	}
	flist[flist.length] = data.destFullNm;
	
	if(frmValId!=null && frmValId.trim()!="") {
		var str = "";
		for(var i=0; i<flist.length; i++) {			
			if(flist[i]!=null && flist[i]!="") {
				if(str!="") str+="|";
				str += flist[i];			
			}
		}
		$("#"+frmValId).val(str);
	} 
	if(dispId!=null && dispId.trim()!="") {
		var html ="<div id='div"+inputId+flist.length+"'>" // class='fileUpload btn mt5'
		//+"<a href='/minpopup/download.json?finfo="+data.destFullNm+"' title='파일 다운로드'>"+data.srcFileNm+"</a>"
		+"<a href='javascript:void(0);' onClick='fileDown(\""+data.destFullNm+"\")' title='파일 다운로드'>"+data.srcFileNm+"</a>"
		+"<input type='button' class='btn btn-danger btn-sm' onclick='fn_deleteFile(\""+inputId+"\","+flist.length+",\""+frmValId+"\")' value='삭제' style='margin-left:10px;'>"
		+"</div>";
		
		$("#"+dispId).append(html);
	}
}

function fn_deleteFile(inputId, num, frmValId, isConfirm){
	if(isConfirm != "no") if(!confirm("선택한 파일을 삭제합니다?")) return; 
	var flist = upFileList.get(inputId);
	if(flist!=null) flist[num-1] = "";
	if(frmValId!=null && frmValId.trim()!="") {
		var str = "";
		
		for(var i=0; i<flist.length; i++) {
			if(str!="") str+=":";
			if(flist[i]!=null && flist[i]!="") str += flist[i];			
		}
		$("#"+frmValId).val(str);
	} 
	$("#div"+inputId+num).remove();
}
