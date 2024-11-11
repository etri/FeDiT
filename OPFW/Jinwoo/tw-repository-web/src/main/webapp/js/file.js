var shift = false; //기존파일 교체 여부
var fileUploadCnt = null; //파일 등록 가능수

var fileCnt = 0; //현재 파일수

function fileInit(allowdtypes) {
	if(allowdtypes == 'image') {
		$('#fileupload').fileupload({
			add: function (e, data) {
				var fileType = data.files[0].name.split('.').pop(), allowdtypes = 'JPG,jpeg,jpg,png,gif';
	            if (allowdtypes.indexOf(fileType) < 0) {
	                alert('이미지파일만 등록 가능합니다. '+fileType);
	                return false;
	            }
	            if(fileUploadCnt != null) {
	            	if(fileCnt >= fileUploadCnt) {
	            		alert("파일은 최대 "+fileUploadCnt+"개 등록 가능합니다.");
	            		return false;
	            	}
	            }
	            data.submit();
	        },
	        dataType: 'json',
	        done: function (e, res) {
	        	var data = res.result;
	        	if ("success" == data.result) {
	        		uploadSuccess(data);
				}else {
					alert(data.message);
				}
	        }
	    });
	}else if(allowdtypes == 'video') {
		$('#fileupload').fileupload({
			add: function (e, data) {
				var fileType = data.files[0].name.split('.').pop(), allowdtypes = 'mp4';
	            if (allowdtypes.indexOf(fileType) < 0) {
	                alert(fileType+' 형식은 지원하지 않습니다.' + ' mp4 동영상파일만 등록 가능합니다.');
	                return false;
	            }
	            if(fileUploadCnt != null) {
	            	if(fileCnt >= fileUploadCnt) {
	            		alert("파일은 최대 "+fileUploadCnt+"개 등록 가능합니다.");
	            		return false;
	            	}
	            }
	            data.submit();
	        },
	        dataType: 'json',
	        done: function (e, res) {
	        	var data = res.result;
	        	if ("success" == data.result) {
	        		uploadSuccess(data);
				}else {
					alert(data.message);
				}
	        }
	    });
	}else {
		$('#fileupload').fileupload({
			add: function (e, data) {
				if(fileUploadCnt != null) {
	            	if(fileCnt >= fileUploadCnt) {
	            		alert("파일은 최대 "+fileUploadCnt+"개 등록 가능합니다.");
	            		return false;
	            	}
	            }
	            data.submit();
	        },
	        dataType: 'json',
	        done: function (e, res) {
	        	var data = res.result;
	        	if ("success" == data.result) {
	        		uploadSuccess(data);
				}else {
					alert(data.message);
				}
	        }
	    });
	}
}

function uploadSuccess(data) {
	completeFileUpload(data.fileItem);
	fileCnt++;
}

function deleteFile(itemId) {
	if(confirm("삭제하시겠습니까?\n삭제 시 복구가 불가능합니다.")) {
		$.ajax({
			url : "/file/delete.json",
			type : "POST",
			data : {"itemId":itemId},
			dataType : "json",
			success : function(data) {
				if ("success" == data.result) {
					alert("삭제되었습니다.");
					selectFileList();
				}else {
					alert(data.message);
				}
			},error : function(request,status,error) {
				alert("code:"+request.status+"\nerror:"+error);
			}
		});
	}
}

