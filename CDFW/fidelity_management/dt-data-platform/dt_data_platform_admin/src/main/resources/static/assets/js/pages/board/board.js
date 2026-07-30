document.addEventListener('DOMContentLoaded', function () {
    /**
     * Board Search Event
     * */
    let fieldInitializeElem = document.querySelector('span.filter-value[data-initialize]');
    if (fieldInitializeElem) {
        let type = fieldInitializeElem.dataset.initialize;
        let filterLayerBox = fieldInitializeElem.closest('.filter-layer-box');
        let input = filterLayerBox.querySelector(`input[type="radio"][value="${type}"]`);
        let label = filterLayerBox.querySelector(`label[for="${input.id}"]`);
        fieldInitializeElem.innerHTML = `${label.textContent.trim()}`;
    }
    let filterKeyword = document.querySelector('#filterKeyword');
    if (filterKeyword) {
        filterKeyword.addEventListener('keyup', function (event) {
            if (event.key === 'Enter' || event.code === 'Enter') {
                let filterKeywordAction = document.querySelector('#filterKeywordAction');
                if (filterKeywordAction) {
                    filterKeywordAction.click();
                }
            }
        });
    }
    let filterKeywordAction = document.querySelector('#filterKeywordAction');
    if (filterKeywordAction) {
        filterKeywordAction.addEventListener('click', function (event) {
            let keywordElem = document.querySelector('#filterKeyword');
            let keyword = keywordElem.value;
            let hiddenKeyword = document.querySelector('#keyword');
            hiddenKeyword.value = keyword;

            let fieldElem = document.querySelector('input[name="searchType"]:checked');
            let field = fieldElem.value;
            let hiddenField = document.querySelector('#field');
            hiddenField.value = field;

            console.log(hiddenKeyword.value, hiddenField.value);

            let search = document.querySelector('button[type="submit"].btn-search');
            search.click();
        });
    }
    boardListCommonSearchPaging();
    let listItems = document.querySelectorAll('[data-action="delete"]');
    listItems?.forEach(function (item) {
        item.addEventListener('click', function (event) {
            let board_no = this.dataset.number;
            let _this = this;
            if (!confirm('선택한 게시글을 삭제하시겠습니까?')) {
                return;
            }
            let url;
            if (_this.dataset.type === 'NOTICE') {
                url = `/dt/board/notice/${board_no}/delete`;
            } else {
                url = `/dt/board/community/${board_no}/delete`;
            }

            showProgressBar({element: null, process_id: 'process-52'});

            $.ajax({
                type: "POST",
                url: url,
                contentType: "application/json; charset=utf-8;",
                dataType: "json",
                success: function (result) {
                    if (result.code === 200) {
                        closeProgressBar({element: null, process_id: 'process-52'});
                        location.href = window.location.href;
                    } else {
                        closeProgressBar({element: null, process_id: 'process-52'});
                        alert('게시글 삭제에 실패하였습니다. 다시 시도해주세요.');
                        console.error('Error:', 'result.code is not success');
                    }
                },
                error: function (xhr, status, error) {
                    closeProgressBar({element: null, process_id: 'process-52'});
                    alert('게시글 삭제 중 오류가 발생하였습니다. 다시 시도해주세요.');
                    console.error('error : ', error);
                }
            });
        });
    });
});