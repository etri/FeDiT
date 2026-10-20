"""풍향 각도의 방위 이름 변환"""

COMPASS = (
    "북",
    "북동",
    "동",
    "남동",
    "남",
    "남서",
    "서",
    "북서",
)


def compass(direction):
    return f"{COMPASS[round(direction / 45) % 8]}풍"
