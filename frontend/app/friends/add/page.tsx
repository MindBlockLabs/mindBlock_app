'use client'

import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AddFriendsPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6 text-white hover:bg-slate-800"
        >
          <ChevronLeft className="h-5 w-5 mr-2" />
          Back
        </Button>

        <h1 className="text-2xl font-bold text-white mb-6">Add Friends</h1>
        <p className="text-slate-400">Find and add friends to your network.</p>
      </div>
    </div>
  )
}
