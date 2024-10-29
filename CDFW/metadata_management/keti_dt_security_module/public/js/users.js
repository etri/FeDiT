
let token = getCookie('chaut');

function deleteUser(){
    function func(cb){
        let checkbox = $("input[name=checkBox]:checked");
        checkbox.each(function(i){
        let tr = checkbox.parent().parent().eq(i);
        let td = tr.children();
        let userId = (td.eq(1).text()).trim();
        cb(userId);
        })
    }

    func(function(userId){
        let q ='';
        if($('#aType').val()=='true')
            q = '?aType=true';
        
        $.ajax({
            type : "DELETE",
            beforeSend : (xhr)=>{
                xhr.setRequestHeader("Authorization",'Basic '+ token);
            },
            url : '/security/users/'+userId+q,
            statusCode : {
                200 : function(){
                    alert('적용되었습니다.');
                    location.reload();
                },
                400 : function(){
                    alert('오류가 발생했습니다. 다시 시도해주세요.');
                    location.reload();
                },
                500 : function(){
                    alert('오류가 발생했습니다. 다시 시도해주세요.');
                    location.reload();
                }
            }
        });
    });
}

function detailInfo(){

}


// 쿠키 가져오기 함수
function getCookie(cName) {
    cName = cName + '=';
    var cookieData = document.cookie;
    var start = cookieData.indexOf(cName);
    var cValue = '';
    if(start != -1){
      start += cName.length;
      var end = cookieData.indexOf(';', start);
      if(end == -1)end = cookieData.length;
      cValue = cookieData.substring(start, end);
    }
    return cValue;
}