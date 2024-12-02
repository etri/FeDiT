import { GoogleGenerativeAI } from "@google/generative-ai";

// Fetch your API_KEY
const API_KEY = "AIzaSyBbhEZph_6-GOMdYtbBwVztn7kVU3Wl72Q";

const genAI = new GoogleGenerativeAI(API_KEY);

const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

async function sendMessage() {
    const prompt = document.getElementById('user_input').value;
    const responseElement = document.getElementById('response');

    /** 유저 */
    const userMessage = document.createElement('div');

    userMessage.style.backgroundColor = 'rgb(255, 245, 247)';
    userMessage.style.textAlign = 'right';
    userMessage.style.marginBottom = '10px';
    userMessage.style.padding = '10px';
    userMessage.style.borderRadius = '10px';
    userMessage.style.fontSize = 'larger';

    userMessage.id = 'userMessage';
    userMessage.innerHTML = prompt;
    
    responseElement.appendChild(userMessage);
    responseElement.scrollTop = responseElement.scrollHeight;

    /** 제미나이 */
    const geminiResSection = document.createElement('div');
    geminiResSection.id = 'geminiResSection';
    // geminiResSection.style.backgroundColor = 'rgb(255, 245, 242)';
    geminiResSection.style.textAlign = 'left';
    geminiResSection.style.marginBottom = '10px';
    geminiResSection.style.padding = '10px';
    geminiResSection.style.borderRadius = '10px';
    geminiResSection.style.fontSize = 'larger';
    geminiResSection.innerHTML = 'Gemini가 내용을 입력하고 있어요...';
    responseElement.appendChild(geminiResSection);
    responseElement.scrollTop = responseElement.scrollHeight;


    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = await response.text();
        geminiResSection.remove();
        typeEffect(responseElement, text);

    } catch (error) {
        geminiResSection.remove(); // 에러가 발생했을 때도 메시지 제거
        const errorMessageDiv = document.createElement('div');
        errorMessageDiv.innerHTML = '답변 중 에러가 발생하였습니다. 관리자에게 문의해주세요.';
        responseElement.appendChild(errorMessageDiv);
    }

}

// 모듈 함수 외부 노출시키기
window.sendMessage = sendMessage;

// async function run() {
//     const prompt = "Write a story about an AI and magic";
//     const result = await model.generateContent(prompt);
//     const response = await result.response;
//     const text = await response.text();
//     console.log(text);
// }

// run();

function typeEffect(responseElement, text, delay = 25) {
    // 새로운 div 요소 생성
    const geminiResTyping = document.createElement('div');

    // geminiResTyping.style.backgroundColor = 'rgb(255, 245, 242)';
    geminiResTyping.style.textAlign = 'left';
    geminiResTyping.style.marginBottom = '10px';
    geminiResTyping.style.padding = '10px';
    geminiResTyping.style.borderRadius = '10px';
    geminiResTyping.style.fontSize = 'larger';


    responseElement.appendChild(geminiResTyping); // element에 새로운 div 추가

    geminiResTyping.innerHTML = ''; // div 내용을 초기화
    let i = 0;

    responseElement.scrollTop = responseElement.scrollHeight;
    
    function typing() {
        if (i < text.length) {
            geminiResTyping.innerHTML += text.charAt(i); // 새로 생성된 div에 타이핑 효과 적용
            i++;
            setTimeout(typing, delay);
        }
    }
    
    typing();

    
}
