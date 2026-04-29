'use client'

import * as React from 'react'
import { CalendarIcon, ChevronDownIcon } from 'lucide-react'
import { type DateRange } from 'react-day-picker'

import { cn } from '../../lib/utils'
import { Button } from './button'
import { Calendar } from './calendar'
import { Popover, PopoverContent, PopoverTrigger } from './popover'

function formatRange(range: DateRange | undefined, locale = 'zh-CN') {
  if (!range?.from) return null
  if (!range.to) return range.from.toLocaleDateString(locale)
  return `${range.from.toLocaleDateString(locale)} – ${range.to.toLocaleDateString(locale)}`
}

export type DateRangePickerProps = {
  className?: string
  /** 受控区间；未选时可为 undefined */
  date?: DateRange
  onDateChange?: (range: DateRange | undefined) => void
  disabled?: boolean
  placeholder?: string
  align?: React.ComponentProps<typeof PopoverContent>['align']
  /** 范围选择默认展示双月，便于排课跨月 */
  numberOfMonths?: number
}

/**
 * 日期区间选择：Popover + Calendar（range 模式），适用于实验排课、统计时间窗。
 */
function DateRangePicker({
  className,
  date,
  onDateChange,
  disabled,
  placeholder = '选择日期范围',
  align = 'center',
  numberOfMonths = 2,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false)
  const label = formatRange(date) ?? placeholder

  return (
    <div className={cn('grid gap-2', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn(
              'w-full justify-between text-left font-normal md:w-[min(100%,320px)]',
              !date?.from && 'text-muted-foreground',
            )}
            aria-expanded={open}
          >
            <span className="inline-flex items-center gap-2 truncate">
              <CalendarIcon className="size-4 shrink-0 opacity-70" />
              <span className="truncate">{label}</span>
            </span>
            <ChevronDownIcon className="size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align={align}>
          <Calendar
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={(range) => {
              onDateChange?.(range)
              if (range?.from && range?.to) {
                setOpen(false)
              }
            }}
            numberOfMonths={numberOfMonths}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

export { DateRangePicker }
