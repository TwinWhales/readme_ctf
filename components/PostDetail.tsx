"use client"

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Clock, User, Tag, Unlock, Lock, FileText, Download } from 'lucide-react'
import { Post } from '@/types'
import AuthEditButton from '@/components/AuthEditButton'
import PostContent from '@/components/PostContent'
import Comments from '@/components/Comments'
import LikeButton from '@/components/LikeButton'
import BookmarkButton from '@/components/BookmarkButton'
import TableOfContents from '@/components/TableOfContents'

export default function PostDetail({ id }: { id: string }) {
    const [post, setPost] = useState<Post | null>(null)
    const [loading, setLoading] = useState(true)
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)

    const [likeCount, setLikeCount] = useState(0)
    const [isLiked, setIsLiked] = useState(false)
    const [isBookmarked, setIsBookmarked] = useState(false)

    const router = useRouter()

    useEffect(() => {
        const getData = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            const userId = user?.id || null
            setCurrentUserId(userId)

            const { data, error } = await supabase
                .from('posts')
                .select('*')
                .eq('id', id)
                .single()

            if (error || !data) {
                // handle error
            }
            if (data) {
                setPost(data as Post)

                // Fetch interactions
                const { count } = await supabase
                    .from('likes')
                    .select('id', { count: 'exact', head: true })
                    .eq('post_id', id)

                setLikeCount(count || 0)

                if (userId) {
                    const { data: likeData } = await supabase
                        .from('likes')
                        .select('id')
                        .eq('post_id', id)
                        .eq('user_id', userId)
                        .single()
                    setIsLiked(!!likeData)

                    const { data: bookmarkData } = await supabase
                        .from('bookmarks')
                        .select('id')
                        .eq('post_id', id)
                        .eq('user_id', userId)
                        .single()
                    setIsBookmarked(!!bookmarkData)
                }
            }
            setLoading(false)
        }
        getData()
    }, [id])

    if (loading) return <div className="p-12 text-center text-gray-500">Loading writeup...</div>

    if (!post) {
        return (
            <div className="container mx-auto px-4 py-16 text-center">
                <h1 className="text-2xl font-bold mb-4">Post not found</h1>
                <p className="text-gray-500">This post may be private or deleted.</p>
            </div>
        )
    }

    const canViewContent = post.is_public || (currentUserId === post.author_id)

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            <div className="mb-8 border-b border-border pb-8">
                <div className="flex items-center space-x-2 text-sm text-primary mb-3">
                    <span className="uppercase tracking-wider font-semibold">{post.category || 'Uncategorized'}</span>
                    {post.ctf_name && (
                        <>
                            <span>&bull;</span>
                            <span>{post.ctf_name}</span>
                        </>
                    )}
                </div>

                <h1 className="text-4xl font-bold mb-4 leading-tight text-foreground">{post.title}</h1>

                <div className="flex items-center justify-between text-muted-foreground text-sm">
                    <div className="flex items-center space-x-6">
                        <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4" />
                            <span>{new Date(post.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            {post.is_public ? (
                                <Unlock className="h-4 w-4 text-green-600 dark:text-green-500" />
                            ) : (
                                <Lock className="h-4 w-4 text-amber-600 dark:text-amber-500" />
                            )}
                            <span>{post.is_public ? 'Public' : 'Private'}</span>
                        </div>
                    </div>

                    <div className="flex items-center space-x-4">
                        <LikeButton
                            postId={post.id}
                            userId={currentUserId}
                            initialLikes={likeCount}
                            initialIsLiked={isLiked}
                        />
                        <BookmarkButton
                            postId={post.id}
                            userId={currentUserId}
                            initialIsBookmarked={isBookmarked}
                        />
                        <div className="h-4 w-px bg-border"></div>
                        <AuthEditButton postId={post.id} authorId={post.author_id} />
                    </div>
                </div>

                {post.file_url && (
                    <div className="mt-6">
                        <a
                            href={post.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-3 bg-muted/50 border border-input text-primary px-4 py-3 rounded-lg hover:bg-muted transition-colors"
                        >
                            <div className="p-2 bg-muted rounded-md text-primary">
                                <FileText className="h-5 w-5" />
                            </div>
                            <div className="text-left">
                                <div className="text-sm font-semibold">Download Challenge File</div>
                                <div className="text-xs opacity-70 truncate max-w-[200px]">{post.file_url}</div>
                            </div>
                            <Download className="h-4 w-4 ml-2" />
                        </a>
                    </div>
                )}

                {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-6">
                        {post.tags.map(tag => (
                            <span key={tag} className="flex items-center bg-muted border border-border rounded-full px-3 py-1 text-xs text-muted-foreground">
                                <Tag className="h-3 w-3 mr-1" />
                                {tag}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            <div className="mt-8 flex gap-12 justify-between">
                {/* Main Content */}
                <div className="flex-1 w-full min-w-0 max-w-5xl">
                    {canViewContent ? (
                        <PostContent content={post.content} />
                    ) : (
                        <div className="flex flex-col items-center justify-center p-12 bg-gray-50 dark:bg-gray-900/30 rounded-lg border border-gray-200 dark:border-gray-800 border-dashed text-gray-500">
                            <Lock className="h-12 w-12 mb-4 opacity-50" />
                            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Private Content</h3>
                            <p>This writeup is private and only visible to the author.</p>
                        </div>
                    )}
                </div>

                {/* Sidebar (TOC) - Desktop Only */}
                {canViewContent && (
                    <div className="hidden lg:block w-64 shrink-0 text-gray-600 dark:text-gray-400">
                        <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2 font-mono text-sm leading-6">
                            <TableOfContents content={post.content} />
                        </div>
                    </div>
                )}
            </div>

            <Comments postId={id} />
        </div >
    )
}
