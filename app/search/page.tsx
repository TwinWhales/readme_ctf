"use client"

import { useState, useEffect, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import { Post } from '@/types'
import Link from 'next/link'
import { Search, Tag, Unlock, Lock, Clock, Filter, X } from 'lucide-react'
import { useSearchParams, useRouter } from 'next/navigation'

function SearchContent() {
    const searchParams = useSearchParams()
    const router = useRouter()

    const initialQuery = searchParams.get('q') || ''
    const initialTag = searchParams.get('tag') || ''
    const initialCtf = searchParams.get('ctf') || ''
    const initialCategory = searchParams.get('category') || ''

    const [query, setQuery] = useState(initialQuery)
    const [posts, setPosts] = useState<Post[]>([])
    const [loading, setLoading] = useState(true)
    const [filters, setFilters] = useState({
        tag: initialTag,
        ctf: initialCtf,
        category: initialCategory
    })

    const [availableTags, setAvailableTags] = useState<string[]>([])
    const [availableCtfs, setAvailableCtfs] = useState<string[]>([])
    const [availableCategories, setAvailableCategories] = useState<string[]>([])

    // Fetch available filters
    useEffect(() => {
        const fetchFilters = async () => {
            const { data: tagsData } = await supabase.from('posts').select('tags')
            const { data: ctfData } = await supabase.from('posts').select('ctf_name')
            const { data: catData } = await supabase.from('posts').select('category')

            if (tagsData) {
                const allTags = tagsData.flatMap(p => p.tags || [])
                setAvailableTags(Array.from(new Set(allTags)).sort())
            }
            if (ctfData) {
                const allCtfs = ctfData.map(p => p.ctf_name).filter(Boolean) as string[]
                setAvailableCtfs(Array.from(new Set(allCtfs)).sort())
            }
            if (catData) {
                const allCats = catData.map(p => p.category).filter(Boolean) as string[]
                setAvailableCategories(Array.from(new Set(allCats)).sort())
            }
        }
        fetchFilters()
    }, [])

    // Search logic
    useEffect(() => {
        const searchPosts = async () => {
            setLoading(true)

            let dbQuery = supabase
                .from('posts')
                .select('*')
                .order('created_at', { ascending: false })

            if (query) {
                dbQuery = dbQuery.ilike('title', `%${query}%`)
            }

            if (filters.tag) {
                dbQuery = dbQuery.contains('tags', [filters.tag])
            }

            if (filters.ctf) {
                dbQuery = dbQuery.ilike('ctf_name', `%${filters.ctf}%`)
            }

            if (filters.category) {
                dbQuery = dbQuery.eq('category', filters.category)
            }

            const { data, error } = await dbQuery

            if (error) {
                console.error('Error searching posts:', error)
            } else {
                setPosts(data || [])
            }
            setLoading(false)
        }

        const debounce = setTimeout(() => {
            searchPosts()
        }, 300)

        // Update URL params
        const params = new URLSearchParams()
        if (query) params.set('q', query)
        else params.delete('q')

        if (filters.tag) params.set('tag', filters.tag)
        else params.delete('tag')

        if (filters.ctf) params.set('ctf', filters.ctf)
        else params.delete('ctf')

        router.replace(`/search?${params.toString()}`, { scroll: false })

        return () => clearTimeout(debounce)
    }, [query, filters, router])

    const clearFilters = () => {
        setQuery('')
        setFilters({ tag: '', ctf: '', category: '' })
        router.push('/search')
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-5xl">
            <h1 className="text-3xl font-bold mb-8 flex items-center gap-3 text-foreground">
                <Search className="h-8 w-8 text-primary" />
                Search Writeups
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                {/* Search Inputs */}
                <div className="md:col-span-3 space-y-4">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search by title..."
                            className="w-full bg-background border border-input rounded-lg pl-10 pr-4 py-3 focus:border-primary focus:outline-none text-foreground placeholder:text-muted-foreground"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                        <Search className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
                    </div>
                </div>

                {/* Filters Sidebar */}
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-muted/30 p-4 rounded-lg border border-border">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-semibold text-foreground flex items-center gap-2">
                                <Filter className="h-4 w-4" /> Filters
                            </h3>
                            {(query || filters.tag || filters.ctf || filters.category) && (
                                <button
                                    onClick={clearFilters}
                                    className="text-xs text-destructive hover:text-destructive/80 flex items-center gap-1"
                                >
                                    <X className="h-3 w-3" /> Clear
                                </button>
                            )}
                        </div>

                        {/* Category Filter */}
                        <div className="mb-4">
                            <label className="block text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Category</label>
                            <select
                                className="w-full bg-background border border-input rounded px-2 py-1.5 text-sm focus:border-primary focus:outline-none text-foreground"
                                value={filters.category}
                                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                            >
                                <option value="">All Categories</option>
                                {availableCategories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        {/* CTF Filter */}
                        <div className="mb-4">
                            <label className="block text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">CTF Event</label>
                            <select
                                className="w-full bg-background border border-input rounded px-2 py-1.5 text-sm focus:border-primary focus:outline-none text-foreground"
                                value={filters.ctf}
                                onChange={(e) => setFilters(prev => ({ ...prev, ctf: e.target.value }))}
                            >
                                <option value="">All Events</option>
                                {availableCtfs.map(ctf => (
                                    <option key={ctf} value={ctf}>{ctf}</option>
                                ))}
                            </select>
                        </div>

                        {/* Tag Filter */}
                        <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Tag</label>
                            <select
                                className="w-full bg-background border border-input rounded px-2 py-1.5 text-sm focus:border-primary focus:outline-none text-foreground"
                                value={filters.tag}
                                onChange={(e) => setFilters(prev => ({ ...prev, tag: e.target.value }))}
                            >
                                <option value="">All Tags</option>
                                {availableTags.map(tag => (
                                    <option key={tag} value={tag}>{tag}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Results */}
            <div className="space-y-4">
                {loading ? (
                    <div className="text-center py-12 text-muted-foreground">Searching...</div>
                ) : posts.length === 0 ? (
                    <div className="text-center py-12 bg-muted/30 rounded-lg border border-border border-dashed">
                        <p className="text-muted-foreground">No writeups found matching your criteria.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {posts.map((post) => (
                            <Link key={post.id} href={`/posts/${post.id}`} className="block group">
                                <div className="bg-card border border-border rounded-lg p-6 h-full hover:border-primary/50 transition-colors">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center space-x-2 text-xs text-primary">
                                            <span className="uppercase tracking-wider font-semibold">{post.category || 'Uncategorized'}</span>
                                        </div>
                                        {post.is_public ? (
                                            <Unlock className="h-4 w-4 text-green-500 opacity-50" />
                                        ) : (
                                            <Lock className="h-4 w-4 text-amber-500 opacity-50" />
                                        )}
                                    </div>

                                    <h2 className="text-xl font-bold mb-2 text-card-foreground group-hover:text-primary transition-colors line-clamp-2">
                                        {post.title}
                                    </h2>

                                    <div className="text-sm text-muted-foreground mb-4 line-clamp-1">
                                        {post.ctf_name}
                                    </div>

                                    {post.tags && post.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {post.tags.slice(0, 3).map(tag => (
                                                <span key={tag} className="bg-muted text-muted-foreground text-xs px-2 py-1 rounded-full flex items-center">
                                                    <Tag className="h-3 w-3 mr-1" />
                                                    {tag}
                                                </span>
                                            ))}
                                            {post.tags.length > 3 && (
                                                <span className="text-xs text-muted-foreground">+{post.tags.length - 3}</span>
                                            )}
                                        </div>
                                    )}

                                    <div className="flex items-center text-xs text-muted-foreground mt-auto pt-4 border-t border-border">
                                        <Clock className="h-3 w-3 mr-1" />
                                        {new Date(post.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default function SearchPage() {
    return (
        <Suspense fallback={
            <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">
                <p>Loading search...</p>
            </div>
        }>
            <SearchContent />
        </Suspense>
    )
}
