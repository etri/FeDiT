document.addEventListener('DOMContentLoaded', function () {
    let registerContainer = document.querySelector('[data-action-container="register"]');
    if (registerContainer) {
        const fileInput = registerContainer.querySelector('.custom-file #file');
        const fileLabel = registerContainer.querySelector('.custom-file .custom-file-label');
        // Event listener for file selection
        fileInput?.addEventListener('change', (e) => {
            const fileName = e.target.files.length ? e.target.files[0].name : '클릭하여 파일을 업로드 해주세요.';
            fileLabel.textContent = fileName;
        });
        const resetButton = registerContainer.querySelector('#clearButton');
        // Event listener for reset button
        resetButton?.addEventListener('click', () => {
            fileInput.value = '';  // Clear the file input
            fileLabel.textContent = '클릭하여 파일을 업로드 해주세요.';  // Reset the label text
        });

        const registerButton = registerContainer.querySelector('button[data-action="register"]');
        registerButton?.addEventListener('click', function (event) {
            let _this = this;
            _this.disabled = true;
            let container = document.querySelector('[data-action-container="register"]');
            let titleInput = container.querySelector('#title');
            if (titleInput.value.trim().length === 0) {
                alert('제목을 입력해주세요.');
                return;
            }
            let descriptionTextarea = container.querySelector('#description');
            if (descriptionTextarea.value.trim().length === 0) {
                alert('내용을 입력해주세요.');
                return;
            }
            let fileInput = container.querySelector('#file');
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
                        console.error('Error:', 'result.code is not success');
                    }
                }, error: function (xhr, status, error) {
                    closeProgressBar({element: null, process_id: 'process-51'});
                    this.disabled = false;
                    console.error('Error:', error);  // Handle errors
                }
            });
        });
    }
    let updateContainer = document.querySelector('[data-action-container="update"]');
    if (updateContainer) {
        const fileInput = updateContainer.querySelector('.custom-file #file');
        const fileLabel = updateContainer.querySelector('.custom-file .custom-file-label');
        // Event listener for file selection
        fileInput?.addEventListener('change', (e) => {
            const fileName = e.target.files.length ? e.target.files[0].name : '클릭하여 파일을 업로드 해주세요.';
            fileLabel.textContent = fileName;
            let _this = e.target;
            if (_this && _this.dataset.originFileNm) {
                delete _this.dataset.originFileNm;
            }
        });
        const resetButton = updateContainer.querySelector('#clearButton');
        // Event listener for reset button
        resetButton?.addEventListener('click', () => {
            fileInput.value = '';  // Clear the file input
            fileLabel.textContent = '클릭하여 파일을 업로드 해주세요.';  // Reset the label text
            delete fileInput.dataset.originFileNm;
        });

        const updateButton = updateContainer.querySelector('button[data-action="update"]');
        updateButton?.addEventListener('click', function (event) {
            let _this = this;
            let board_no = _this.dataset.boardNo;
            _this.disabled = true;
            let container = document.querySelector('[data-action-container="update"]');
            let titleInput = container.querySelector('#title');
            if (titleInput.value.trim().length === 0) {
                alert('제목을 입력해주세요.');
                return;
            }
            let descriptionTextarea = container.querySelector('#description');
            if (descriptionTextarea.value.trim().length === 0) {
                alert('내용을 입력해주세요.');
                return;
            }
            let fileInput = container.querySelector('#file');
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
                url = `/dt/board/notice/${board_no}/update`;
            } else {
                url = `/dt/board/community/${board_no}/update`;
            }

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
                        console.error('Error:', 'result.code is not success');
                    }
                }, error: function (xhr, status, error) {
                    closeProgressBar({element: null, process_id: 'process-52'});
                    this.disabled = false;
                    console.error('Error:', error);  // Handle errors
                }
            });
        });
    }
});