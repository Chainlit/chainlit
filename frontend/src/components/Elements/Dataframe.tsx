import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
} from '@tanstack/react-table';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { useCallback, useMemo } from 'react';

import { IDataframeElement } from '@chainlit/react-client';

import Alert from '@/components/Alert';
import { Loader } from '@/components/Loader';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from '@/components/ui/pagination';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';

import { useFetch } from 'hooks/useFetch';

interface DataframeData {
  index: (string | number)[];
  columns: string[];
  data: (string | number)[][];
}

const _DataframeElement = ({ data }: { data: DataframeData }) => {
  const { index, columns, data: rowData } = data;

  const tableColumns: ColumnDef<Record<string, string | number>>[] = useMemo(
    () =>
      columns.map((col: string) => ({
        accessorKey: col,
        header: ({ column }) => {
          const sort = column.getIsSorted();
          return (
            <div
              className="flex items-center cursor-pointer"
              onClick={() => column.toggleSorting()}
            >
              {col}
              {sort === 'asc' && <ArrowUp className="ml-2 !size-3" />}
              {sort === 'desc' && <ArrowDown className="ml-2 !size-3" />}
            </div>
          );
        }
      })),
    [columns]
  );

  const tableRows = useMemo(
    () =>
      rowData.map((row, idx) => {
        const rowObj: Record<string, string | number> = { id: index[idx] };
        columns.forEach((col, colIdx) => {
          rowObj[col] = row[colIdx];
        });
        return rowObj;
      }),
    [rowData, columns, index]
  );

  const table = useReactTable({
    data: tableRows,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      pagination: { pageSize: 10 }
    }
  });

  const renderPaginationItems = useCallback(() => {
    return Array.from({ length: table.getPageCount() }, (_, i) => (
      <PaginationItem key={i}>
        <PaginationLink
          onClick={() => table.setPageIndex(i)}
          isActive={table.getState().pagination.pageIndex === i}
        >
          {i + 1}
        </PaginationLink>
      </PaginationItem>
    ));
  }, [table.getPageCount(), table.getState().pagination.pageIndex]);

  return (
    <div className="flex flex-col gap-2 h-full overflow-y-auto dataframe">
      <div className="rounded-md border overflow-y-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <Pagination>
        <PaginationContent className="ml-auto">
          <PaginationItem>
            <PaginationPrevious
              onClick={() => table.previousPage()}
              className={
                !table.getCanPreviousPage()
                  ? 'pointer-events-none opacity-50'
                  : 'cursor-pointer'
              }
            />
          </PaginationItem>
          {renderPaginationItems()}
          <PaginationItem>
            <PaginationNext
              onClick={() => table.nextPage()}
              className={
                !table.getCanNextPage()
                  ? 'pointer-events-none opacity-50'
                  : 'cursor-pointer'
              }
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
};

function DataframeElement({ element }: { element: IDataframeElement }) {
  const { data, isLoading, error } = useFetch(element.url || null);

  const jsonData = useMemo(() => {
    if (data) return JSON.parse(data);
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-muted">
        <Loader />
      </div>
    );
  }

  if (error) {
    return <Alert variant="error">{error.message}</Alert>;
  }

  return <_DataframeElement data={jsonData} />;
}

export default DataframeElement;
