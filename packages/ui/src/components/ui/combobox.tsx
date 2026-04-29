'use client'

import * as React from 'react'
import { CheckIcon, ChevronDownIcon } from 'lucide-react'

import { cn } from '../../lib/utils'
import { Button } from './button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from './command'
import { Popover, PopoverContent, PopoverTrigger } from './popover'

export type ComboboxOption = {
  value: string
  label: string
  /** 可选：用于 CommandGroup heading */
  group?: string
}

export type ComboboxProps = {
  options: ComboboxOption[]
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  disabled?: boolean
  className?: string
  triggerClassName?: string
  /**
   * 允许使用搜索词创建新值（用于标准化字典的“先搜后增”场景）。
   */
  allowCustomValue?: boolean
  customValuePrefix?: string
  onCreateOption?: (value: string) => void
  normalizeCustomValue?: (value: string) => string
}

/**
 * 搜索式下拉选择：Popover + Command，适用于课题/班级等可检索选项。
 */
function Combobox({
  options,
  value,
  onValueChange,
  placeholder = '请选择…',
  searchPlaceholder = '搜索…',
  emptyText = '无匹配项',
  disabled,
  className,
  triggerClassName,
  allowCustomValue = false,
  customValuePrefix = '新增：',
  onCreateOption,
  normalizeCustomValue,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState('')
  const selected = options.find((o) => o.value === value)
  const normalizedQuery = React.useMemo(() => {
    const base = normalizeCustomValue ? normalizeCustomValue(query) : query.trim()
    return base
  }, [normalizeCustomValue, query])
  const hasExactOption = React.useMemo(
    () =>
      options.some(
        (opt) =>
          opt.value === normalizedQuery ||
          opt.label === normalizedQuery ||
          opt.value.toLowerCase() === normalizedQuery.toLowerCase() ||
          opt.label.toLowerCase() === normalizedQuery.toLowerCase(),
      ),
    [normalizedQuery, options],
  )
  const canCreate = allowCustomValue && normalizedQuery.length > 0 && !hasExactOption

  const grouped = React.useMemo(() => {
    const map = new Map<string, ComboboxOption[]>()
    for (const opt of options) {
      const g = opt.group ?? ''
      if (!map.has(g)) map.set(g, [])
      map.get(g)!.push(opt)
    }
    return map
  }, [options])

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (!nextOpen) setQuery('')
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn('w-full justify-between font-normal', triggerClassName, className)}
        >
          <span className={cn('truncate', !value && 'text-muted-foreground')}>
            {selected?.label ?? placeholder}
          </span>
          <ChevronDownIcon className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="z-[250] w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder={searchPlaceholder}
          />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            {canCreate ? (
              <CommandGroup heading="新增输入">
                <CommandItem
                  value={normalizedQuery}
                  onSelect={() => {
                    onValueChange?.(normalizedQuery)
                    onCreateOption?.(normalizedQuery)
                    setOpen(false)
                    setQuery('')
                  }}
                >
                  <CheckIcon className="mr-2 size-4 opacity-0" />
                  {customValuePrefix} {normalizedQuery}
                </CommandItem>
              </CommandGroup>
            ) : null}
            {[...grouped.entries()].map(([groupName, items]) => (
              <CommandGroup key={groupName || 'default'} heading={groupName || undefined}>
                {items.map((opt) => (
                  <CommandItem
                    key={opt.value}
                    value={`${opt.label} ${opt.value}`}
                    onSelect={() => {
                      onValueChange?.(opt.value)
                      setOpen(false)
                      setQuery('')
                    }}
                  >
                    <CheckIcon
                      className={cn(
                        'mr-2 size-4',
                        value === opt.value ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                    {opt.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export { Combobox }
