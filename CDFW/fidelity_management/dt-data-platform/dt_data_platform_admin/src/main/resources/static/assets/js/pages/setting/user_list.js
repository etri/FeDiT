document.addEventListener('DOMContentLoaded', () => {
    /**
     * User List Search Event
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
    commonSearchPaging();
    $('.btn-delete').on('click', function () {
        if (confirm('해당 사용자를 삭제하시겠습니까?')) {
            let userSeq = $(this).data('userSeq');
            let form = document.forms.deleteForm;
            form.userSeq.value = userSeq;
            form.submit();
        }
    });
});