# 파일 경로를 받아서 '\n' 단위로 파일을 읽은 결과를 담은 리스트를 반환
def get_lines_utf8(file_path):
    file = open(file_path, "r", encoding="utf-8")
    line_list = []
    for line in file:
        if line.endswith("\n"):
            line = line.replace('\n', "")
        line_list.append(line)
    file.close()
    return line_list


def get_lines_utf16(file_path):
    file = open(file_path, "r", encoding="utf-16")
    line_list = []
    for line in file:
        if line.endswith("\n"):
            line = line.replace('\n', "")
        line_list.append(line)
    file.close()
    return line_list
