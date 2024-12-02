import tkinter as tk
from PIL import Image, ImageTk

def create_notification_window(warn_by):
    text = None
    if warn_by == ord('m'):   
        text = "〮 이상상황 유형 -> 카메라 위치 변동\n\n〮 카메라의 위치가 변동되어 정상 작동\n  하지 않는 것으로 판단 됩니다."
    elif warn_by == ord('n'):
        text = "〮 이상상황 유형 -> 카메라 노이즈\n\n〮 카메라에 노이즈가 발생하여 정상\n  작동 하지 않는 것으로 판단 됩니다."
    elif warn_by == ord('h'):
        text = "〮 이상상황 유형 -> 특정 물체 감지\n\n〮 카메라 주위에 사용자가 정의한 기준\n  이상의 특정 물체가 감지되어 확인이\n  필요 합니다."
    text = "\n※ 정합성 검증 결과\n\n" + text

    window = tk.Tk()
    window.wm_attributes("-topmost", 1)
    window.overrideredirect(True)
    window.configure(bg="#303133")

    # 이미지 로드 및 표시
    image = Image.open("test.jpg")
    image = image.resize((250, 250))  # 이미지 크기 조정
    photo = ImageTk.PhotoImage(image)

    label_image = tk.Label(window, image=photo, borderwidth=0)
    label_image.image = photo
    label_image.pack(side="left", padx=(5, 0))

    # 텍스트 위젯 설정
    text_widget = tk.Text(window, font=("Helvetica", 16), width=30, height=10, wrap="word", 
                          fg="#ffffff", bg="#303133",   # RGB 설정
                          borderwidth=0,                # 외부 마진 제거
                          padx=25, pady=10)             # 내부 패딩
    text_widget.insert("end", text)
    text_widget.pack(side="right")

    # "정합성 검증 결과"를 굵게 표시하는 태그 설정
    bold_tag = "bold"
    text_widget.tag_configure(bold_tag, font=("Helvetica", 16, "bold"))

    # "정합성 검증 결과"에 굵은 글씨 적용
    bold_start_idx = text.index("정합성 검증 결과")
    bold_end_idx = bold_start_idx + len("정합성 검증 결과")
    text_widget.tag_add(bold_tag, "1.0+%dc" % bold_start_idx, "1.0+%dc" % bold_end_idx)

    # 특정 텍스트 부분의 색상 변경 및 굵은 글씨 적용
    highlight_terms = ["카메라 위치 변동", "카메라 노이즈", "특정 물체 감지"]
    for term in highlight_terms:
        if term in text:
            start_idx = text.index(term)
            end_idx = start_idx + len(term)
            term_tag = term.replace(" ", "_")
            text_widget.tag_add(term_tag, "1.0+%dc" % start_idx, "1.0+%dc" % end_idx)
            text_widget.tag_configure(term_tag, foreground="#E4656C", font=("Helvetica", 16, "bold"))

    text_widget.config(state="disabled")  # 텍스트 위젯을 읽기 전용으로 설정

    # 창 크기와 위치 계산하여 중앙에 배치
    window.update_idletasks()
    width = window.winfo_width()
    height = window.winfo_height()
    x = (window.winfo_screenwidth() // 2) - (width // 2)
    y = (window.winfo_screenheight() // 2) - (height // 2)
    window.geometry(f'{width}x{height}+{x}+{y}')

    window.mainloop()

if __name__ == "__main__":
    create_notification_window(ord('m'))