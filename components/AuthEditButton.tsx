"use client"

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { PenLine, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function AuthEditButton({ postId, authorId }: { postId: string, authorId: string }) {
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)
    const router = useRouter()

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) setCurrentUserId(user.id)
        })
    }, [])

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this writeup? This action cannot be undone.')) return

        const { error } = await supabase
            .from('posts')
            .delete()
            .eq('id', postId)
            .eq('author_id', authorId) // Double check author

        if (error) {
            alert('Failed to delete post: ' + error.message)
        } else {
            router.push('/')
            router.refresh()
        }
    }

    if (currentUserId !== authorId) return null

    return (
        <div className="flex items-center space-x-4">
            <Link href={`/edit/${postId}`} className="flex items-center space-x-1 text-gray-400 hover:text-blue-400 transition-colors">
                <PenLine className="h-4 w-4" />
                <span>Edit</span>
            </Link>
            <button 
                onClick={handleDelete}
                className="flex items-center space-x-1 text-gray-400 hover:text-red-400 transition-colors"
                title="Delete Post"
            >
                <Trash2 className="h-4 w-4" />
                <span>Delete</span>
            </button>
        </div>
    )
}
