document.addEventListener('DOMContentLoaded', function () {
    modelListCommonSearchPaging();
    console.log('list event register');
    let listItems = document.querySelectorAll('[action-type="delete"]');
    console.log('listItems', listItems);
    listItems?.forEach(function (item) {
        console.log('item', item);
        item.addEventListener('click', function (event) {
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
                                const url = new URL(window.location.href);
                                const urlParams = url.searchParams;
                                let menu_cd = urlParams.get('menuCd');
                                console.log('contextPath', contextPath);
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

                console.log('errorModal', errorModal);
                $(errorModal).modal('show');
            }
        });
    });
});