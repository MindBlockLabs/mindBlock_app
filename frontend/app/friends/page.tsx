'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Flame, Plus, X } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FriendListItem } from '@/components/friend-list-item'
import { StreakCalendar } from '@/components/streak-calendar'
import Button from '@/components/Button'


// Mocked data for Following and Followers
const mockFollowing = [
  { id: '1', username: 'Aaron', avatar: '', avatarFallback: 'A' },
  { id: '2', username: 'Jordan', avatar: '', avatarFallback: 'J' },
  { id: '3', username: 'Casey', avatar: '', avatarFallback: 'C' },
  { id: '4', username: 'Morgan', avatar: '', avatarFallback: 'M' },
]

const mockFollowers = [
  { id: '1', username: 'Alex', avatar: '', avatarFallback: 'A' },
  { id: '2', username: 'Taylor', avatar: '', avatarFallback: 'T' },
  { id: '3', username: 'Riley', avatar: '', avatarFallback: 'R' },
]

export default function FriendsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('following')

  const handleAddFriends = () => {
    router.push('/friends/add')
  }

  const handleFriendClick = (username: string) => {
    // Navigate to friend profile or handle friend interaction
    console.log('Clicked friend:', username)
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Close Button - Top Right */}
      <div className="fixed top-4 right-4 z-50">
        <button className="p-2 hover:bg-slate-800 rounded transition-colors">
          <X className="h-6 w-6 text-white" />
        </button>
      </div>

      {/* Main Content */}
      <div className="max-w-md mx-auto px-4 py-6">
        {/* Header with Streak */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-slate-400 text-sm mb-1">0 day streak!</p>
            <h1 className="text-3xl font-bold text-white">Streak</h1>
          </div>
          <Flame className="h-20 w-20 text-yellow-400" />
        </div>

        {/* Streak Calendar */}
        <div className="bg-slate-800 rounded-lg p-4 mb-8 border border-slate-700">
          <StreakCalendar />
        </div>

        {/* Share Your Streak Section */}
        <div className="mb-8">
          <div className="text-center mb-4">
            <div className="bg-yellow-400 text-slate-900 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3 font-bold text-lg">
              4
            </div>
            <p className="text-white font-semibold mb-1">I'm on a</p>
            <p className="text-white text-lg font-bold">4 day streak!</p>
            <p className="text-slate-400 text-xs mt-2">mind block</p>
          </div>

          <div className="flex gap-4 justify-center mt-6">
            <button className="flex flex-col items-center gap-1 text-slate-400 hover:text-white transition-colors">
              <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center">
                📱
              </div>
              <span className="text-xs">Contacts</span>
            </button>
            <button className="flex flex-col items-center gap-1 text-slate-400 hover:text-white transition-colors">
              <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center">
                ✈️
              </div>
              <span className="text-xs">Telegram</span>
            </button>
            <button className="flex flex-col items-center gap-1 text-slate-400 hover:text-white transition-colors">
              <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center">
                𝕏
              </div>
              <span className="text-xs">Twitter</span>
            </button>
            <button className="flex flex-col items-center gap-1 text-slate-400 hover:text-white transition-colors">
              <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center">
                💬
              </div>
              <span className="text-xs">Whatsapp</span>
            </button>
            <button className="flex flex-col items-center gap-1 text-slate-400 hover:text-white transition-colors">
              <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center">
                ⋮
              </div>
              <span className="text-xs">More</span>
            </button>
          </div>
        </div>

        {/* Tabs and Friends List */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-slate-800 mb-6">
            <TabsTrigger value="following" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Following</TabsTrigger>
            <TabsTrigger value="followers" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Followers</TabsTrigger>
          </TabsList>

          <TabsContent value="following" className="mt-0">
            <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
              {mockFollowing.map((friend) => (
                <FriendListItem
                  key={friend.id}
                  username={friend.username}
                  avatar={friend.avatar}
                  avatarFallback={friend.avatarFallback}
                  onClick={() => handleFriendClick(friend.username)}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="followers" className="mt-0">
            <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
              {mockFollowers.map((friend) => (
                <FriendListItem
                  key={friend.id}
                  username={friend.username}
                  avatar={friend.avatar}
                  avatarFallback={friend.avatarFallback}
                  onClick={() => handleFriendClick(friend.username)}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Add Friends Action */}
        <div className="mt-6">
          <Button
            onClick={handleAddFriends}
            variant="outline"
            className="w-full text-blue-400 border-blue-700 hover:bg-slate-700 bg-transparent"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Friends +
          </Button>
        </div>
      </div>
    </div>
  )
}
