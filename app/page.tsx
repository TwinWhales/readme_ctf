"use client"

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Post } from '@/types'
import { Clock, User, PenLine, Lock } from 'lucide-react'

// Helper to extract headers (Client-side only)
function PostHeaders({ content }: { content: string }) {
  // Simple regex fallback for safety if DOMParser fails or isn't available immediately
  // But since we are in useEffect verified environment for data, we can try DOMParser
  // Actually, Regex is faster for just previewing and doesn't require DOM logic.
  // Let's match <h1>...</h1> etc.

  const headers = []
  const regex = /<h([1-3])[^>]*>(.*?)<\/h\1>/gi
  let match
  while ((match = regex.exec(content)) !== null) {
    headers.push({ level: match[1], text: match[2].replace(/<[^>]+>/g, '') }) // Strip inner HTML like <b>
    if (headers.length >= 3) break // Show max 3 headers
  }

  if (headers.length === 0) return <div className="flex-1"></div>

  return (
    <div className="flex-1 mb-4 space-y-1">
      {headers.map((h, i) => (
        <div key={i} className={`text-gray-400 truncate ${h.level === '1' ? 'text-sm font-semibold text-gray-300' :
          h.level === '2' ? 'text-xs font-medium pl-2 border-l-2 border-gray-700' :
            'text-xs pl-3 border-l border-gray-800'
          }`}>
          {h.text}
        </div>
      ))}
    </div>
  )
}

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user ? user.id : null)

      const { data, error } = await supabase
        .from('posts_view')
        .select(`
          *,
          author:profiles!posts_author_id_fkey(username)
        `)
        // Filter out Study notes (hide if tags contains "Study")
        // .not('tags', 'cs', '{"Study"}') // cs = contains set (for array)
        .not('tags', 'cs', '{"Study"}')
        .order('created_at', { ascending: false })

      if (error) {
        // Fallback to table if view doesn't exist yet, to avoid crash if user didn't run SQL
        // and if view fails, we try fetching plain posts (though author join might fail if not set up)
        console.warn('View might not exist, trying table directly:', error)
          
        // Since View failed, likely no advanced join on View possible or View missing. 
        // Try fallback to just posts table (no author name for now in fallback to be safe)
        const { data: tableData, error: tableError } = await supabase
          .from('posts')
          .select('*')
          .not('tags', 'cs', '{"Study"}')
          .order('created_at', { ascending: false })

        if (tableError) console.error('Error fetching posts:', tableError)
        else setPosts(tableData as Post[])
      } else {
        setPosts(data as any[]) // Type casting as join returns nested object
      }
      setLoading(false)
    }
    getData()
  }, [])

  if (loading) return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Recent Writeups</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-64 bg-gray-900 border border-gray-800 rounded-lg animate-pulse"></div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Recent Writeups</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {posts?.map((post: Post) => (
          <div key={post.id} className="relative group block h-full">
            <Link href={`/posts/${post.id}`} className="block h-full">
              <div className="bg-card border border-border rounded-lg p-6 shadow-sm hover:shadow-md hover:border-primary/50 transition-all h-full flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                    {post.category || 'General'}
                  </span>
                  {!post.is_public && (
                    <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded border border-destructive/20">Private</span>
                  )}
                </div>

                <h2 className="text-xl font-bold mb-3 text-card-foreground group-hover:text-primary transition-colors line-clamp-2">
                  {post.title}
                </h2>

                {(!post.is_public && userId !== post.author_id) ? (
                  <div className="flex-1 flex items-center justify-center text-muted-foreground bg-muted/50 rounded-lg mb-4 border border-border border-dashed">
                    <div className="flex items-center space-x-2">
                      <Lock className="h-4 w-4" />
                      <span className="text-sm font-medium">Private Content</span>
                    </div>
                  </div>
                ) : (
                  <PostHeaders content={post.content} />
                )}

                <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto pt-4 border-t border-border">
                  <div className="flex items-center space-x-2">
                    {/* @ts-ignore */}
                    {post.author?.username && (
                      <>
                        <div className="flex items-center space-x-1">
                            <User className="h-3 w-3" />
                            {/* @ts-ignore */}
                            <span className="font-medium text-foreground/80">{post.author.username}</span>
                        </div>
                        <span>&bull;</span>
                      </>
                    )}
                    {post.ctf_name && <span>{post.ctf_name}</span>}
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>{new Date(post.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </Link>
            {/* Edit Button for Author */}
            {userId && userId === post.author_id && (
              <Link
                href={`/edit/${post.id}`}
                className="absolute top-4 right-4 p-2 bg-muted rounded-full hover:bg-primary hover:text-primary-foreground text-muted-foreground opacity-0 group-hover:opacity-100 transition-all z-10 shadow-sm"
                title="Edit Post"
              >
                <PenLine className="h-4 w-4" />
              </Link>
            )}
          </div>
        ))}

        {(!posts || posts.length === 0) && (
          <div className="col-span-full text-center py-12 text-gray-500">
            No writeups found. Be the first to write one!
          </div>
        )}
      </div>
    </div>
  )
}
