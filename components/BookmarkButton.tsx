"use client"

import { useState, useEffect } from "react"
import { Bookmark } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"

interface BookmarkButtonProps {
    postId: string
    userId: string | null
    initialIsBookmarked: boolean
}

export default function BookmarkButton({ postId, userId, initialIsBookmarked }: BookmarkButtonProps) {
    const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked)
    const [isLoading, setIsLoading] = useState(false)

    const handleBookmark = async () => {
        if (!userId) return
        if (isLoading) return

        setIsLoading(true)

        // Optimistic update
        const previousIsBookmarked = isBookmarked
        setIsBookmarked(prev => !prev)

        try {
            if (previousIsBookmarked) {
                // Remove bookmark
                const { error } = await supabase
                    .from('bookmarks')
                    .delete()
                    .eq('post_id', postId)
                    .eq('user_id', userId)

                if (error) throw error
            } else {
                // Add bookmark
                const { error } = await supabase
                    .from('bookmarks')
                    .insert({ post_id: postId, user_id: userId })

                if (error) throw error
            }
        } catch (error) {
            console.error('Error toggling bookmark:', error)
            setIsBookmarked(previousIsBookmarked)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <button
            onClick={handleBookmark}
            disabled={!userId || isLoading}
            className={cn(
                "p-2 rounded-full transition-colors",
                isBookmarked
                    ? "text-blue-500 bg-blue-500/10 hover:bg-blue-500/20"
                    : "text-gray-400 hover:text-blue-500 hover:bg-gray-800",
                !userId && "opacity-50 cursor-not-allowed"
            )}
            title={userId ? (isBookmarked ? "Remove Bookmark" : "Bookmark") : "Login to bookmark"}
        >
            <Bookmark className={cn("h-5 w-5", isBookmarked && "fill-current")} />
        </button>
    )
}
