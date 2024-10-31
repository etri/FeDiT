'use strict';

import React from 'react';

import SysModal from './SysModal.js'
import Global from "../modules/Global";

SysModalFindAddress.CONST = {
    BOTTOM_PAGE_COUNT: 5,
    COUNT_PER_PAGE: 10
}

function SysModalFindAddress({isOpened, onClose, onClickAddress}) {
    const [loading, setLoading] = React.useState(false);
    const [data, setData] = React.useState([]);
    const [totalCount, setTotalCount] = React.useState(0);
    const [currPage, setCurrPage] = React.useState(0);
    const [totalPage, setTotalPage] = React.useState(0);

    const [startPage, setStartPage] = React.useState(0);
    const [endPage, setEndPage] = React.useState(0);

    const [searchText, setSearchText] = React.useState("");


    const initialize = () => {
        setLoading(true);
        setData([]);
        setTotalCount(0);
        setCurrPage(0);
        setTotalPage(0);
        setStartPage(0);
        setEndPage(0);
        setSearchText("");
    }

    const onSearch = () => {
        fetchAddress(1);
    }

    const onKeyDown = (event) => {
        if(event.keyCode===13) {
            onSearch();
            event.preventDefault();
        }
    }
    const onChangeSearchText = (event) => {
        setSearchText(event.target.value);
    }

    const fetchAddress = (targetPage) => {
        // setLoading(true);
        $.ajax({
            url : "https://business.juso.go.kr/addrlink/addrLinkApiJsonp.do"
            ,type:"post"
            ,data:{
                confmKey: "U01TX0FVVEgyMDIzMDExOTE3MTQ1OTExMzQ0NjM=",
                currentPage: targetPage,
                countPerPage: SysModalFindAddress.CONST.COUNT_PER_PAGE,
                resultType: "json",
                keyword: searchText
            }
            ,dataType: "jsonp"
            ,crossDomain:true
            ,success:function(jsonStr){
                let errCode = jsonStr.results.common.errorCode;
                let errDesc = jsonStr.results.common.errorMessage;
                if(errCode !== "0"){
                    alert(errCode+"="+errDesc);
                }else{
                    if(jsonStr != null){
                        let totalCount = Number(jsonStr.results.common.totalCount);
                        let currentPage = Number(jsonStr.results.common.currentPage);
                        calcPagination(totalCount, currentPage);
                        setData(jsonStr.results.juso);
                        setLoading(false);
                    }
                }
            }
            ,error: function(xhr,status, error){
                alert("에러발생");
            }
        })
    }

    const calcPagination = (totalCount, currentPage) => {
        let totalPage = Math.ceil(totalCount/SysModalFindAddress.CONST.COUNT_PER_PAGE);
        let bottomPagesHalf = Math.floor(SysModalFindAddress.CONST.BOTTOM_PAGE_COUNT/2);

        let currStartPage = currentPage-bottomPagesHalf;
        currStartPage = currStartPage<1?1:currStartPage;
        let currEndPage = currentPage+bottomPagesHalf;
        currEndPage =  currEndPage>totalPage?totalPage: currEndPage;

        setStartPage(currStartPage);
        setEndPage(currEndPage);
        setCurrPage(currentPage);
        setTotalCount(totalCount);
        setTotalPage(totalPage);
    }

    const clickPagination = (clickPage) => {
        fetchAddress(Number(clickPage));
    }

    const onClickPage = (event) => {
        let clickPage = event.target.getAttribute('data-value');
        clickPagination(clickPage);
    }

    const onClickPrev = (data) => {
        let targetPage = currPage-1;
        if(targetPage<=0){
            alert("이전 페이지가 없습니다.");
            return;
        }
        clickPagination(targetPage);
    }

    const onClickNext = (data) => {
        let targetPage = currPage+1;
        if(targetPage>endPage){
            alert("다음 페이지가 없습니다.");
            return;
        }
        clickPagination(targetPage);
    }

    const onClickCloseThis = () => {
        onClose();
        initialize();
    }

    const onClickTableItem = (event) => {
        let zipcode = event.target.getAttribute('data-zipcode');
        let address1 = event.target.getAttribute('data-address1');
        let address2 = event.target.getAttribute('data-address2');
        onClickAddress(zipcode, address1, address2);

        onClickCloseThis();
    }

    const makePagination = () => {
        let content = [];

        for(let i=startPage; i<=endPage; i++){
            if(i===currPage){
                content.push(<li className="page-item active">
                                <a className="page-link" href="#" onClick={onClickPage} data-value={i}>{i}<span className="sr-only">(current)</span></a>
                            </li>);
            }else{
                content.push(<li className="page-item"><a className="page-link" href="#" onClick={onClickPage} data-value={i}>{i}</a></li>);
            }
        }

        return content;
    };

    const getSearchResult = () => {
        if(loading){
            return null;
        }

        if(data.length <= 0){
            return <tr><tr>검색 결과가 없습니다.</tr></tr>
        }

        return data.map( (item) => (
                <tr key={item.bdMgtSn}><td><a href="#" onClick={onClickTableItem} data-zipcode={item.zipNo} data-address1={item.roadAddrPart1} data-address2={item.roadAddrPart2}>{item.roadAddr}</a></td></tr>
            ));
    }

    return (
        <SysModal ownClassName={"find-address-modal"} isOpened={ isOpened } onClose={ onClickCloseThis } title={"주소검색"}
                  footerBeforeCloseButton={<button type="button" className="btn btn-outline-primary" onClick={onSearch}>검색</button>}>

            <form>
                <div className="input-group">
                    <input type="text" className="form-control" placeholder="Search" onKeyDown={onKeyDown} onChange={onChangeSearchText} value={searchText}/>
                    <div className="input-group-btn">
                        <button className="btn btn-default" type="submit" onClick={onSearch}>
                            <i className="glyphicon glyphicon-search"></i>
                        </button>
                    </div>
                </div>

                <table className="table table-hover">
                    <tbody>
                        {getSearchResult()}
                    </tbody>
                </table>
                <nav aria-label="pagination" style={{display:"flex", justifyContent:"center"}}>
                    <ul className="pagination">
                        <li className={"page-item " + (currPage>1?"":"disabled")}>
                            <a className="page-link" href="#" tabIndex="-1" onClick={onClickPrev}>Previous</a>
                        </li>
                        {makePagination()}
                        <li className={"page-item " + (currPage<totalPage?"":"disabled")}>
                            <a className="page-link" href="#" onClick={onClickNext}>Next</a>
                        </li>
                    </ul>
                </nav>
            </form>
        </SysModal>
    );
}

export default SysModalFindAddress;