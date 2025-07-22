function updateRangeBackground(input) {
    const min = parseFloat(input.min);
    const max = parseFloat(input.max);
    const val = parseFloat(input.value);
    const percent = ((val - min) / (max - min)) * 100;

    input.style.background = `linear-gradient(to right, #749BCE 0%, #749BCE ${percent + 10}%, #ddd ${percent + 10}%, #ddd 100%)`;
}

function bindRangeEvent(input) {
    // 이미 초기화된 경우 무시
    if (input.dataset.initialized === "true") return;

    input.dataset.initialized = "true";
    updateRangeBackground(input);
    input.addEventListener("input", function () {
        updateRangeBackground(this);
    });
}

// 처음 로드 시 처리
function initAllRangeInputs() {
    const rangeInputs = document.querySelectorAll("input[type='range'].custom-range-obj");
    rangeInputs.forEach(bindRangeEvent);
}

// MutationObserver로 DOM 변경 감지
const observer = new MutationObserver(() => {
    initAllRangeInputs();
});

document.addEventListener("DOMContentLoaded", () => {
    // 초기 바인딩
    initAllRangeInputs();

    // <body> 이하 모든 변경 감지
    observer.observe(document.body, {
        childList: true, subtree: true,
    });
});