<%@ page contentType="text/html; charset=utf-8" pageEncoding="utf-8"%>
<%@include file ="/WEB-INF/jsp/layout/header.jsp" %>

<!-- JS 기능 시작 -->
<script>
	var frmMode="";

	$(document).ready(function() {
		
		bindEvent();//이벤트 바인딩
		
		fn_getUserList();
		
	});

	
	
	/* 이벤트 등록 */
	function bindEvent(){
		
		$(".is-src-enter-key").keydown(function(key) {
	         if (key.keyCode == 13) {
	        	 fn_getUserList();
	         }
	    });
		
		$("#searchUserBtn").on('click',function(e){
			fn_getUserList();
		});
		
		
		$("#usrSubBtn").on('click',function(e){
			doAddEditUser();
		});
		
		$("#idCheckBtn").on('click',function(e){
			var id = $("#frmUserId").val();
			if(id==""){
				alert('ID를 입력해주세요.');
				$("#frmUserId").focus();
				return ;
			}
			$.ajax({
			    url:"<c:url value='/udt/user/doUserIdCheck.do'/>",
			    data: JSON.stringify({userId:id}),
				dataType:'json',
				processData:false,
				contentType:"application/json",
			    type:'POST',
			    success: function(data){
			    	if(data.result=="1"){
			    		alert('입력하신 ID는  이미 존재합니다. 다시 입력해주세요.');
			    		$("#frmUserId").focus();
			    		return;
			    	}else{
			    		alert('입력하신 ID는 사용 가능합니다.');
			    		toggleIdCheckBtn(false);
			    	}
			    }
			});
			
		});
		
		$("#reNameId").on('click',function(e){
			toggleIdCheckBtn(true);
		});
		
		userModalEvent();
		
		
	}
	
	function doValidation(){
		
		if($("#frmUserId").val()==''){
			alert('ID를 입력해주세요.');
			$("#frmUserId").focus();
    		return false;
		}
		
		if($("#frmUserName").val()==''){
			alert('이름을 입력해주세요.');
			$("#frmUserName").focus();
			return false;
		}
		
		if($("#userPassword").val()==''){
			alert('비밀번호를 입력해주세요.');
			$("#userPassword").focus();
			return false;
		}
		return true;
		
	}
	
	function doAddEditUser(){
		
		var flag = doValidation();
		
		var ajaxUrl = '';
		var completedMsg = '';
		if(flag){
			if(frmMode=='add'){
				if($("#idCheckInput").val()!='ok'){
					alert('ID 중복체크를 진행해주세요.');
					$("#frmUserId").focus();
		    		return;
				}
				ajaxUrl = "<c:url value='/udt/user/insertUdtWebUser.do'/>";
				completedMsg="사용자가 등록되었습니다.";
			}else{
				ajaxUrl = "<c:url value='/udt/user/updateUdtWebUser.do'/>";
				completedMsg="사용자 정보가 수정되었습니다.";
			}
			
			var paramObj = $("#userAddForm").serializeObject();
			
			paramObj.userId = paramObj.frmUserId;
			paramObj.userName = paramObj.frmUserName;
			paramObj.userRole = paramObj.frmUserRole;
			paramObj.userEmail = paramObj.userEmail1+'@'+paramObj.userEmail2;
			if(paramObj.userRole=="ADMIN")paramObj.userAuthority ="ROLE_ADMIN";
			else paramObj.userAuthority ="ROLE_USER";
			
			$.ajax({
			    url:ajaxUrl,
			    data: JSON.stringify(paramObj),
				dataType:'text',
				processData:false,
				contentType:"application/json",
			    type:'POST',
			    success: function(data){
			    	console.log(data);
			    	if(data.result!='1'){
			    		alert(completedMsg);
			    		fn_getUserList();
			    		userModalClose();
			    	}else{
			    		alert('오류가 발생하였습니다. 관리자에게 문의해주세요.');
			    		return;
			    	}
			    },error:function(e,a,d){
			    	alert('오류가 발생하였습니다. 관리자에게 문의해주세요.');
		    		return;
			    }
			});
		}
		
	}
	function toggleIdCheckBtn(flag){
		
		if(flag){//다시입력
			$("#frmUserId").attr("readonly",false);
			$("#idCheckInput").val("none");
    		$("#idCheckBtn").show();
    		$("#reNameId").hide();
		}else{//중복확인
			$("#frmUserId").attr("readonly",true);
    		$("#idCheckInput").val("ok");
    		$("#idCheckBtn").hide();
    		$("#reNameId").show();
		}
	}
	
	function userModalEvent(){
		$('#usrMdalCancle').on('click',function(e){
			userModalClose();
		});
		
		$('#addUserBtn').on('click',function(e){
			userModalOpen('add');
		});
		
		$("body").on("click", function(event) { 
	        if(event.target.className == 'modal-close-btn' || event.target.className == 'popup-wrap2'){
	        	userModalClose();
	        }
	    });
		
		$(document).keydown(function(event) {
		    if ( event.keyCode == 27 || event.which == 27 ) {
		    	userModalClose();
		    }
		});
	}
	
	function userModalClose(){
		userModalClear();
        $("#userAddModal").fadeOut(); 
	};

	function userModalOpen(mode){
		
		
		frmMode=mode;
		
		if(mode=='add'){
			userModalClear();
			$("#usrSubBtn").text('등록');
			$("#userAddModalHeader").text('사용자 등록');
			toggleIdCheckBtn(true);
			
		}else if(mode=='edit'){
			$("#usrSubBtn").text('수정');
			$("#userAddModalHeader").text('사용자 수정');
			toggleIdCheckBtn(false);
			$("#reNameId").hide();
		}else{
			alert('오류가 발생하였습니다. 관리자에게 문의해주세요.');
			return;
		}
		
		$("#userAddModal").css('display','flex').hide().fadeIn();
	}
	
	function userModalClear(){
		$('#userAddForm')[0].reset();
	}
	
	
	function makeUserListParam(pageNo){
		var returnParamObj = $("#srcUserFrm").serializeObject();
		returnParamObj.pageIndex=pageNo;
		return returnParamObj;
	}
	
	function fn_getUserList(pageNo){
		 	if(!pageNo)pageNo=1;
			var params = makeUserListParam(pageNo);
			
			$('#isUserTable').loading('start');
			$.ajax({
			    url:"<c:url value='/udt/user/selectUdtWebUserList.do'/>",
			    data: JSON.stringify(params),
				dataType:'text',
				processData:false,
				contentType:"application/json",
			    type:'POST',
			    success: function(data){
			    	$("#isUserTable").html(data);
			    	setTimeout(function(){
			    		$('#isUserTable').loading('stop');
			    	},100);
			    }
			});
	
	}
	
	
	function getUserDetailPop(_userId){
		$.ajax({
		    url:"<c:url value='/udt/user/selectOneUdtWebUser.do'/>",
		    data: JSON.stringify({userId:_userId}),
			dataType:'json',
			processData:false,
			contentType:"application/json",
		    type:'POST',
		    success: function(data){
		    	var row = data.result;
		    	$("#frmUserId").val(row.userId);
		    	$("#frmUserName").val(row.userName);
		    	$("#userPassword").val(row.userPassword);
		    	$("#userPhoneNumber").val(row.userPhoneNumber);
		    	var email = row.userEmail.split('@');
		    	$("#userEmail1").val(email[0]);
		    	$("#userEmail2").val(email[1]);
		    	$("#userEnabled").val(row.userEnabled).trigger('change');
		    	$("#frmUserRole").val(row.userRole).trigger('change');
		    	userModalOpen('edit');
		    },error:function(e,a,d){
		    	alert('오류가 발생하였습니다. 관리자에게 문의해주세요.');
	    		return;
		    }
		});
		//ajax success에서
		
		
	}
</script>
<!-- JS 기능 끝 -->

<!-- 본문 시작 -->
<div class="wrapper wrapper-content  animated fadeInRight">
   <div class="row" style="justify-content: center;">
       <div class="col-sm-10">
           <div class="ibox">
           	   <div class="ibox-title">
                    <h3>사용자 목록</h3>
                    <div class="ibox-tools">
                        <a class="collapse-link">
                            <i class="fa fa-chevron-up"></i>
                        </a>
                    </div>
                </div>
               <div class="ibox-content">                   
                   <form id="srcUserFrm">
                        <div class="row search-box-row" style="background-color: #f1f1f1;margin: -15px -1.5% 0px -1.5%;padding: 5px 0px;">
		                    <div class="col-sm-2">
		                        <div class="form-group">
		                            <label class="col-form-label" for="userId">
		                            <i class="fa fa-search"></i>사용자 아이디</label>
		                            <input type="text" id="userId" name="userId" value="" placeholder="사용자 아이디를 입력하세요." class="is-src-enter-key job-srch-input form-control">
		                        </div>
		                    </div>
		                    <div class="col-sm-2">
		                        <div class="form-group">
		                            <label class="col-form-label" for="userName">
		                            <i class="fa fa-search"></i>사용자이름</label>
		                            <input type="text" id="userName" name="userName" value="" placeholder="사용자 이름을 입력하세요." class="is-src-enter-key job-srch-input form-control">
		                        </div>
		                    </div>
		                     <div class="col-sm-2">
		                        <div class="form-group">
		                            <label class="col-form-label" for="userRole">
		                            <i class="fa fa-search"></i>사용자권한</label>
		                            <select name="userRole" id="userRole" class="form-control">
		                            	<option value="" disabled="" selected="">사용자 권한을 선택하세요.</option>
		                            	<option value="">전체</option>
		                                <option value="ADMIN">관리자</option>
		                                <option value="USER">일반사용자</option>
		                            </select>
		                        </div>
		                    </div>
		                    <div class="col-sm-1">
		                        <button style="width:80%; margin-left:-20%;" class="btn btn-sm btn-primary search-btn" id="searchUserBtn" type="button"><i class="fa fa-search"></i>Search</button>
		                    </div>
		                    <div class="search-fa-tool-grp">
		                    		<i class="fa fa-eraser isToolTip refesh-srhfrm-btn" for="srcUserFrm" title="" data-original-title="입력칸을 모두 리셋합니다."></i>
		                    </div>
                	  </div>
                   </form>
                   <div class="clients-list">
	                   <div class="tab-content">
	                       <div id="tab-1" class="tab-pane active show" style="height: 470px;">
	                           <div class="slimScrollDiv" style="position: relative; overflow: hidden; width: auto; height: 100%;">
	                           	<div class="full-height-scroll" style="overflow: hidden; width: auto; height: 100%;">
	                           		 <div class="row add-user-row">
									   <button type="button" id="addUserBtn" class="btn btn-block btn-outline btn-primary">사용자 추가<i class="fa fa-plus-circle"></i></button>
								    </div>
	                               <div class="table-responsive" id="isUserTable">
	                               </div>
	                           </div><div class="slimScrollBar" style="background: rgb(0, 0, 0); width: 7px; position: absolute; top: 0px; opacity: 0.4; display: none; border-radius: 7px; z-index: 99; right: 1px; height: 366.599px;"></div><div class="slimScrollRail" style="width: 7px; height: 100%; position: absolute; top: 0px; display: none; border-radius: 7px; background: rgb(51, 51, 51); opacity: 0.2; z-index: 90; right: 1px;"></div></div>
	                       </div>
	                   </div>
                   </div>
               </div>
           </div>
       </div>
    </div>
</div>



<!-- 사용자 추가 모달 -->
<div class="popup-wrap2" id="userAddModal"> 
	    <div class="popup2">	
	      <div class="popup-head2">
	      	 <h3><span class="head-title2" id=userAddModalHeader>사용자 등록</span></h3>
	      </div>
	      <div class="popup-body2">	
	        <div class="body-content2">
	          <div class="body-contentbox2">
	          	<input type="hidden" id="idCheckInput" value="none"/>
	          	<form id="userAddForm">
                                <div class="form-group  row"><label class="col-sm-2 col-form-label">사용자 ID</label>
                                    <div class="col-sm-7"><input type="text" required id="frmUserId" name="frmUserId" value="" placeholder="아이디를 입력하세요." class="form-control"></div>
                                    <div class="col-sm-2" style="margin-left: -20px;line-height: 30px;">
                                    	<span class="btn btn-primary btn-sm" id="idCheckBtn">중복체크</span>
                                    	<span class="btn btn-default btn-sm" id="reNameId">재입력</span>
                                    </div>
                                </div>
                                <div class="hr-line-dashed"></div> 
                                <div class="form-group row"><label class="col-sm-2 col-form-label">사용자 이름</label>
                                <!-- <br/><small class="text-navy">Normal Bootstrap elements</small> -->
                                    <div class="col-sm-9"><input type="text" required placeholder="이름을 입력하세요." id="frmUserName" name="frmUserName" value="" class="form-control"> 
                                    </div>
                                </div>
                                <div class="hr-line-dashed"></div> 
                                <div class="form-group row"><label class="col-sm-2 col-form-label">비밀번호</label>

                                    <div class="col-sm-9"><input type="password"  required id="userPassword" name="userPassword"  value="" class="form-control" name="password"></div>
                                </div>
                                <div class="hr-line-dashed"></div>
                                <div class="form-group row" style="margin-bottom: -15px;"><label class="col-sm-2 col-form-label">이메일</label>

                                    <div class="col-sm-9">
							           <div class="input-group m-b">
							           	<input type="text" placeholder="이메일을 입력하세요." id="userEmail1" name="userEmail1" value="" class="form-control">
							               <div class="input-group-prepend">
							                   <span style="height: 100%;margin-top: 0px;"class="input-group-addon">@</span>
							               </div>
							               <input type="text" placeholder="" id="userEmail2" name="userEmail2" value="" class="form-control">
							           </div>
							       </div>
                                </div> 
                                <div class="hr-line-dashed"></div>
                                <div class="form-group row"><label class="col-lg-2 col-form-label">전화번호</label>

                                    <div class="col-lg-9">
                                    	<input type="text" placeholder="전화번호를 입력하세요."  id="userPhoneNumber" name="userPhoneNumber" value=""  class="form-control"></div>
                                </div>
                                <div class="hr-line-dashed"></div>
                                <div class="form-group row" style="margin-bottom: -15px;">
                                	<label class="col-lg-2 col-form-label">사용자 권한</label>
                                    <div class="col-sm-3">
					               		<select class="form-control m-b" id="frmUserRole" name="frmUserRole"  style="height:auto"  name="dcatTheme" id="dcatTheme">
					                          <option value="USER">일반사용자</option>
					                          <option value="ADMIN">관리자</option> 
					                     	</select>
						       		</div>
						       		<label class="col-sm-2 col-form-label">사용여부</label>

                                    <div class="col-sm-3" style="margin-left: -20px;">
					               		<select class="form-control m-b"  id="userEnabled" name="userEnabled" style="height:auto" name="dcatTheme" id="dcatTheme">
					                          <option value="1">사용</option>
					                          <option value="0">사용중지</option>
					                     </select> 
						       		</div>
                                </div>
                                <div class="hr-line-dashed"></div>
                            </form>
	          </div>
	        </div>
	      </div>
	      <div class="popup-foot2"> 
	          <div class="col-sm-4 col-sm-offset-2 usr-modal-btn-grp">
	          	<button class="btn btn-primary btn-sm" id="usrSubBtn" type="submit">등록</button>
                  <button class="btn btn-white btn-sm modal-close-btn" id="usrMdalCancle" type="">취소</button>
              </div>
	      </div>
	    </div>
</div>
<!-- 본문 끝-->

<%@include file ="/WEB-INF/jsp/layout/footer.jsp" %>