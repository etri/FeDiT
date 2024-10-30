import React from "react";
import styled from "styled-components";

const Table = styled.table`
    border: 0.5px solid #e0e0e0;
    width: 100%;
`;
const TBody = styled.tbody`
    display: flex;
    flex-direction: column;
`;
const Tr = styled.tr`
    display: flex;
    
    &:last-child {
        Th {
            border-bottom: none !important;
        }
        Td {
            border-bottom: none !important;
        }
    }
`;
const Th = styled.th`
    display: table-cell;
    width: 200px;
    padding: 11px 12px;
    color: #333;
    font-weight: 700;
    text-align: left;
    border: none;
    background-color: #f8f6f1;
    border-bottom: 0.5px solid #e0e0e0 !important;
`;
const Td = styled.td`
    padding: 11px 12px;
    background: white;
    border: none;
    flex: 1;
    border-bottom: 0.5px solid #e0e0e0 !important;
`;

const DataDetailTable = ({ tableStructure, data }) => {

    return (
        <Table>
            <TBody>
                {tableStructure.map((structure) => (
                    <Tr>
                        {structure.map(ruct => (
                            <>
                                <Th>{ruct.name}</Th>
                                <Td>{ruct.value ? ruct.value : data && data[ruct.type]}</Td>
                            </>))
                        }
                    </Tr>
                ))}
            </TBody>
        </Table>
    )
}

export default DataDetailTable;