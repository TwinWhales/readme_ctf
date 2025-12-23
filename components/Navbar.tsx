"use client"

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, PenLine, User, LogIn, Menu, Filter } from 'lucide-react'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { ModeToggle } from './ModeToggle'

export default function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [user, setUser] = useState<any>(null)
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<any[]>([])
    const [isSearching, setIsSearching] = useState(false)
    const [showDropdown, setShowDropdown] = useState(false)
    const router = useRouter()

    useEffect(() => {
        // Initial check
        import('@/lib/supabase').then(({ supabase }) => {
            supabase.auth.getUser().then(({ data: { user } }) => {
                setUser(user)
            })

            // Listener
            const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
                setUser(session?.user ?? null)
            })

            return () => subscription.unsubscribe()
        })
    }, [])

    useEffect(() => {
        const searchPosts = async () => {
            if (!query.trim()) {
                setResults([])
                return
            }
            setIsSearching(true)
            import('@/lib/supabase').then(async ({ supabase }) => {
                const { data } = await supabase
                    .from('posts')
                    .select('id, title, ctf_name, category')
                    .ilike('title', `%${query}%`)
                    .limit(5)

                setResults(data || [])
                setIsSearching(false)
                setShowDropdown(true)
            })
        }

        const debounce = setTimeout(searchPosts, 300)
        return () => clearTimeout(debounce)
    }, [query])

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (query.trim()) {
            setShowDropdown(false)
            router.push(`/search?q=${encodeURIComponent(query)}`)
        }
    }

    return (
        <nav className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 text-foreground relative z-50 transition-colors">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="text-xl font-bold tracking-tighter hover:text-primary transition-colors">
                    CTF Writeups
                </Link>

                {/* Desktop Search & Nav */}
                <div className="hidden md:flex items-center space-x-6">
                    <form onSubmit={handleSearchSubmit} className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <input
                            type="search"
                            placeholder="Search writeups..."
                            className="bg-muted/50 border border-input rounded-md pl-9 pr-10 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary w-64 transition-colors placeholder:text-muted-foreground"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onFocus={() => { if (results.length > 0) setShowDropdown(true) }}
                            onBlur={() => setTimeout(() => setShowDropdown(false), 200)} // Delay to allow click
                        />
                        <button
                            type="button"
                            onClick={() => router.push('/search')}
                            className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
                            title="Advanced Filters"
                        >
                            <Filter className="h-4 w-4" />
                        </button>
                        {/* Live Search Dropdown */}
                        {showDropdown && query && (
                            <div className="absolute top-full left-0 w-full mt-2 bg-popover border border-border rounded-lg shadow-xl overflow-hidden z-50">
                                {isSearching ? (
                                    <div className="p-3 text-xs text-muted-foreground text-center">Searching...</div>
                                ) : results.length > 0 ? (
                                    <ul>
                                        {results.map(post => (
                                            <li key={post.id} className="border-b border-border last:border-0">
                                                <Link
                                                    href={`/posts/${post.id}`}
                                                    className="block p-3 hover:bg-muted/50 transition-colors"
                                                    onClick={() => setShowDropdown(false)}
                                                >
                                                    <div className="text-sm font-medium text-foreground truncate">{post.title}</div>
                                                    <div className="text-xs text-muted-foreground flex justify-between mt-1">
                                                        <span>{post.ctf_name}</span>
                                                        <span className="uppercase text-[10px] bg-muted px-1.5 rounded border border-border">{post.category}</span>
                                                    </div>
                                                </Link>
                                            </li>
                                        ))}
                                        <li className="p-2 bg-muted/50 text-center">
                                            <button type="submit" className="text-xs text-primary hover:underline">
                                                View all results
                                            </button>
                                        </li>
                                    </ul>
                                ) : (
                                    <div className="p-3 text-xs text-muted-foreground text-center">No results found</div>
                                )}
                            </div>
                        )}
                    </form>

                    {user && (
                        <Link href="/write" className="flex items-center space-x-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                            <PenLine className="h-4 w-4" />
                            <span>Write</span>
                        </Link>
                    )}

                    {!user ? (
                        <Link href="/login" className="flex items-center space-x-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                            <LogIn className="h-4 w-4" />
                            <span>Login</span>
                        </Link>
                    ) : (
                        <Link href="/profile" className="flex items-center space-x-2 text-sm font-medium hover:text-primary transition-colors" title="My Profile">
                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center border border-border hover:border-primary">
                                <User className="h-4 w-4 text-muted-foreground" />
                            </div>
                        </Link>
                    )}
                    <div className="pl-2 border-l border-border">
                        <ModeToggle />
                    </div>
                </div>

                {/* Mobile Menu Button */}
                <button
                    className="md:hidden p-2 text-muted-foreground hover:text-foreground"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                    <Menu className="h-6 w-6" />
                </button>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="md:hidden border-t border-border bg-background p-4 space-y-4 shadow-lg">
                    <form onSubmit={handleSearchSubmit} className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <input
                            type="search"
                            placeholder="Search..."
                            className="bg-muted/50 border border-input rounded-md pl-9 pr-4 py-2 text-sm w-full focus:outline-none focus:ring-1 focus:ring-primary"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                    </form>
                    {user && (
                        <Link href="/write" className="flex items-center space-x-2 text-sm font-medium text-muted-foreground hover:text-primary">
                            <PenLine className="h-4 w-4" />
                            <span>Write Writeup</span>
                        </Link>
                    )}

                    {!user ? (
                        <Link href="/login" className="flex items-center space-x-2 text-sm font-medium text-muted-foreground hover:text-primary">
                            <LogIn className="h-4 w-4" />
                            <span>Login</span>
                        </Link>
                    ) : (
                        <Link href="/profile" className="flex items-center space-x-2 text-sm font-medium text-muted-foreground hover:text-primary">
                            <User className="h-4 w-4" />
                            <span>My Profile</span>
                        </Link>
                    )}
                    <div className="pt-2 border-t border-border flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Appearance</span>
                        <ModeToggle />
                    </div>
                </div>
            )}
        </nav>
    )
}
