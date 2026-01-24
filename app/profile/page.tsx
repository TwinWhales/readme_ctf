"use client"

import { useEffect, useState, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import { Post, Profile } from '@/types'
import Link from 'next/link'
import { LogOut, PenLine, Check, AlertCircle } from 'lucide-react'
import ContributionGraph from '@/components/ContributionGraph'
import AdminUserList from '@/components/AdminUserList'

function ProfileContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const isSetup = searchParams.get('setup') === 'true'

    const [user, setUser] = useState<any>(null)
    const [profile, setProfile] = useState<Profile | null>(null)
    const [posts, setPosts] = useState<Post[]>([])
    const [loading, setLoading] = useState(true)

    // Editing State
    const [isEditing, setIsEditing] = useState(false)
    const [newUsername, setNewUsername] = useState('')
    const [usernameError, setUsernameError] = useState('')
    const [isSaving, setIsSaving] = useState(false)

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

            if (profileData) {
                setProfile(profileData)
                setNewUsername(profileData.username || '')
                if (isSetup || !profileData.username) {
                    setIsEditing(true)
                }
            }

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
    }, [router, isSetup])

    const validateUsername = (name: string) => {
        const trimmed = name.trim()
        if (trimmed.length < 2 || trimmed.length > 20) return "Username must be between 2 and 20 characters."
        // Allowed: Alphanumeric, Underscore, and Korean characters (Hangul Syllables and Jamo)
        if (!/^[a-zA-Z0-9_\uAC00-\uD7A3]+$/.test(trimmed)) return "Username can only contain letters, numbers, underscores, and Korean characters."
        return ""
    }

    const checkAvailability = async (name: string) => {
        if (!user) return false
        const { data } = await supabase
            .from('profiles')
            .select('id')
            .eq('username', name)
            .single()
        
        // If a profile exists with this username, and it's NOT ME, then it's taken
        if (data && data.id !== user.id) {
            return false
        }
        return true
    }

    const handleSaveProfile = async () => {
        setUsernameError('')
        const error = validateUsername(newUsername)
        if (error) {
            setUsernameError(error)
            return
        }

        setIsSaving(true)
        const isAvailable = await checkAvailability(newUsername)
        if (!isAvailable) {
            setUsernameError('Username is already taken.')
            setIsSaving(false)
            return
        }

        const { error: updateError } = await supabase
            .from('profiles')
            .update({ username: newUsername })
            .eq('id', user.id)

        if (updateError) {
            setUsernameError('Failed to update profile. Please try again.')
            console.error(updateError)
        } else {
            setProfile(prev => prev ? { ...prev, username: newUsername } : null)
            setIsEditing(false)
            if (isSetup) {
                router.replace('/profile') // Remove setup param
            }
        }
        setIsSaving(false)
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/')
        router.refresh()
    }

    if (loading) return <div className="p-8 text-center text-gray-500">Loading profile...</div>

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            {isSetup && (
                <div className="mb-8 p-4 bg-blue-900/30 border border-blue-800 rounded-lg flex items-center space-x-3 text-blue-200">
                    <AlertCircle className="h-5 w-5" />
                    <span>Welcome! Please set a nickname to identify yourself on the platform.</span>
                </div>
            )}

            <div className="flex justify-between items-start mb-12">
                <div className="flex items-center space-x-6">
                    <div className="h-24 w-24 rounded-full bg-gray-800 flex items-center justify-center text-3xl font-bold text-gray-500 shrink-0">
                        {profile?.username?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1">
                        {isEditing ? (
                            <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="text"
                                        value={newUsername}
                                        onChange={(e) => {
                                            setNewUsername(e.target.value)
                                            setUsernameError('')
                                        }}
                                        className="bg-gray-900 border border-gray-700 rounded px-3 py-1 text-white focus:outline-none focus:border-blue-500"
                                        placeholder="Nickname"
                                    />
                                    <button
                                        onClick={handleSaveProfile}
                                        disabled={isSaving}
                                        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3 py-1 rounded text-sm transition-colors flex items-center space-x-1"
                                    >
                                        {isSaving ? <span>Saving...</span> : <><span>Save</span><Check className="h-3 w-3" /></>}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsEditing(false)
                                            setNewUsername(profile?.username || '')
                                            setUsernameError('')
                                        }}
                                        className="text-gray-500 hover:text-gray-300 text-sm"
                                    >
                                        Cancel
                                    </button>
                                </div>
                                {usernameError && (
                                    <p className="text-red-400 text-xs">{usernameError}</p>
                                )}
                                <p className="text-xs text-gray-500">2-20 characters, letters, numbers, underscores.</p>
                            </div>
                        ) : (
                            <div className="flex items-center space-x-3 group">
                                <h1 className="text-3xl font-bold">{profile?.username || 'User'}</h1>
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-blue-400 transition-opacity"
                                    title="Edit Nickname"
                                >
                                    <PenLine className="h-4 w-4" />
                                </button>
                            </div>
                        )}
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

            {/* Admin Dashboard */}
            {profile?.role === 'admin' && (
                <div className="mb-12">
                    <AdminUserList currentUser={user} />
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

export default function ProfilePage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading...</div>}>
            <ProfileContent />
        </Suspense>
    )
}
