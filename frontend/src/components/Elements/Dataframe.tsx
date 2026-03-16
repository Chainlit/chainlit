import {
  Column,
  ColumnDef,
  ColumnFiltersState,
  ExpandedState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
} from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ChevronDown, Settings2, X } from 'lucide-react';
import React, { useCallback, useMemo, useState } from 'react';

import { IDataframeElement } from '@chainlit/react-client';

import Alert from '@/components/Alert';
import { Loader } from '@/components/Loader';
import { useTranslation } from '@/components/i18n/Translator';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from '@/components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
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

// Column filter component
function ColumnFilter({
  column
}: {
  column: Column<Record<string, string | number>>;
}) {
  const filterValue = column.getFilterValue() as string;
  const { t } = useTranslation();

  return (
    <Input
      placeholder={t('components.DataframeElement.filterPlaceholder')}
      value={filterValue || ''}
      onChange={(e) => column.setFilterValue(e.target.value)}
      className="h-8 w-full"
      onClick={(e) => e.stopPropagation()}
    />
  );
}

interface DataframeElementProps {
  data: DataframeData;
  showColumnVisibility?: boolean;
  showColumnFilters?: boolean;
}

const _DataframeElement = ({
  data,
  showColumnVisibility = true,
  showColumnFilters = true
}: DataframeElementProps) => {
  const { index, columns, data: rowData } = data;
  const { t } = useTranslation();

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10
  });

  const tableColumns: ColumnDef<Record<string, string | number>>[] = useMemo(
    () =>
      columns.map((col: string) => ({
        accessorKey: col,
        header: ({
          column
        }: {
          column: Column<Record<string, string | number>>;
        }) => {
          const sort = column.getIsSorted();
          return (
            <div className="flex flex-col gap-2">
              <div
                className="flex items-center cursor-pointer"
                onClick={() => column.toggleSorting()}
              >
                {col}
                {sort === 'asc' && <ArrowUp className="ml-2 !size-3" />}
                {sort === 'desc' && <ArrowDown className="ml-2 !size-3" />}
              </div>
              {showColumnFilters && <ColumnFilter column={column} />}
            </div>
          );
        },
        cell: ({ getValue }: { getValue: () => any }) => {
          const value = getValue();
          return String(value);
        },
        filterFn: (row, columnId, filterValue: string) => {
          const value = row.getValue(columnId);
          return String(value ?? '')
            .toLowerCase()
            .includes(filterValue.toLowerCase());
        }
      })),
    [columns, showColumnFilters]
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
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      expanded,
      pagination
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onExpandedChange: setExpanded,
    onPaginationChange: setPagination,
    getRowCanExpand: () => true,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel()
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
    <div className="flex flex-col gap-4 h-full dataframe">
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Column Visibility */}
        {showColumnVisibility && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                <Settings2 className="mr-2 !size-4" />
                {t('components.DataframeElement.columns')}
                <ChevronDown className="ml-2 !size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[200px]">
              <DropdownMenuCheckboxItem
                checked={table.getIsAllColumnsVisible()}
                onCheckedChange={(value) =>
                  table.toggleAllColumnsVisible(!!value)
                }
                onSelect={(e) => e.preventDefault()}
                className="font-medium"
              >
                {table.getIsAllColumnsVisible()
                  ? t('components.DataframeElement.deselectAll')
                  : t('components.DataframeElement.selectAll')}
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                      onSelect={(e) => e.preventDefault()}
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Page Size Selector */}
        <Select
          value={String(pagination.pageSize)}
          onValueChange={(value) => {
            table.setPageSize(Number(value));
          }}
        >
          <SelectTrigger className="h-8 w-[120px]">
            <SelectValue
              placeholder={t('components.DataframeElement.pageSizePlaceholder')}
            />
          </SelectTrigger>
          <SelectContent>
            {[5, 10, 20, 50].map((size) => (
              <SelectItem key={size} value={String(size)}>
                {t('components.DataframeElement.rowsPerPage', { count: size })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {columnFilters.length > 0 && showColumnFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setColumnFilters([])}
            className="h-8"
          >
            <X className="mr-2 !size-4" />
            {t('components.DataframeElement.clearFilters')}
          </Button>
        )}

        {/* Info */}
        <div className="ml-auto text-sm text-muted-foreground">
          {t('components.DataframeElement.rowsCount', {
            filtered: table.getFilteredRowModel().rows.length,
            total: tableRows.length
          })}
        </div>
      </div>

      {/* Table with horizontal scroll - always visible scrollbar */}
      <div className="rounded-md border overflow-auto h-full w-full">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="whitespace-nowrap p-4">
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
                <React.Fragment key={row.id}>
                  <TableRow
                    className="cursor-pointer hover:bg-muted/60"
                    data-state={row.getIsExpanded() ? 'selected' : undefined}
                    onClick={() => row.toggleExpanded()}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="whitespace-nowrap">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                  {row.getIsExpanded() && (
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableCell
                        colSpan={row.getVisibleCells().length}
                        className="p-4"
                      >
                        <dl className="grid grid-cols-[minmax(0,max-content)_minmax(0,1fr)] gap-x-6 gap-y-1 text-sm">
                          {table.getVisibleLeafColumns().map((col) => (
                            <React.Fragment key={col.id}>
                              <dt className="font-medium text-muted-foreground py-1 border-b">
                                {col.id}
                              </dt>
                              <dd className="break-words py-1 border-b">
                                {String(row.original[col.id] ?? '')}
                              </dd>
                            </React.Fragment>
                          ))}
                        </dl>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  {t('components.DataframeElement.noResults')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
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

interface DataframeElementComponentProps {
  element: IDataframeElement;
}

function DataframeElement({ element }: DataframeElementComponentProps) {
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

  return (
    <_DataframeElement
      data={jsonData}
      showColumnVisibility={element.showColumnVisibility}
      showColumnFilters={element.showColumnFilters}
    />
  );
}

export default DataframeElement;
