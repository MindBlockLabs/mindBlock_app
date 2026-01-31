'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const DAYS_OF_WEEK = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']

interface StreakCalendarProps {
  streakDays?: number[]
}

export function StreakCalendar({ streakDays = [4, 5, 6, 7, 12, 13, 14, 15, 16, 17, 18, 20, 21, 25, 26, 27] }: StreakCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date(2022, 7, 1)) // August 2022

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const monthName = currentDate.toLocaleString('default', { month: 'short' }).toUpperCase()
  const year = currentDate.getFullYear()
  const daysInMonth = getDaysInMonth(currentDate)
  const firstDay = getFirstDayOfMonth(currentDate)

  // Create array of day numbers, accounting for empty cells at start
  const calendarDays = []
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null)
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i)
  }

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const isStreakDay = (day: number | null) => {
    return day !== null && streakDays.includes(day)
  }

  return (
    <div className="w-full">
      <h3 className="text-sm font-semibold text-white mb-4">Streak Calendar</h3>
      
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handlePreviousMonth}
          className="p-2 hover:bg-slate-700 rounded transition-colors"
        >
          <ChevronLeft className="h-5 w-5 text-slate-400" />
        </button>
        
        <div className="text-sm font-medium text-white">
          {monthName} {year}
        </div>
        
        <button
          onClick={handleNextMonth}
          className="p-2 hover:bg-slate-700 rounded transition-colors"
        >
          <ChevronRight className="h-5 w-5 text-slate-400" />
        </button>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-2 mb-3">
        {DAYS_OF_WEEK.map((day) => (
          <div key={day} className="text-center text-xs font-medium text-slate-500 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {calendarDays.map((day, index) => (
          <div key={index} className="aspect-square flex items-center justify-center">
            {day === null ? (
              <div className="w-8 h-8" />
            ) : (
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                  isStreakDay(day)
                    ? 'bg-yellow-400 text-slate-900'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {day}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
