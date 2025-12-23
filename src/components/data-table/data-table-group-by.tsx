"use client";

import type { Table } from "@tanstack/react-table";
import { Check, Group } from "lucide-react";
import { useQueryState } from "nuqs";
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DataTableGroupByProps<TData> {
  table: Table<TData>;
  disabled?: boolean;
}

export function DataTableGroupBy<TData>({
  table,
  disabled,
}: DataTableGroupByProps<TData>) {
  const [open, setOpen] = React.useState(false);

  // 获取可分组的列
  const groupableColumns = React.useMemo(() => {
    return table
      .getAllColumns()
      .filter((column) => column.columnDef.meta?.enableGroupBy);
  }, [table]);

  // 使用 URL 状态管理分组列
  const [groupBy, setGroupBy] = useQueryState(
    table.options.meta?.queryKeys?.groupBy ?? "groupBy",
    {
      defaultValue: "",
      clearOnDefault: true,
      shallow: true,
    },
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          aria-label="Group by column"
          role="combobox"
          variant="outline"
          size="sm"
          className="font-normal"
          disabled={disabled || groupableColumns.length === 0}
        >
          <Group className="text-muted-foreground" />
          Group by
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-44 p-0" align="start">
        <Command>
          <CommandInput placeholder="Search columns..." />
          <CommandList>
            <CommandEmpty>No groupable columns found.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value=""
                onSelect={() => {
                  setGroupBy("");
                  setOpen(false);
                }}
              >
                <span className="truncate">None</span>
                <Check
                  className={cn(
                    "ml-auto size-4 shrink-0",
                    !groupBy ? "opacity-100" : "opacity-0",
                  )}
                />
              </CommandItem>
              {groupableColumns.map((column) => (
                <CommandItem
                  key={column.id}
                  value={column.id}
                  onSelect={() => {
                    setGroupBy(column.id);
                    setOpen(false);
                  }}
                >
                  <span className="truncate">
                    {column.columnDef.meta?.label ?? column.id}
                  </span>
                  <Check
                    className={cn(
                      "ml-auto size-4 shrink-0",
                      column.id === groupBy ? "opacity-100" : "opacity-0",
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
