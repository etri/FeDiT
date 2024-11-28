'use strict';

export default class Global{
    static getDatatableCommonOption() {
        return {
            searching : false
            ,paging: true
            ,responsive: true
            ,language: lang_kor
            ,processing: true
            ,serverSide: true
            ,order : []
            ,scrollX: "100%"
        };
    }

    static getDatatableSimpleOption() {
        return {
            searching : false
            ,paging: false
            ,bPaginate: false
            ,language: lang_kor
            ,order : []
        };
    }

    static isSameDate = (date1, date2) => {
        return date1.getFullYear() === date2.getFullYear()
            && date1.getMonth() === date2.getMonth()
            && date1.getDate() === date2.getDate();
    }

    static isNotEmpty(str){
        if (str == null || str == undefined) return false;
        try {
            let len = str.trim().length;
            if (len == 0) return false;
        } catch (e) {
        }

        return true;
    }

    static isValidId(value){
        if(null == value || undefined == value)
            return false;
        return true;
    }

    static getFetchOption(params) {
        let options = {
            method: 'POST',
            headers: {
                'Accept': 'application/json, text/plain, */*',
                'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
            },
            body: params
        };
        return options;
    }

    static getFetchOptionPostRequestParam(params) {
        let options = {
            method: 'POST',
            headers: {
                'Accept': 'application/json, text/plain, */*',
                'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
            },
            body: params
        };
        return options;
    }

    static hasSystemRole(){
        return window.userRole==='ROLE_SYSTEM';
    }
}