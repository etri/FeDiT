import type { ReactNode } from 'react';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@e8ight/ui/components/ui/table';

interface DefinitionTableRow {
  rowId: string;
  cells: Array<string | ReactNode>;
}

interface DefinitionTableProps {
  columnTitles: string[];
  tableRows: DefinitionTableRow[];
}

function DefinitionTable({ columnTitles, tableRows }: DefinitionTableProps) {
  return (
    <Table className="border-border bg-card rounded-md border">
      <TableHeader>
        <TableRow className="bg-muted hover:bg-muted">
          {columnTitles.map((title) => (
            <TableHead
              key={title}
              className="text-foreground px-4 py-3 font-bold"
            >
              {title}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {tableRows.map((row) => (
          <TableRow
            key={row.rowId}
            className="odd:bg-card even:bg-muted/30 hover:bg-muted/50"
          >
            {row.cells.map((cell, index) => (
              <TableCell
                key={`${row.rowId}-${columnTitles[index] ?? index}`}
                className="text-foreground px-4 py-3 wrap-anywhere whitespace-normal"
              >
                {cell}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default DefinitionTable;
