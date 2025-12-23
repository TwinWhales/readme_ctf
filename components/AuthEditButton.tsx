"use client"

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { PenLine } from 'lucide-react'

export default function AuthEditButton({ postId, authorId }: { postId: string, authorId: string }) {
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) setCurrentUserId(user.id)
        })
    }, [])

    if (currentUserId !== authorId) return null

    return (
        <Link href={`/edit/${postId}`} className="flex items-center space-x-1 text-gray-400 hover:text-blue-400 transition-colors">
            <PenLine className="h-4 w-4" />
            <span>Edit</span>
        </Link>
    )
}
