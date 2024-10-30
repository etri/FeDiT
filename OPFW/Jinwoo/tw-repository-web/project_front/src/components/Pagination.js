'use strict';

import React from 'react';
import styled, { css } from "styled-components";

const PaginationBlock = styled.div`
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    margin-bottom: 1rem;
    margin-top: 20px;
`;
const PageButton = styled.button`
    border: 1px solid #dcdde1;
    border-radius: 4px;
    font-weight: bold;
    color: blue;
    outline: none;
    cursor: pointer;
    padding: 6px 12px;
    background: transparent;
    
    &:disabled {
        color: #868e96;
        cursor: not-allowed;
        opacity: 1 !important;
    }
    
    &:hover {
        opacity: 0.5;
    }

    ${props=> props.active &&
            css`
                background: #dcdde1;
                color: #868e96;
                opacity: 1 !important;
            `
    }
`;

const Pagination = ({ page, lastPage, setPage }) => {
    return (
        <PaginationBlock>
            <PageButton
                disabled={page === 0}
                onClick={() => setPage(prev => prev - 1)}
            >
                이전
            </PageButton>
            {
                [...Array(lastPage + 1).keys()].map(pageNum => (
                    <PageButton key={pageNum} active={page === pageNum} onClick={() => setPage(pageNum)}>{pageNum + 1}</PageButton>
                ))
            }
            <PageButton
                disabled={page === lastPage}
                onClick={() => setPage(prev => prev + 1)}
            >
                다음
            </PageButton>
        </PaginationBlock>
    )
}

export default Pagination