'use strict'
$(document).ready(function () {

    initApplication();

    showAlert(result_code);

    $('.datepicker').datepicker({
        format: 'yyyy-mm-dd',
        todayHighlight: true,
        autoclose: true,
        language: 'kr'
    });

    $('.timepicker').datetimepicker({
        //format: 'LT'
        //language : 'kr',
        format: 'YYYY-MM-DD HH:mm',
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

    $('#gridSortName').change(function () {
        $('#sortName').val($(this).val());
        var sortType = $('#gridSortType').val();
        if (sortType) {
            $('#sortType').val(sortType);
            $('.btn-search').click();
        }
    });

    $('#gridSortType').change(function () {
        $('#sortType').val($(this).val());
        var sortName = $('#gridSortName').val();
        if (sortName) {
            $('.btn-search').click();
        }
    });

    $('#gridPageSize').change(function () {
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
        timeoutHandle = setTimeout(function () {
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

    $(document).on('keyup', '.number_only', function () {
        $(this).val($(this).val().replace(/[^0-9]/g, ''));
    });

    $(document).on('keyup', '.double_only', function () {
        $(this).val($(this).val().replace(/[^-\.0-9]/g, ''));
    });


    $(document).on('keyup', '.tel_only', function () {
        $(this).val($(this).val().replace(/[^0-9-]/g, ''));
    });

    $(document).on('keyup', '.alphabet_number_only', function () {
        $(this).val($(this).val().replace(/[^A-Za-z0-9]/g, ''));
    });

    $(document).on('keyup', '.alphabet_only', function () {
        $(this).val($(this).val().replace(/[^A-Za-z]/g, ''));
    });

    $(document).on('keyup', '.korean_only', function () {
        $(this).val($(this).val().replace(/[^ㄱ-힣]/g, ''));
    });

    $('.btn-session-extension').on('click', function () {
        $.post(contextPath + '/session/extention', function (result) {
            if (result !== null && result.result_code === 200) {
                clearTimeout(timeoutHandle);
                startTimer(result.session_time);
            }
        });
    });

    $(document).on('click', 'a[href="#"]', function (e) {
        // e.preventDefault();
        commonPreventDefault(e);
    });

    /**
     * Filter Option List Auto Click And Response
     * */
    let optionLists = document.querySelectorAll('ul.option-list');
    optionLists.forEach(function (optionList) {
        let options = optionList.querySelectorAll('li > input + label')
        options.forEach(function (option) {
            option.addEventListener('click', function (event) {
                let filterLayerBox = this.closest('.filter-layer-box');
                let dropdownBox = this.closest('.dropdown-box');
                if (filterLayerBox) {
                    let button = filterLayerBox.querySelector('.filter-toggle');
                    if (button) {
                        let filterValue = button.querySelector('.filter-value');
                        if (filterValue) {
                            let checkedInput = this.closest('li')?.querySelector('input');
                            if (checkedInput) {
                                let text = this.textContent;
                                let value = checkedInput.value;
                                filterValue.innerHTML = `${text}`;
                                filterValue.dataset.value = `${value}`;
                            }
                        }
                    }
                } else if (dropdownBox) {
                    let button = dropdownBox.querySelector('.dropdown-toggle');
                    if (button) {
                        let checkedInput = this.closest('li')?.querySelector('input');
                        if (checkedInput) {
                            let text = this.textContent;
                            let value = checkedInput.value;
                            if (!value || value === 'on' || value === 'off' || value === '') {
                                button.dataset.value = `${text}`;
                            } else {
                                button.dataset.value = `${value}`;
                            }
                            button.innerHTML = `${text}`;
                        }
                    }
                }
            });
        });
    });

    /**
     * Sidebar
     * @deprecated
     * */
    let sidebar = document.querySelector('nav.sidebar');
    if (sidebar) {
        let sidebarBody = sidebar.querySelector('.sidebar-body');
        let topNavItems = sidebarBody.querySelectorAll('ul.nav > li.nav-item.topMenu');
        if (topNavItems && topNavItems.length > 0) {
            topNavItems.forEach(function (topNavItem) {
                let aTag = topNavItem.querySelector('a.nav-link');
                aTag.setAttribute('aria-expanded', 'true');
                let topNavItemWrapper = topNavItem.querySelector('div');
                topNavItemWrapper.className = '';
                topNavItemWrapper.setAttribute('style', '');
                topNavItemWrapper.classList.add('collapse');
                topNavItemWrapper.classList.add('show');
            });
            let topSubNavItems = sidebarBody.querySelectorAll('ul.nav > li.nav-item.topSubMenu');
            topSubNavItems.forEach(function (topSubNavItem) {
                let aTag = topSubNavItem.querySelector('a.nav-link');
                aTag.setAttribute('aria-expanded', 'true');
                let topNavItemWrapper = topSubNavItem.querySelector('div');
                topNavItemWrapper.className = '';
                topNavItemWrapper.setAttribute('style', '');
                topNavItemWrapper.classList.add('collapse');
                topNavItemWrapper.classList.add('show');
            });
        }
    }

    /**
     * Textarea Viewer
     * \n Literal Change <br/> to General HTML View
     * */
    let textareaViews = document.querySelectorAll('.textareaView');
    textareaViews?.forEach(function (textareaView) {
        textareaView.innerHTML = textareaView.textContent.replace(/\n/g, "<br>");
    });

    /**
     * PopUp View Event Set
     * */
    let popUpViews = document.querySelectorAll('.modal-popup-wrap');
    if (popUpViews && popUpViews.length !== 0) {
        popUpViews.forEach(function (view) {
            platformPopUpEventRegister(view);
        });
    }
});

//isEmpty 함수
if (typeof String.prototype.isEmpty !== 'function') {
    String.prototype.isEmpty = function () {
        return (this == null || this == undefined || this == '');
    };
}

String.prototype.ucwords = function () {
    str = this.trim();
    return str.replace(/(^([a-zA-Z\p{M}]))|([ -][a-zA-Z\p{M}])/g, function (s) {
        return s.toUpperCase();
    });
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

    $(document).ajaxSend(function (e, xhr, options) {
        var url = options.url;
        if (url.indexOf(contextPath) < 0) {
            url = contextPath + options.url;
        }
        options.url = url;
        xhr.setRequestHeader(header, token);
    });
}

function ajaxPost(url, data, callback, showLoading) {
    // IE 기본값세팅
    showLoading = typeof showLoading !== 'undefined' ? showLoading : false;
    $.ajax({
        url: contextPath + url,
        data: JSON.stringify(data),
        success: function (result) {
            //console.log('result : ', result);
            if (callback) {
                callback(result);
            }
        },
        beforeSend: function () {
            if (showLoading) {
                $('.wrap-loading').removeClass('display-none');
            }
        },
        complete: function () {
            if (showLoading) {
                $('.wrap-loading').addClass('display-none');
            }
        },
        error: function (xhr, status, error) {
            console.error('error : ', error);
        }
    });
}

function commonPreventDefault(event) {
    event.preventDefault ? event.preventDefault() : (event.returnValue = false);
}

function commonSearchPaging(formName) {
    if (formName === null || formName === undefined) {
        formName = 'searchForm';
    }
    // 페이지 클릭
    $('.page-link').on('click', function (event) {
        commonPreventDefault(event);
        var searchForm = document.forms[formName];
        searchForm.page.value = $(this).data('page');
        searchForm.submit();
    });

    // 검색
    $('.btn-search').on('click', function (event) {
        commonPreventDefault(event);
        var searchForm = document.forms[formName];
        searchForm.page.value = 1;
        searchForm.submit();
    });
}

/**
 * form 배열로 저장
 */
jQuery.fn.serializeObject = function () {
    var obj = null;
    try {
        if (this[0].tagName && this[0].tagName.toUpperCase() === 'FORM') {
            var arr = this.serializeArray();
            if (arr) {
                obj = {};
                jQuery.each(arr, function () {
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

$.fn.radioSelect = function (val) {
    this.each(function () {
        var $this = $(this);
        if ($this.val() == val) {
            $this.attr('checked', true);
        }
    });
    return this;
};

function removeChar(obj) {
    obj.value = obj.value.replace(/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/g, '');
}

function isValidDate(dateString) {
    // 날짜 형식이 yyyy-MM-dd인지 확인하는 정규식
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;

    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
}

function validateDates(startDate, endDate) {
    if (!isValidDate(startDate)) {
        alert('시작 날짜 형식이 잘못되었습니다. (yyyy-MM-dd)');
        return false;
    }

    if (!isValidDate(endDate)) {
        alert('종료 날짜 형식이 잘못되었습니다. (yyyy-MM-dd)');
        return false;
    }

    if (new Date(startDate) > new Date(endDate)) {
        alert('시작 날짜는 종료 날짜보다 이전이어야 합니다.');
        return false;
    }

    return true;
}

function compareDates(date1, date2) {
    // 날짜 문자열을 Date 객체로 변환
    const parsedDate1 = new Date(date1);
    const parsedDate2 = new Date(date2);

    // 날짜 비교
    if (parsedDate1 < parsedDate2) {
        return -1; // date1이 date2보다 이전
    } else if (parsedDate1 > parsedDate2) {
        return 1; // date1이 date2보다 이후
    } else {
        return 0; // date1과 date2가 동일
    }
}

function getCurrentDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0'); // 월은 0부터 시작하므로 +1 필요
    const day = String(today.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

function modelListCommonSearchPaging() {
    // 페이지 클릭
    $('.page-link').on('click', function (event) {
        commonPreventDefault(event);
        console.log('$(this).data', $(this).data());
        let searchForm = document.forms['searchForm'];
        searchForm.page.value = $(this).data('page');
        searchForm.subPage.value = $(this).data('subPage');
        searchForm.submit();
    });

    // 검색
    $('.btn-search').on('click', function (event) {
        commonPreventDefault(event);
        let searchForm = document.forms['searchForm'];
        searchForm.page.value = 1;
        searchForm.subPage.value = 1;
        searchForm.submit();
    });
}

function boardListCommonSearchPaging() {
    // 페이지 클릭
    $('.page-link').on('click', function (event) {
        commonPreventDefault(event);
        let searchForm = document.forms['searchForm'];
        searchForm.page.value = $(this).data('page');
        searchForm.submit();
    });

    // 검색
    $('.btn-search').on('click', function (event) {
        commonPreventDefault(event);
        let searchForm = document.forms['searchForm'];
        searchForm.page.value = 1;
        searchForm.submit();
    });
}

/**
 * Ratio Element Width & Height
 * */
function setElementHeightByRatio(element, widthHeightRatio) {
    // 요소의 현재 너비를 가져옴
    const width = element.offsetWidth;

    // 비율을 사용하여 높이를 계산
    const height = width / widthHeightRatio;

    // 계산된 높이를 요소의 높이로 설정
    element.style.height = `${height}px`;
}

/**
 * Platform PopUp Event Register
 * Close event without button
 * */
function platformPopUpEventRegister(popUpViewElement) {
    const closeButton = popUpViewElement.querySelectorAll('.btn-popup-close');
    closeButton.forEach((button) => {
        button.addEventListener('click', () => {
            const modalPopupId = button.getAttribute('data-popup-id');
            document.getElementById(modalPopupId).classList.remove('is-open');
        });
    });
    const modalMask = popUpViewElement.querySelectorAll('.modal-popup-mask');
    modalMask.forEach((mask) => {
        mask.addEventListener('click', () => {
            const modalPopupId = mask.parentNode.getAttribute('id');
            document.getElementById(modalPopupId).classList.remove('is-open');
        });
    });
}

/**
 * Platform Layer Close
 * */
function closeLayer(box, layer) {
    box.classList.remove('is-show');
    const menu = box.querySelector(layer);
    if (menu) menu.setAttribute('aria-expanded', 'false');
}

/**
 * Platform Layer All Close
 * */
function closeLayers(boxes, box, layer) {
    // 다른 레이어 닫기
    boxes.forEach(b => {
        b.classList.remove('is-show');
        const menu = b.querySelector(layer);
        if (menu) menu.setAttribute('aria-expanded', 'false');
    });
}

function openLayer(box, layer) {
    box.classList.add('is-show');
    const menu = box.querySelector(layer);
    if (menu) menu.setAttribute('aria-expanded', 'true');
}

/**
 * excludeLayer 추가하여 해당 부분은 클릭시 닫히는것을 방지
 * */
//외부 클릭 시 레이어 닫음
function closeLayerOnOutsideClick(boxes, layer, excludeLayer) {
    document.addEventListener('click', (e) => {
        boxes.forEach(box => {
            if (!e.target.closest(box.classList[0]) && (!excludeLayer || (excludeLayer && !e.target.closest(excludeLayer)))) {
                box.classList.remove('is-show');
                const menu = box.querySelector(layer);
                if (menu) menu.setAttribute('aria-expanded', 'false');
            }
        });
    });
}

/**
 * Dropdown Menu Change Event For Button
 * example:
 * const button = document.querySelector('#buttonId');
 * observeDataValueChange(button);
 * */
// 특정 요소의 속성 변화 감지
function observeDataValueChange(targetElement, callback) {
    console.log('observeDataValueChange', targetElement);
    if (!targetElement) return;

    // MutationObserver 생성
    const observer = new MutationObserver((mutationsList) => {
        mutationsList.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'data-value') {
                // 변경된 data-value 값 가져오기
                const newValue = targetElement.getAttribute('data-value');
                // 변경 시 실행할 작업
                handleDataValueChange(targetElement, newValue, callback);
            }
        });
    });

    // Observer 설정
    observer.observe(targetElement, {
        attributes: true, // 속성 변경 감지
        attributeFilter: ['data-value'], // 감지할 속성 필터
    });
}

// data-value 변경 시 실행할 작업
function handleDataValueChange(targetElement, newValue, callback) {
    console.log(`새로운 data-value 처리 로직 실행: ${newValue}`);
    callback(targetElement, newValue);
}

function labelClickEventListener(event) {
    console.log('labelClickEventListener', event);
    let filterLayerBox = this.closest('.filter-layer-box');
    let dropdownBox = this.closest('.dropdown-box');
    if (filterLayerBox) {
        let button = filterLayerBox.querySelector('.filter-toggle');
        if (button) {
            let filterValue = button.querySelector('.filter-value');
            if (filterValue) {
                let checkedInput = this.closest('li')?.querySelector('input');
                if (checkedInput) {
                    let text = this.textContent;
                    let value = checkedInput.value;
                    filterValue.innerHTML = `${text}`;
                    filterValue.dataset.value = `${value}`;
                }
            }
        }
        closeLayers(document.querySelectorAll('.filter-layer-box'), filterLayerBox, '.filter-layer');
    } else if (dropdownBox) {
        let button = dropdownBox.querySelector('.dropdown-toggle');
        if (button) {
            let checkedInput = this.closest('li')?.querySelector('input');
            if (checkedInput) {
                // Dropdown button dataset reset
                Object.keys(button.dataset).forEach((key) => {
                    if (key !== 'value') {
                        button.dataset[key] = '';
                    }
                });

                let value = checkedInput.value;
                if (!value || value === 'on' || value === 'off' || value === '') {
                    button.dataset.value = `${this.textContent}`;
                } else {
                    button.dataset.value = `${value}`;
                }
                button.innerHTML = `${this.textContent}`;

                // checkedInput의 dataset을 button.dataset으로 복사
                Object.keys(checkedInput.dataset).forEach((key) => {
                    if (key !== 'value') {
                        button.dataset[key] = checkedInput.dataset[key];
                    }
                });
                checkedInput.checked = true;
            }
        }
        closeLayers(document.querySelectorAll('.dropdown-box'), dropdownBox, '.dropdown-layer');
    }
}

function datasetLabelClickEventListener(event) {
    console.log('outlierTypeLabelClickEventListener', event);
    let filterLayerBox = this.closest('.filter-layer-box');
    let dropdownBox = this.closest('.dropdown-box');
    if (filterLayerBox) {
        let button = filterLayerBox.querySelector('.filter-toggle');
        if (button) {
            let filterValue = button.querySelector('.filter-value');
            if (filterValue) {
                let checkedInput = this.closest('li')?.querySelector('input');
                if (checkedInput) {
                    let text = this.textContent;
                    let value = checkedInput.value;
                    filterValue.innerHTML = `${text}`;
                    filterValue.dataset.value = `${value}`;
                }
            }
        }
        closeLayers(document.querySelectorAll('.filter-layer-box'), filterLayerBox, '.filter-layer');
    } else if (dropdownBox) {
        let button = dropdownBox.querySelector('.dropdown-toggle');
        if (button) {
            let checkedInput = this.closest('li')?.querySelector('input');
            if (checkedInput) {
                // Dropdown button dataset reset
                Object.keys(button.dataset).forEach((key) => {
                    console.log(key, checkedInput.dataset[key]);
                    if (key !== 'value') {
                        button.dataset[key] = '';
                    }
                });
                // checkedInput의 dataset을 button.dataset으로 복사
                Object.keys(checkedInput.dataset).forEach((key) => {
                    console.log(key, checkedInput.dataset[key]);
                    if (key !== 'value') {
                        button.dataset[key] = checkedInput.dataset[key];
                    }
                });
                checkedInput.checked = true;

                let value = checkedInput.value;
                if (!value || value === 'on' || value === 'off' || value === '') {
                    button.dataset.value = `${this.textContent}`;
                } else {
                    button.dataset.value = `${value}`;
                }
                button.innerHTML = `${this.textContent}`;

                if (this.dataset.selected_name) {
                    button.innerHTML = `${this.dataset.selected_name}`;
                }
            }
        }
        closeLayers(document.querySelectorAll('.dropdown-box'), dropdownBox, '.dropdown-layer');
    }
}

function dropdownToggleButtonClickEventListener(event) {
    event.stopPropagation();
    let dropdownBox = this.closest('.dropdown-box');
    closeLayers(document.querySelectorAll('.dropdown-box'), dropdownBox, '.dropdown-layer');
    openLayer(dropdownBox, '.dropdown-layer');
}