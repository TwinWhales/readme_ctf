"use client"

import { useState, useEffect } from "react"
import { Heart } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"

interface LikeButtonProps {
    postId: string
    userId: string | null
    initialLikes: number
    initialIsLiked: boolean
}

export default function LikeButton({ postId, userId, initialLikes, initialIsLiked }: LikeButtonProps) {
    const [likes, setLikes] = useState(initialLikes)
    const [isLiked, setIsLiked] = useState(initialIsLiked)
    const [isLoading, setIsLoading] = useState(false)

    const handleLike = async () => {
        if (!userId) return // Or trigger login modal
        if (isLoading) return

        setIsLoading(true)

        // Optimistic update
        const previousLikes = likes
        const previousIsLiked = isLiked

        setLikes(prev => isLiked ? prev - 1 : prev + 1)
        setIsLiked(prev => !prev)

        try {
            if (previousIsLiked) {
                // Unlike
                const { error } = await supabase
                    .from('likes')
                    .delete()
                    .eq('post_id', postId)
                    .eq('user_id', userId)

                if (error) throw error
            } else {
                // Like
                const { error } = await supabase
                    .from('likes')
                    .insert({ post_id: postId, user_id: userId })

                if (error) throw error
            }
        } catch (error) {
            console.error('Error toggling like:', error)
            // Revert on error
            setLikes(previousLikes)
            setIsLiked(previousIsLiked)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <button
            onClick={handleLike}
            disabled={!userId || isLoading}
            className={cn(
                "flex items-center space-x-1.5 text-sm transition-colors",
                isLiked ? "text-red-500 hover:text-red-600" : "text-gray-500 hover:text-red-500",
                !userId && "opacity-50 cursor-not-allowed"
            )}
            title={userId ? (isLiked ? "Unlike" : "Like") : "Login to like"}
        >
            <Heart className={cn("h-5 w-5", isLiked && "fill-current")} />
            <span>{likes}</span>
        </button>
    )
}
