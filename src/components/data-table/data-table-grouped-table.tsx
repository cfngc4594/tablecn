"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ChevronDown, ChevronUp } from "lucide-react";
import * as React from "react";
import { DataTable } from "@/components/data-table/data-table";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useDataTable } from "@/hooks/use-data-table";
import type { Option } from "@/types/data-table";
import { Badge } from "../ui/badge";

interface DataTableGroupedTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData>[];
  groupBy: Extract<keyof TData, string>;
  pageCount?: number;
}

export function DataTableGroupedTable<TData>({
  data,
  columns,
  groupBy,
  pageCount = -1,
}: DataTableGroupedTableProps<TData>) {
  // 获取分组列的配置
  const groupColumn = React.useMemo(
    () => columns.find((col) => col.id === groupBy),
    [columns, groupBy],
  );

  // 从 meta.options 获取分组选项
  const groupOptions = React.useMemo(() => {
    const metaOptions = groupColumn?.meta?.options as Option[] | undefined;
    if (metaOptions) return metaOptions;

    // 从数据中推断唯一值，创建完整的Option对象
    const uniqueValues = [
      ...new Set(data.map((item) => item[groupBy] as string)),
    ];
    return uniqueValues.map((value) => ({
      label: value,
      value,
      icon: undefined, // 明确添加icon属性，符合Option接口
    }));
  }, [groupColumn, data, groupBy]);

  // 计算每个分组的数量
  const groupCounts = React.useMemo(() => {
    return groupOptions.reduce(
      (acc, option) => {
        acc[option.value] = data.filter(
          (item) => item[groupBy] === option.value,
        ).length;
        return acc;
      },
      {} as Record<string, number>,
    );
  }, [groupOptions, data, groupBy]);

  // 折叠状态管理
  const [collapsedStates, setCollapsedStates] = React.useState<
    Record<string, boolean>
  >(() => {
    return groupOptions.reduce(
      (acc, option) => {
        acc[option.value] = false; // 默认全部展开
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

  return (
    <div className="space-y-4">
      {groupOptions.map((option) => {
        const groupData = data.filter((item) => item[groupBy] === option.value);
        const isCollapsed = collapsedStates[option.value];

        return (
          <Collapsible
            key={option.value}
            open={!isCollapsed}
            onOpenChange={() => toggleCollapsed(option.value)}
          >
            <CollapsibleTrigger asChild>
              <Button
                variant="outline"
                className="h-auto w-full justify-between px-4 py-3"
              >
                <div className="flex items-center gap-2">
                  {option.icon && <option.icon className="h-4 w-4" />}
                  <span className="font-medium">{option.label}</span>
                  <Badge variant="secondary" className="ml-2">
                    {groupCounts[option.value]}
                  </Badge>
                </div>
                {isCollapsed ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronUp className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2">
              <GroupedDataTable
                data={groupData}
                columns={columns}
                pageCount={pageCount}
              />
            </CollapsibleContent>
          </Collapsible>
        );
      })}
    </div>
  );
}

function GroupedDataTable<TData>({
  data,
  columns,
  pageCount,
}: {
  data: TData[];
  columns: ColumnDef<TData>[];
  pageCount: number;
}) {
  const { table } = useDataTable({
    data,
    columns,
    pageCount,
  });

  return (
    <div className="rounded-md border">
      <DataTable table={table} />
    </div>
  );
}
