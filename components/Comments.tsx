"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Send, Trash2 } from 'lucide-react'
import { Comment } from '@/types'

export default function Comments({ postId }: { postId: string }) {
    const [comments, setComments] = useState<Comment[]>([])
    const [newComment, setNewComment] = useState('')
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [userId, setUserId] = useState<string | null>(null)

    useEffect(() => {
        const fetchComments = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            setUserId(user?.id || null)

            const { data, error } = await supabase
                .from('comments')
                .select('*')
                .eq('post_id', postId)
                .order('created_at', { ascending: true })

            if (error) {
                console.error('Error fetching comments:', error)
            } else {
                setComments(data || [])
            }
            setLoading(false)
        }

        fetchComments()

        // Subscribe to real-time changes
        const channel = supabase
            .channel('comments_channel')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments', filter: `post_id=eq.${postId}` }, (payload) => {
                setComments((prev) => [...prev, payload.new as Comment])
            })
            .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'comments' }, (payload) => {
                setComments((prev) => prev.filter(c => c.id !== payload.old.id))
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [postId])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newComment.trim() || !userId) return

        setSubmitting(true)

        const { error } = await supabase
            .from('comments')
            .insert({
                post_id: postId,
                content: newComment,
                author_id: userId
            })

        if (error) {
            console.error('Error adding comment:', error)
            alert('Failed to add comment. ' + error.message)
        } else {
            setNewComment('')
        }
        setSubmitting(false)
    }

    const handleDelete = async (commentId: string) => {
        if (!confirm('Are you sure you want to delete this comment?')) return

        const { error } = await supabase
            .from('comments')
            .delete()
            .eq('id', commentId)

        if (error) {
            alert('Failed to delete comment')
        }
    }

    if (loading) return <div className="text-gray-500 text-sm mt-4">Loading comments...</div>

    return (
        <div className="mt-12 border-t border-border pt-8">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-foreground">
                Comments
                <span className="text-muted-foreground text-sm font-normal">({comments.length})</span>
            </h3>

            <div className="space-y-6 mb-8">
                {comments.length === 0 ? (
                    <p className="text-muted-foreground italic">No comments yet. Be the first to share your thoughts!</p>
                ) : (
                    comments.map((comment) => (
                        <div key={comment.id} className="bg-card p-4 rounded-lg border border-border shadow-sm">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-sm text-primary font-medium">User {comment.author_id?.slice(0, 8)}</span>
                                <span className="text-xs text-muted-foreground">{new Date(comment.created_at).toLocaleDateString()}</span>
                            </div>
                            <p className="text-card-foreground text-sm whitespace-pre-wrap">{comment.content}</p>
                            {userId === comment.author_id && (
                                <button
                                    onClick={() => handleDelete(comment.id)}
                                    className="text-muted-foreground hover:text-destructive text-xs mt-2 flex items-center gap-1 transition-colors"
                                >
                                    <Trash2 className="h-3 w-3" /> Delete
                                </button>
                            )}
                        </div>
                    ))
                )}
            </div>

            {userId ? (
                <form onSubmit={handleSubmit} className="relative">
                    <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Write a comment..."
                        className="w-full bg-background border border-input rounded-lg p-3 pr-12 focus:border-primary focus:outline-none min-h-[80px] text-sm text-foreground placeholder:text-muted-foreground"
                        required
                    />
                    <button
                        type="submit"
                        disabled={submitting || !newComment.trim()}
                        className="absolute bottom-3 right-3 text-primary hover:text-primary/80 disabled:opacity-50 transition-colors"
                    >
                        <Send className="h-5 w-5" />
                    </button>
                </form>
            ) : (
                <div className="bg-muted p-4 rounded-lg text-center text-sm text-muted-foreground border border-border">
                    Please <a href="/login" className="text-primary hover:underline">log in</a> to leave a comment.
                </div>
            )}
        </div>
    )
}
