export default class CimGlobal {
    static getErrorMsg(response_reason){
        if(response_reason === "11"){
            return "필수항목누락";
        }
        else if(response_reason === "12"){
            return "파라미터 오류";
        }
        else if(response_reason === "13"){
            return "충전소(기)ID 오류";
        }
        else if(response_reason === "14"){
            return "데이터 형식 오류";
        }
        else if(response_reason === "15"){
            return "서버 내부오류";
        }

        return "알 수 없는 오류";
    }
}