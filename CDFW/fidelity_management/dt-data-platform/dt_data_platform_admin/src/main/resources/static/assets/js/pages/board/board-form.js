// 게시판 첨부파일 검증 기준 (서버 multipart 한도 20MB와 일치)
const BOARD_FILE_MAX_SIZE = 20 * 1024 * 1024;
const BOARD_FILE_ALLOWED_EXT = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'hwp', 'txt', 'csv', 'zip'];

/**
 * 첨부파일 확장자/크기 검증. 파일 미선택 시 통과(선택 항목).
 * @returns {boolean} 유효하면 true, 아니면 alert 후 false
 */
function validateBoardFile(fileInput) {
    if (!fileInput || fileInput.files.length === 0) {
        return true;
    }
    const file = fileInput.files[0];
    const ext = file.name.split('.').pop().toLowerCase();
    if (BOARD_FILE_ALLOWED_EXT.indexOf(ext) === -1) {
        alert('허용되지 않는 파일 형식입니다.\n허용 형식: ' + BOARD_FILE_ALLOWED_EXT.join(', '));
        return false;
    }
    if (file.size > BOARD_FILE_MAX_SIZE) {
        alert('파일 크기는 20MB 이하만 업로드할 수 있습니다.');
        return false;
    }
    return true;
}

document.addEventListener('DOMContentLoaded', function () {
    let registerContainer = document.querySelector('[data-action-container="register"]');
    if (registerContainer) {
        const fileInput = registerContainer.querySelector('#attach_files');
        const fileLabel = registerContainer.querySelector('#attach_files_input');
        // Event listener for file selection
        fileInput?.addEventListener('change', (e) => {
            const fileName = e.target.files.length ? e.target.files[0].name : '클릭하여 파일을 업로드 해주세요.';
            fileLabel.value = fileName;
        });
        const resetButton = registerContainer.querySelector('#clearButton');
        // Event listener for reset button
        resetButton?.addEventListener('click', () => {
            fileInput.value = '';  // Clear the file input
            fileLabel.value = '클릭하여 파일을 업로드 해주세요.';  // Reset the label text
        });

        const registerButton = registerContainer.querySelector('button[data-action="register"]');
        registerButton?.addEventListener('click', function (event) {
            let _this = this;
            let container = document.querySelector('[data-action-container="register"]');
            let titleInput = container.querySelector('#title');
            if (titleInput.value.trim().length === 0) {
                alert('제목을 입력해주세요.');
                return;
            }
            if (titleInput.value.trim().length > 200) {
                alert('제목은 200자 이내로 입력해주세요.');
                return;
            }
            let descriptionTextarea = container.querySelector('#description');
            if (descriptionTextarea.value.trim().length === 0) {
                alert('내용을 입력해주세요.');
                return;
            }
            let fileInput = container.querySelector('#attach_files');
            if (!validateBoardFile(fileInput)) {
                return;
            }
            const radioInputs = container.querySelectorAll('input[name="rlsYn"]');
            let isRlsYn = '';

            // Loop through the radio buttons to find the checked one
            radioInputs.forEach((radioInput) => {
                if (radioInput.checked) {
                    isRlsYn = radioInput.value;
                }
            });

            // Create a FormData object to hold the form data
            const formData = new FormData();
            formData.append('title', titleInput.value.trim());
            formData.append('description', descriptionTextarea.value.trim());
            formData.append('rlsYn', isRlsYn);

            // Append the file if one is selected
            if (fileInput.files.length > 0) {
                formData.append('file', fileInput.files[0]);
            }

            let url;
            if (_this.dataset.type === 'NOTICE') {
                url = '/dt/board/notice/register';
            } else {
                url = '/dt/board/community/register';
            }

            _this.disabled = true;
            showProgressBar({element: null, process_id: 'process-51'});

            $.ajax({
                type: "POST",
                url: url, data: formData, contentType: false, // 필요 없음
                processData: false, // 필요 없음
                success: function (result) {
                    if (result.code === 200) {
                        alert('게시글을 등록하였습니다.');
                        _this.disabled = false;
                        const url = new URL(window.location.href);
                        const urlParams = url.searchParams;
                        const menu_cd = urlParams.get('menuCd');
                        if (_this.dataset.type === 'NOTICE') {
                            location.href = `/dt/board/notice/list?menuCd=${menu_cd}`;
                        } else {
                            location.href = `/dt/board/community/list?menuCd=${menu_cd}`;
                        }
                    } else {
                        closeProgressBar({element: null, process_id: 'process-51'});
                        _this.disabled = false;
                        alert('게시글 등록에 실패하였습니다. 다시 시도해주세요.');
                        console.error('Error:', 'result.code is not success');
                    }
                }, error: function (xhr, status, error) {
                    closeProgressBar({element: null, process_id: 'process-51'});
                    _this.disabled = false;
                    alert('게시글 등록 중 오류가 발생하였습니다. 다시 시도해주세요.');
                    console.error('Error:', error);  // Handle errors
                }
            });
        });
    }
    let updateContainer = document.querySelector('[data-action-container="update"]');
    if (updateContainer) {
        const fileInput = updateContainer.querySelector('#attach_files');
        const fileLabel = updateContainer.querySelector('#attach_files_input');
        // Event listener for file selection
        fileInput?.addEventListener('change', (e) => {
            const fileName = e.target.files.length ? e.target.files[0].name : '클릭하여 파일을 업로드 해주세요.';
            fileLabel.value = fileName;
            let _this = e.target;
            if (_this && _this.dataset.originFileNm) {
                delete _this.dataset.originFileNm;
            }
        });
        const resetButton = updateContainer.querySelector('#clearButton');
        // Event listener for reset button
        resetButton?.addEventListener('click', () => {
            fileInput.value = '';  // Clear the file input
            fileLabel.value = '클릭하여 파일을 업로드 해주세요.';  // Reset the label text
            delete fileInput.dataset.originFileNm;
        });

        const updateButton = updateContainer.querySelector('button[data-action="update"]');
        updateButton?.addEventListener('click', function (event) {
            let _this = this;
            let board_no = _this.dataset.boardNo;
            let container = document.querySelector('[data-action-container="update"]');
            let titleInput = container.querySelector('#title');
            if (titleInput.value.trim().length === 0) {
                alert('제목을 입력해주세요.');
                return;
            }
            if (titleInput.value.trim().length > 200) {
                alert('제목은 200자 이내로 입력해주세요.');
                return;
            }
            let descriptionTextarea = container.querySelector('#description');
            if (descriptionTextarea.value.trim().length === 0) {
                alert('내용을 입력해주세요.');
                return;
            }
            let fileInput = container.querySelector('#attach_files');
            if (!validateBoardFile(fileInput)) {
                return;
            }
            const radioInputs = container.querySelectorAll('input[name="rlsYn"]');
            let isRlsYn = '';

            // Loop through the radio buttons to find the checked one
            radioInputs.forEach((radioInput) => {
                if (radioInput.checked) {
                    isRlsYn = radioInput.value;
                }
            });

            // Create a FormData object to hold the form data
            const formData = new FormData();
            formData.append('title', titleInput.value.trim());
            formData.append('description', descriptionTextarea.value.trim());
            formData.append('rlsYn', isRlsYn);

            // Append the file if one is selected
            if (fileInput.files.length > 0) {
                formData.append('file', fileInput.files[0]);
            }
            console.log('fileInput.dataset', fileInput.dataset);
            if (fileInput.dataset.originFileCheck) {
                formData.append('originFileCheck', fileInput.dataset.originFileCheck);
                if (fileInput.dataset.originFileNm) {
                    formData.append('originFileNm', fileInput.dataset.originFileNm);
                }
            }

            let url;
            if (_this.dataset.type === 'NOTICE') {
                url = `/dt/board/notice/${board_no}/update`;
            } else {
                url = `/dt/board/community/${board_no}/update`;
            }

            _this.disabled = true;
            showProgressBar({element: null, process_id: 'process-52'});

            $.ajax({
                type: "POST",
                url: url, data: formData, contentType: false, // 필요 없음
                processData: false, // 필요 없음
                success: function (result) {
                    if (result.code === 200) {
                        alert('게시글을 수정하였습니다.');
                        _this.disabled = false;
                        const url = new URL(window.location.href);
                        const urlParams = url.searchParams;
                        const menu_cd = urlParams.get('menuCd');
                        location.href = window.location.href;
                    } else {
                        closeProgressBar({element: null, process_id: 'process-52'});
                        _this.disabled = false;
                        alert('게시글 수정에 실패하였습니다. 다시 시도해주세요.');
                        console.error('Error:', 'result.code is not success');
                    }
                }, error: function (xhr, status, error) {
                    closeProgressBar({element: null, process_id: 'process-52'});
                    _this.disabled = false;
                    alert('게시글 수정 중 오류가 발생하였습니다. 다시 시도해주세요.');
                    console.error('Error:', error);  // Handle errors
                }
            });
        });
    }
});