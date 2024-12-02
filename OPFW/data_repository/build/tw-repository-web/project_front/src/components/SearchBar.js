'use strict';

import React from "react";
import styled, { css } from "styled-components";
import SearchIcon from '@mui/icons-material/Search';

const SearchBarWrapper = styled.div`
    display: flex;
    align-items: center;
    height: 150px;
    
    ${props => 
            props.height &&
            css`
                height: ${props.height}
            `    
    }
`;

const SearchBarForm = styled.form`
    margin: 10px 2% 2% 2%;
    display: flex;
    flex: 1;
    justify-content: center;
`;

const SearchBarContainer = styled.div`
    width: 65%;
    border-radius: 5px;
    border: 1px solid #e5e9f2;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    padding: 5px 5px 5px 15px;
    outline: none;
    display: flex;
    align-items: center;
`

const SearchIconWrapper = styled(SearchIcon)`
    font-size: 2.2rem !important;
`;

const SearchBarInput = styled.input`
    flex: 1;
    border: none;
    outline: none;
    letter-spacing: 1px;
`;

const SearchBar = ({ searchTxt, placeholder, setSearchTxt, height, onSearchBarKeyDown }) => {
    return (
        <SearchBarWrapper height={height}>
            <SearchBarForm>
                <SearchBarContainer>
                    <SearchIconWrapper />
                    <SearchBarInput
                        placeholder={placeholder}
                        value={searchTxt}
                        onChange={e=>
                            setSearchTxt(e.target.value)
                        }
                        onKeyDown={onSearchBarKeyDown}
                    >
                    </SearchBarInput>
                </SearchBarContainer>
            </SearchBarForm>
        </SearchBarWrapper>
    )
}

export default SearchBar