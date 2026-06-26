import type * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export interface DataTableColumn<TData> {
  key: keyof TData;
  header: string;
  render?: (value: TData[keyof TData], row: TData) => React.ReactNode;
}

interface DataTableProps<TData extends Record<string, unknown>> {
  columns: ReadonlyArray<DataTableColumn<TData>>;
  rows: ReadonlyArray<TData>;
}

export function DataTable<TData extends Record<string, unknown>>({
  columns,
  rows,
}: DataTableProps<TData>): React.JSX.Element {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((column) => (
            <TableHead key={String(column.key)}>{column.header}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row, index) => (
          <TableRow key={index}>
            {columns.map((column) => {
              const value = row[column.key];
              return (
                <TableCell key={String(column.key)}>
                  {column.render ? column.render(value, row) : String(value ?? '')}
                </TableCell>
              );
            })}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
