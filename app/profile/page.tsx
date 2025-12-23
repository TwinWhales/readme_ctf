"use client"

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Post, Profile } from '@/types'
import Link from 'next/link'
import { LogOut, PenLine } from 'lucide-react'
import ContributionGraph from '@/components/ContributionGraph'

export default function ProfilePage() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [profile, setProfile] = useState<Profile | null>(null)
    const [posts, setPosts] = useState<Post[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const getData = async () => {
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                router.push('/login')
                return
            }
            setUser(user)

            // Fetch Profile
            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single()

            if (profileData) setProfile(profileData)

            // Fetch My Posts
            const { data: userPosts } = await supabase
                .from('posts')
                .select('*')
                .eq('author_id', user.id)
                .order('created_at', { ascending: false })

            if (userPosts) setPosts(userPosts as Post[])

            setLoading(false)
        }

        getData()
    }, [router])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/')
        router.refresh()
    }

    if (loading) return <div className="p-8 text-center text-gray-500">Loading profile...</div>

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="flex justify-between items-start mb-12">
                <div className="flex items-center space-x-6">
                    <div className="h-24 w-24 rounded-full bg-gray-800 flex items-center justify-center text-3xl font-bold text-gray-500">
                        {profile?.username?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold">{profile?.username || 'User'}</h1>
                        <p className="text-gray-400">{user.email}</p>
                        <p className="text-sm text-gray-500 mt-1">Joined: {new Date(user.created_at).toLocaleDateString()}</p>
                    </div>
                </div>

                <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 px-4 py-2 border border-gray-800 rounded hover:bg-red-900/20 hover:text-red-400 transition-colors"
                >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                </button>
            </div>

            {user && (
                <div className="mb-12">
                    <ContributionGraph userId={user.id} />
                </div>
            )}

            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">My Writeups</h2>
                <Link href="/write" className="flex items-center space-x-2 text-blue-400 hover:text-blue-300">
                    <PenLine className="h-4 w-4" />
                    <span>Write New</span>
                </Link>
            </div>

            <div className="space-y-4">
                {posts.map(post => (
                    <div key={post.id} className="bg-gray-900 border border-gray-800 rounded-lg p-6 flex justify-between items-center group hover:border-blue-500 transition-colors">
                        <div>
                            <div className="flex items-center space-x-3 mb-1">
                                <h3 className="tex-lg font-bold group-hover:text-blue-400 transition-colors">
                                    <Link href={`/posts/${post.id}`}>{post.title}</Link>
                                </h3>
                                {!post.is_public && (
                                    <span className="text-xs bg-red-900 text-red-100 px-2 py-0.5 rounded">Private</span>
                                )}
                            </div>
                            <div className="text-sm text-gray-400 flex items-center space-x-3">
                                <span>{post.ctf_name || 'No CTF'}</span>
                                <span>&bull;</span>
                                <span>{new Date(post.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>

                        <div className="flex space-x-4 text-sm">
                            <Link href={`/edit/${post.id}`} className="text-gray-400 hover:text-blue-400">Edit</Link>
                            <Link href={`/posts/${post.id}`} className="text-gray-400 hover:text-white">View</Link>
                        </div>
                    </div>
                ))}

                {posts.length === 0 && (
                    <div className="text-center py-12 bg-gray-900 border border-gray-800 rounded-lg text-gray-500">
                        You haven't written any writeups yet.
                    </div>
                )}
            </div>
        </div>
    )
}
