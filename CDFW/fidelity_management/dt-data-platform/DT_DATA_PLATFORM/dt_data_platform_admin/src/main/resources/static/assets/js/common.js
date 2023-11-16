'use strict'
$(document).ready(function() {

    initApplication();

    showAlert(result_code);

    // $('#execDaumAddr').on('click', execDaumPostcode);
    //

    $('.datepicker').datepicker({
        format: 'yyyy-mm-dd',
        todayHighlight: true,
        autoclose: true,
        language: 'kr'
    });
    
    $('.timepicker').datetimepicker({
		//format: 'LT'
		//language : 'kr',
		format:'YYYY-MM-DD HH:mm',		    	
    });
    
    $('.tags').tagsInput({
        'width': '100%',
        'height': '75%',
        'interactive': true,
        'defaultText': '태그추가',
        'removeWithBackspace': true,
        'minChars': 0,
        'maxChars': 20,
        'placeholderColor': '#666666'
    });

    $('.tags-artist').tagsInput({
        'width': '600px',
        'height': '55px',
        'interactive': false,
        'removeWithBackspace': true,
        'minChars': 0,
        'maxChars': 20,
        'placeholderColor': '#666666'
    });
    // $('body').on('focus', '.datepicker', function() {
    //     $(this).datepicker({
    //         format: 'yyyy-mm-dd',
    //         todayHighlight: true,
    //         autoclose: true,
    //         language: 'kr'
    //     });
    // });​

    $('#gridSortName').change(function() {
        $('#sortName').val($(this).val());
        var sortType = $('#gridSortType').val();
        if (sortType) {
            $('#sortType').val(sortType);
            $('.btn-search').click();
        }
    });

    $('#gridSortType').change(function() {
        $('#sortType').val($(this).val());
        var sortName = $('#gridSortName').val();
        if (sortName) {
            $('.btn-search').click();
        }
    });

    $('#gridPageSize').change(function() {
        $('#pagingPage').val(1);
        $('#pagingSize').val($(this).val());
        $('.btn-search').click();
    });

    var timeoutHandle = null;

    function startTimer(timeoutCount) {
        if (timeoutCount === 0) {
            var pathname = window.location.pathname;
            window.location.href = '/admin/logout';
        } else {
            $('#sessionTimer').html(msToTime(timeoutCount * 1000));
        }
        timeoutHandle = setTimeout(function() {
            startTimer(--timeoutCount);
        }, 1000);
    }

    function msToTime(s) {
        function pad(n, z) {
            z = z || 2;
            return ('00' + n).slice(-z);
        }
        var ms = s % 1000;
        s = (s - ms) / 1000;
        var secs = s % 60;
        s = (s - secs) / 60;
        var mins = s % 60;
        var hrs = (s - mins) / 60;
        if (hrs > 0) {
            return hrs + ':' + pad(mins) + ':' + pad(secs);
        } else {
            return pad(mins) + ':' + pad(secs);
        }
    }

    try {
        if (typeof session_max_inactive_interval !== 'undefined') {
            if (session_max_inactive_interval) {
                startTimer(session_max_inactive_interval);
            }
        }
    } catch (e) {
        console.error(e);
    }

    $(document).on('keyup', '.number_only', function() {
        $(this).val($(this).val().replace(/[^0-9]/g, ''));
    });

    $(document).on('keyup', '.double_only', function() {
        $(this).val($(this).val().replace(/[^-\.0-9]/g,''));
    });

    
    $(document).on('keyup', '.tel_only', function() {
        $(this).val($(this).val().replace(/[^0-9-]/g, ''));
    });

    $(document).on('keyup', '.alphabet_number_only', function() {
        $(this).val($(this).val().replace(/[^A-Za-z0-9]/g, ''));
    });

    $(document).on('keyup', '.alphabet_only', function() {
        $(this).val($(this).val().replace(/[^A-Za-z]/g, ''));
    });

    $(document).on('keyup', '.korean_only', function() {
        $(this).val($(this).val().replace(/[^ㄱ-힣]/g, ''));
    });

    $('.btn-session-extension').on('click', function() {
        $.post(contextPath + '/session/extention', function(result) {
            if (result !== null && result.result_code === 200) {
                clearTimeout(timeoutHandle);
                startTimer(result.session_time);
            }
        });
    });

    $(document).on('click', 'a[href="#"]', function(e) {
        // e.preventDefault();
        commonPreventDefault(e);
    });

});

//isEmpty 함수
if (typeof String.prototype.isEmpty !== 'function') {
    String.prototype.isEmpty = function() {
        return (this == null || this == undefined || this == '');
    };
}

String.prototype.ucwords = function() {
    str = this.trim();
    return str.replace(/(^([a-zA-Z\p{M}]))|([ -][a-zA-Z\p{M}])/g, function(s) {
        return s.toUpperCase();
    });
};

/**
 * 좌측문자열채우기
 * @params
 *  - padLen : 최대 채우고자 하는 길이
 *  - padStr : 채우고자하는 문자(char)
 */
String.prototype.lpad = function(padLen, padStr) {
    var str = this;
    if (padStr.length > padLen) {
        console.error('오류 : 채우고자 하는 문자열이 요청 길이보다 큽니다');
        return str + '';
    }
    while (str.length < padLen)
        str = padStr + str;
    str = str.length >= padLen ? str.substring(0, padLen) : str;
    return str;
};

/**
 * 우측문자열채우기
 * @params
 *  - padLen : 최대 채우고자 하는 길이
 *  - padStr : 채우고자하는 문자(char)
 */
String.prototype.rpad = function(padLen, padStr) {
    var str = this;
    if (padStr.length > padLen) {
        console.error('오류 : 채우고자 하는 문자열이 요청 길이보다 큽니다');
        return str + '';
    }
    while (str.length < padLen)
        str += padStr;
    str = str.length >= padLen ? str.substring(0, padLen) : str;
    return str;
};

function initApplication() {
    $.ajaxSetup({
        global: true,
        cache: false,
        type: 'POST',
        contentType: 'application/json',
        dataType: 'json'
    });

    var token = $("meta[name='_csrf']").attr('content');
    var header = $("meta[name='_csrf_header']").attr('content');

    $(document).ajaxSend(function(e, xhr, options) {
        var url = options.url;
        if (url.indexOf(contextPath) < 0) {
            url = contextPath + options.url;
        }
        options.url = url;
        xhr.setRequestHeader(header, token);
    });

    $.notifyDefaults({
        type: 'success',
        allow_dismiss: true,
        z_index: 2000,
        delay: 3000
    });

}

function ajaxSearch(url, data, callback, showLoading) {
    return ajaxPost(url, data, callback, showLoading);
}

function windowLocationHref(url){
	window.location.href = contextPath + url;
}

function ajaxPost(url, data, callback, showLoading) {
    // IE 기본값세팅
    showLoading = typeof showLoading !== 'undefined' ? showLoading : true;
    $.ajax({
        url: contextPath + url,
        data: JSON.stringify(data),
        success: function(result) {
            //console.log('result : ', result);
            if (callback) {
                callback(result);
            }
        },
        beforeSend: function() {
            if (showLoading) {
                $('.wrap-loading').removeClass('display-none');
            }
        },
        complete: function() {
            if (showLoading) {
                $('.wrap-loading').addClass('display-none');
            }
        },
        error: function(xhr, status, error) {
            console.error('error : ', error);
        }
    });
}

function commonPreventDefault(event) {
    event.preventDefault ? event.preventDefault() : (event.returnValue = false);
}

function checkedCheckbox(name) {
    var count = $('input:checkbox[name=' + name + ']:checked').length;
    return count > 0;
}

function commonSearchPaging(formName) {
    if (formName === null || formName === undefined) {
        formName = 'searchForm';
    }
    // 페이지 클릭
    $('.page-link').on('click', function(event) {
        commonPreventDefault(event);
        var searchForm = document.forms[formName];
        searchForm.page.value = $(this).data('page');
        searchForm.submit();
    });

    // 검색
    $('.btn-search').on('click', function(event) {
        commonPreventDefault(event);
        var searchForm = document.forms[formName];
        searchForm.page.value = 1;
        searchForm.submit();
    });
}

function commonSearchPaging2(formName) {
    if (formName === null || formName === undefined) {
        formName = 'searchForm';
    }
    // 페이지 클릭
    $('.page-link').on('click', function(event) {
        commonPreventDefault(event);
        var searchForm = document.forms[formName];
        
        var rangeValue = $(this).data('page-range');
        
        searchForm.page.value = $(this).data('page');
        searchForm.subPage.value = $(this).data('sub-page');
        searchForm.submit();
        
    });

    // 검색
    $('.btn-search').on('click', function(event) {
        commonPreventDefault(event);
        var searchForm = document.forms[formName];
        searchForm.page.value = 1;
        searchForm.submit();
    });
}

function execDaumPostcode() {
    new daum.Postcode({
        oncomplete: function(data) {
            var jibunAddress = data.jibunAddress !== '' ? data.jibunAddress : data.autoJibunAddress;
            var roadAddress = data.roadAddress;
            $('#place1').val(data.sido);
            $('#place2').val(data.sigungu);
            $('#place3').val(data.bname1 === '' ? data.bname : data.bname1);
            $('#addrRoad').val(roadAddress);
            $('#addrJibun').val(jibunAddress);
            $('#zipCode').val(data.zonecode);
            // console.log('data : ', data);
        }
    }).open();
}

/**
 * form 배열로 저장
 */
jQuery.fn.serializeObject = function() {
    var obj = null;
    try {
        if (this[0].tagName && this[0].tagName.toUpperCase() === 'FORM') {
            var arr = this.serializeArray();
            if (arr) {
                obj = {};
                jQuery.each(arr, function() {
                    obj[this.name] = this.value;
                });
            }
        }
    } catch (e) {
        alert(e.message);
    } finally {

    }
    return obj;
}

/**
 * TODAY
 * @params
 *  - format : YYYY-MM-DD
 */
String.prototype.yyyy_mm_dd = function() {
    var date = new Date();
    var d = date.getDate() < 10 ? '0' + date.getDate() : date.getDate();
    var m = (date.getMonth() + 1 > 9) ? (date.getMonth() + 1) : '0' + (date.getMonth() + 1);
    var y = date.getFullYear();
    var defaultDate = y + '-' + m + '-' + d;
    return defaultDate;
};

function datepickerFormat(str) {
    if (str === undefined || str === null || str === '' || str.length < 8) {
        return '';
    }
    var yyyy = str.substring(0, 4);
    var mm = str.substring(4, 6);
    var dd = str.substring(6, 8);
    return yyyy + '-' + mm + '-' + dd;
};

$.fn.radioSelect = function(val) {
    this.each(function() {
        var $this = $(this);
        if ($this.val() == val) {
            $this.attr('checked', true);
        }
    });
    return this;
};

/**
 * 숫자콤마
 * @param obj
 * @returns
 */
function inputNumberFormat(obj) {
    return obj.value = comma(uncomma(obj.value));
}
/**
 * 숫자만
 * @param obj
 * @returns
 */
function inputNumFormat(obj) {
    return obj.value = uncomma(obj.value);
}

function comma(str) {
    str = String(str);
    return str.replace(/(\d)(?=(?:\d{3})+(?!\d))/g, '$1,');
}

function uncomma(str) {
    str = String(str);
    return str.replace(/[^\d]+/g, '');
}

function timeFormate(stCnt, endCnt, optVal) {
    var optSetVal = '';
    var html = [];
    var value = '';
    if (optVal !== null || optVal === '') {
        if (endCnt <= 24) {
            optSetVal = optVal.substring(0, 2);
        } else {
            optSetVal = optVal.substring(3, 5);
        }
    } else {
        optSetVal = 'no';
    }

    for (var i = stCnt; i <= endCnt; i++) {
        if (i < 10) {
            value = '0' + i;
        } else {
            value = i;
        }
        if (optSetVal === value) {
            html[i] = '<option value="' + value + '" selected>' + value + '</option>';
        } else {
            html[i] = 'option value="' + value + '">' + value + '</option>';
        }
    }
    return html.join('');
}

function removeChar(obj) {
    obj.value = obj.value.replace(/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/g, '');
}

function getDataFeatherCalendar() {
    var strHTML = '';
    strHTML += '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-calendar">';
    strHTML += '    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>';
    strHTML += '    <line x1="16" y1="2" x2="16" y2="6"></line>';
    strHTML += '    <line x1="8" y1="2" x2="8" y2="6"></line>';
    strHTML += '    <line x1="3" y1="10" x2="21" y2="10"></line>';
    strHTML += '</svg>';
    return strHTML;
}

function getCheckedCount(name) {
    var checkedCount = 0;
    $('input[name="' + name + '"]').each(function(index, item) {
        if ($(this).is(':checked')) {
            checkedCount++;
        }
    });
    return checkedCount;
}

function getCheckedValue(name) {
    var values = [];
    $('input[name="' + name + '"]').each(function(index, item) {
        if ($(this).is(':checked')) {
            values.push($(this).val());
        }
    });
    return values;
}