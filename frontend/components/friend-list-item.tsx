'use client'

import { ChevronRight } from 'lucide-react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

interface FriendListItemProps {
  avatar?: string
  avatarFallback?: string
  username: string
  onClick?: () => void
  className?: string
}

export function FriendListItem({
  avatar,
  avatarFallback = '?',
  username,
  onClick,
  className,
}: FriendListItemProps) {
  return (
    <div>
      <button
        onClick={onClick}
        className={cn(
          'w-full flex items-center justify-between px-4 py-3 hover:bg-slate-700 transition-colors',
          className
        )}
      >
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            {avatar && <AvatarImage src={avatar || "/placeholder.svg"} alt={username} />}
            <AvatarFallback className="bg-slate-700 text-white">{avatarFallback}</AvatarFallback>
          </Avatar>
          <span className="font-medium text-white">{username}</span>
        </div>
        <ChevronRight className="h-5 w-5 text-slate-500" />
      </button>
      <div className="border-b border-slate-700" />
    </div>
  )
}
