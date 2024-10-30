package com.stoneitgt.dt.data.platform.domain;

import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

@Data
public class Board {
    //게시물 정보
    private int boardSeq;
    private String boardNm;
    private String boardSmpDerpn;
    private String boardDerpn;
    private String boardTp;

    //공유 여부
    private String rlsYn;
    //사용 여부
    private String useYn;
    //삭제 여부
    private String delYn;

    //등록자 정보
    private int regUserSeq;
    private String regDt;
    private String regIp;

    //수정자 정보
    private int mdfcnUserSeq;
    private String mdfcnDt;
    private String mdfcnIp;

    //삭제자 정보
    private int delUserSeq;
    private String delDt;
    private String delIp;

    //클라이언트로부터 업로드된 파일
    private MultipartFile file;
    //서버로부터 가지고 온 파일
    private Files files;
}
