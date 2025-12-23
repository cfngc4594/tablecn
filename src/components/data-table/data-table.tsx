import { flexRender, type Table as TanstackTable } from "@tanstack/react-table";
import * as React from "react";

import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getCommonPinningStyles } from "@/lib/data-table";
import { cn } from "@/lib/utils";
import type { Option } from "@/types/data-table";

interface DataTableProps<TData> extends React.ComponentProps<"div"> {
  table: TanstackTable<TData>;
  actionBar?: React.ReactNode;
  groupBy?: string;
}

export function DataTable<TData>({
  table,
  actionBar,
  children,
  className,
  groupBy,
  ...props
}: DataTableProps<TData>) {
  return (
    <div
      className={cn("flex w-full flex-col gap-2.5 overflow-auto", className)}
      {...props}
    >
      {children}
      {groupBy ? (
        <DataTableGrouped
          table={table}
          groupBy={groupBy}
          actionBar={actionBar}
        />
      ) : (
        <div className="overflow-hidden rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      colSpan={header.colSpan}
                      style={{
                        ...getCommonPinningStyles({ column: header.column }),
                      }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        style={{
                          ...getCommonPinningStyles({ column: cell.column }),
                        }}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={table.getAllColumns().length}
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        {groupBy ? (
          <div className="flex w-full flex-col-reverse items-center justify-between gap-4 overflow-auto p-1 sm:flex-row sm:gap-8">
            <div className="flex-1 whitespace-nowrap text-muted-foreground text-sm">
              {table.getFilteredSelectedRowModel().rows.length} of{" "}
              {table.getFilteredRowModel().rows.length} row(s) selected.
            </div>
            <div className="text-muted-foreground text-sm">
              Grouping is applied to current page only. Use filters to narrow
              down data.
            </div>
          </div>
        ) : (
          <DataTablePagination table={table} />
        )}
        {actionBar &&
          table.getFilteredSelectedRowModel().rows.length > 0 &&
          actionBar}
      </div>
    </div>
  );
}

// 分组表格组件
interface DataTableGroupedProps<TData> {
  table: TanstackTable<TData>;
  groupBy: string;
  actionBar?: React.ReactNode;
}

function DataTableGrouped<TData>({
  table,
  groupBy,
  actionBar,
}: DataTableGroupedProps<TData>) {
  const data = table.getCoreRowModel().rows.map((row) => row.original);
  const groupColumn = table.getColumn(groupBy);

  // 获取分组选项
  const groupOptions = React.useMemo(() => {
    const metaOptions = groupColumn?.columnDef.meta?.options as
      | Option[]
      | undefined;

    if (metaOptions) return metaOptions;

    // 从数据中推断唯一值
    const uniqueValues = [
      ...new Set(
        data.map((item: TData) => item[groupBy as keyof TData] as string),
      ),
    ];
    return uniqueValues.map((value) => ({
      label: value,
      value,
      icon: undefined,
    }));
  }, [groupColumn, data, groupBy]);

  // 折叠状态管理 - 确保所有值都是 boolean 类型
  const [collapsedStates, setCollapsedStates] = React.useState<
    Record<string, boolean>
  >(() => {
    return groupOptions.reduce(
      (acc, option) => {
        acc[option.value] = false; // 明确设置为 false
        return acc;
      },
      {} as Record<string, boolean>,
    );
  });

  const toggleCollapsed = (value: string) => {
    setCollapsedStates((prev) => ({
      ...prev,
      [value]: !prev[value],
    }));
  };

  // 检查是否有预定义选项
  const hasPredefinedOptions = !!groupColumn?.columnDef.meta?.options;

  return (
    <div className="space-y-4">
      {groupOptions.map((option) => {
        const groupData = data.filter(
          (item: TData) => item[groupBy as keyof TData] === option.value,
        );
        const isCollapsed = collapsedStates[option.value] ?? false; // 添加默认值

        // 如果是动态推断的值（没有预定义 meta.options），则隐藏空分组
        if (!hasPredefinedOptions && groupData.length === 0) {
          return null;
        }

        return (
          <DataTableGroupSection
            key={option.value}
            option={option}
            groupData={groupData}
            table={table}
            isCollapsed={isCollapsed}
            onToggleCollapse={() => toggleCollapsed(option.value)}
          />
        );
      })}
      {actionBar &&
        table.getFilteredSelectedRowModel().rows.length > 0 &&
        actionBar}
    </div>
  );
}

// 分组区域组件
interface DataTableGroupSectionProps<TData> {
  option: Option;
  groupData: TData[];
  table: TanstackTable<TData>;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

function DataTableGroupSection<TData>({
  option,
  groupData,
  table,
  isCollapsed,
  onToggleCollapse,
}: DataTableGroupSectionProps<TData>) {
  // 获取当前分组的所有行
  const groupRows = React.useMemo(() => {
    return groupData
      .map((item: TData) => {
        return table.getRowModel().rows.find((r) => r.original === item);
      })
      .filter(Boolean);
  }, [groupData, table]);

  // 检查当前分组的选中状态
  const isAllGroupRowsSelected =
    groupRows.length > 0 && groupRows.every((row) => row?.getIsSelected());
  const isSomeGroupRowsSelected = groupRows.some((row) => row?.getIsSelected());

  // 切换当前分组的所有行
  const toggleAllGroupRows = (checked: boolean) => {
    groupRows.forEach((row) => {
      row?.toggleSelected(checked);
    });
  };

  return (
    <div className="rounded-md border">
      <div
        role="button"
        tabIndex={0}
        aria-expanded={!isCollapsed}
        aria-controls={`group-content-${option.value}`}
        className="flex cursor-pointer items-center justify-between p-3 hover:bg-muted/50"
        onClick={onToggleCollapse}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggleCollapse();
          }
        }}
      >
        <div className="flex items-center gap-2">
          {option.icon && <option.icon className="h-4 w-4" />}
          <span className="font-medium">{option.label}</span>
          <span className="text-muted-foreground text-sm">
            ({groupData.length})
          </span>
        </div>
        <span className="text-muted-foreground">{isCollapsed ? "▶" : "▼"}</span>
      </div>

      {!isCollapsed && (
        <div id={`group-content-${option.value}`} className="border-t">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    // 为 select 列渲染自定义表头
                    if (header.column.id === "select") {
                      return (
                        <TableHead
                          key={header.id}
                          colSpan={header.colSpan}
                          style={{
                            ...getCommonPinningStyles({
                              column: header.column,
                            }),
                          }}
                        >
                          <Checkbox
                            aria-label="Select all in group"
                            className="translate-y-0.5"
                            checked={
                              isAllGroupRowsSelected ||
                              (isSomeGroupRowsSelected && "indeterminate")
                            }
                            onCheckedChange={(value) => {
                              toggleAllGroupRows(!!value);
                            }}
                          />
                        </TableHead>
                      );
                    }

                    // 其他列使用原有的渲染逻辑
                    return (
                      <TableHead
                        key={header.id}
                        colSpan={header.colSpan}
                        style={{
                          ...getCommonPinningStyles({ column: header.column }),
                        }}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {groupData.length > 0 ? (
                groupData.map((item: TData, index: number) => {
                  const row = table
                    .getRowModel()
                    .rows.find((r) => r.original === item);
                  if (!row) return null;

                  return (
                    <TableRow
                      key={`${option.value}-${index}`}
                      data-state={row.getIsSelected() && "selected"}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          style={{
                            ...getCommonPinningStyles({ column: cell.column }),
                          }}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={table.getAllColumns().length}
                    className="h-24 text-center"
                  >
                    No data in this group.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
