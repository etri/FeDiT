document.addEventListener('DOMContentLoaded', function () {
    /**
     * 데이터 증강 도구 Search Event
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
            let keyword = keywordElem.value.trim();
            let hiddenKeyword = document.querySelector('#keyword');
            hiddenKeyword.value = keyword;

            let fieldElem = document.querySelector('input[name="searchType"]:checked');
            let field = fieldElem.value;
            let hiddenField = document.querySelector('#field');
            hiddenField.value = field;

            let search = document.querySelector('button[type="submit"].btn-search');
            search.click();
        });
    }

    modelListCommonSearchPaging();
    let listItems = document.querySelectorAll('[data-action-type="delete"]');
    listItems?.forEach(function (item) {
        item.addEventListener('click', function (event) {
            if (!confirm('해당 모델을 삭제하시겠습니까?')) {
                return false;
            }
            let model_seq = this.dataset.number;
            let data = {
                model_seq
            }

            $.ajax({
                type: "POST",
                url: '/dt/model/delete',
                data: JSON.stringify(data),
                contentType: "application/json; charset=utf-8;",
                dataType: "json",
                success: function (result) {
                    console.log('result', result);
                    if (result.code === 200) {
                        switch (result.type) {
                            case 'success':
                                alert('삭제가 완료되었습니다.');
                                location.href = window.location.href;
                                break;
                            case 'restrict':
                                alert('해당 모델은 Data Twin Simulation에서 사용되고 있습니다.\n삭제할 수 없습니다.');
                                break;
                            case 'nofind':
                                alert('해당되는 Data Twin Model을 찾을 수 없습니다.\n새로고침 후 다시 시도해주세요.');
                                break;
                        }
                    } else {
                        alert('API 내 에러 발생');
                    }
                },
                error: function (xhr, status, error) {
                    console.error('error : ', error);
                    alert('에러가 발생하였습니다. 관리자에게 문의하십시오.');
                }
            });
        });
    });

    let listFailItems = document.querySelectorAll('[data-type="errorModal"]');
    listFailItems.forEach(function (item) {
        item.addEventListener('click', function (event) {
            let parentRow = this.closest('tr');
            let errorFrame = parentRow.querySelector('#error_frame');
            if (errorFrame) {
                let err_type = errorFrame.querySelector('#err_type');
                let errCd = errorFrame.querySelector('#errCd');
                let errNm = errorFrame.querySelector('#errNm');
                let errLct = errorFrame.querySelector('#errLct');
                let errCn = errorFrame.querySelector('#errCn');
                let errRegDt = errorFrame.querySelector('#errRegDt');

                let errorModal = document.querySelector('#errorModal');
                let errTpElement = errorModal.querySelector('#errTp');
                let errCdElement = errorModal.querySelector('#errCd');
                let errNmElement = errorModal.querySelector('#errNm');
                let errLctElement = errorModal.querySelector('#errLct');
                let errCnElement = errorModal.querySelector('#errCn');
                let errRegDtElement = errorModal.querySelector('#errRegDt');

                errTpElement.innerHTML = `${err_type.dataset.value}`;
                errCdElement.innerHTML = `${errCd.dataset.value}`;
                errNmElement.innerHTML = `${errNm.dataset.value}`;
                errLctElement.innerHTML = `${errLct.dataset.value}`;
                errCnElement.innerHTML = `${errCn.dataset.value}`;
                errRegDtElement.innerHTML = `${errRegDt.dataset.value}`;

                if (!errorModal.classList.contains('is-open')) {
                    errorModal.classList.add('is-open');
                }
            }
        });
    });
});