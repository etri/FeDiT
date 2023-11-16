(function() {
    'use strict'
    $(document).ready(function() {
        
        $('.btn-insert-user').on('click', function() {
        	
        	var name = $('#username').val();
        	
        	var hp1 = $('#userHp1').val();
        	var hp2 = $('#userHp2').val();
        	var hp3 = $('#userHp3').val();
        	
        	var password = $('#password').val();
        	var password_confirm = $('#passwordConfirm').val();
        	var use_auth =  $('#userAuthCd').val();
        	
            if (name.length == 0) {
            	$('#username').focus();
                alert('이름을 입력하세요');
                return false;
            }
        	
            if (hp1.length == 0) {
            	$('#userHp1').focus();
                alert('휴대폰 첫번째 항목에 작성하세요');
                return false;
            }
            if (hp2.length == 0) {
            	$('#userHp2').focus();
                alert('휴대폰 두번째 항목에 작성하세요');
                return false;
            }
            if (hp3.length == 0) {
            	$('#userHp3').focus();
                alert('휴대폰 세번째 항목에 작성하세요');
                return false;
            }
            
            if (use_auth == 0) {
            	alert('권한을 선택하세요');
                return false;
            }
            
        	if (password.length > 0) {
        		
            	if (password_confirm == 0) {
            		$('#passwordConfirm').focus();
            		alert('비밀번호를 입력하세요.');	
                    return false;	
            	}
        		
        		if (password != password_confirm) {
        			$('#passwordConfirm').val('');
        			$('#passwordConfirm').focus();
        			alert('패스워드가 일치하지 않습니다.');	
                    return false;
        		}
        	}
            
            if (confirm('사용자를 등록 하시겠습니까?')) {
            	document.forms.editForm.submit();
            }       
            
        });
    	
        $('.btn-update-user').on('click', function() {
        	
        	var name = $('#username').val();
        	
        	var hp1 = $('#userHp1').val();
        	var hp2 = $('#userHp2').val();
        	var hp3 = $('#userHp3').val();
        	
        	var password = $('#tempPassword').val();
        	var password_confirm = $('#tempPasswordConfirm').val();
        	var use_auth =  $('#userAuthCd').val();
        	
            if (name.length == 0) {
            	$('#username').focus();
                alert('이름을 입력하세요');
                return false;
            }
        	
            if (hp1.length == 0) {
            	$('#userHp1').focus();
                alert('휴대폰 첫번째 항목에 작성하세요');
                return false;
            }
            if (hp2.length == 0) {
            	$('#userHp2').focus();
                alert('휴대폰 두번째 항목에 작성하세요');
                return false;
            }
            if (hp3.length == 0) {
            	$('#userHp3').focus();
                alert('휴대폰 세번째 항목에 작성하세요');
                return false;
            }
            
            if (use_auth == 0) {
            	alert('권한을 선택하세요');
                return false;
            }
            
            /*
        	if (password.length > 0) {
        		
            	if (password_confirm == 0) {
            		$('#tempPasswordConfirm').focus();
            		alert('비밀번호 재설정 확인을 입력하세요.');	
                    return false;	
            	}
        		
        		if (password != password_confirm) {
        			$('#tempPasswordConfirm').val('');
        			$('#tempPasswordConfirm').focus();
        			alert('패스워드가 일치하지 않습니다.');	
                    return false;
        		}
        	}
        	*/
            
            if (confirm('사용자를 수정 하시겠습니까?')) {
            	document.forms.editForm.submit();
            }       
            
        });

        
        $('.btn-delete-user').on('click', function() {
            commonSweetConfirm({
                text: '사용자를 삭제 하시겠습니까?'
            }, function() {
                document.forms.deleteForm.submit();
            });
        });
        
        
        
    });
})();