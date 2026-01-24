"use client"

import { useEffect, useState, use } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Post, Category } from '@/types'
import Editor from '@/components/Editor'

export default function EditPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter()
    const { id } = use(params)
    const [loading, setLoading] = useState(true)
    const [isStudy, setIsStudy] = useState(false)
    const [categories, setCategories] = useState<Category[]>([])
    const [formData, setFormData] = useState({
        title: '',
        ctf_name: '',
        category: '',
        content: '',
        is_public: true,
        tags: '',
        file_url: ''
    })

    useEffect(() => {
        const getData = async () => {
             // Fetch Categories
             const { data: catData } = await supabase.from('categories').select('*').order('name')
             if (catData) setCategories(catData as Category[])

            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/login')
                return
            }

            // Fetch Post
            const { data: post, error } = await supabase
                .from('posts')
                .select('*')
                .eq('id', id)
                .single()

            if (error || !post) {
                alert('Post not found')
                router.push('/')
                return
            }

            if (post.author_id !== user.id) {
                alert('You are not authorized to edit this post')
                router.push('/')
                return
            }

            setFormData({
                title: post.title,
                ctf_name: post.ctf_name || '',
                category: post.category || '',
                content: post.content,
                is_public: post.is_public,
                // Filter out 'Study' for display in input, but set flag
                tags: post.tags ? post.tags.filter((t: string) => t !== 'Study').join(', ') : '',
                file_url: post.file_url || ''
            })
            
            // Check if it's a Study Note based on tags
            if (post.tags && post.tags.includes('Study')) {
                setIsStudy(true)
            }
            
            setLoading(false)
        }

        getData()
    }, [id, router])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const { error } = await supabase.from('posts').update({
            title: formData.title,
            ctf_name: formData.ctf_name,
            category: formData.category,
            content: formData.content,
            is_public: formData.is_public,
            tags: (() => {
                const tags = formData.tags.split(',').map(t => t.trim()).filter(Boolean);
                if (isStudy && !tags.includes('Study')) tags.push('Study');
                return tags;
            })(),
            file_url: formData.file_url || null,
            updated_at: new Date().toISOString()
        }).eq('id', id)

        if (error) {
            alert('Error updating post: ' + error.message)
        } else {
            router.push(`/posts/${id}`)
            router.refresh()
        }
        setLoading(false)
        setLoading(false)
    }

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this writeup? This action cannot be undone.')) return
        
        setLoading(true)
        const { error } = await supabase
            .from('posts')
            .delete()
            .eq('id', id)
            .eq('author_id', (await supabase.auth.getUser()).data.user?.id)

        if (error) {
            alert('Failed to delete: ' + error.message)
            setLoading(false)
        } else {
            router.push('/')
            router.refresh()
        }
    }

    if (loading) return <div className="p-8 text-center text-gray-500">Loading editor...</div>

    return (
        <div className="container mx-auto px-4 py-8 max-w-3xl">
            <h1 className="text-3xl font-bold mb-8">Edit Writeup</h1>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Title</label>
                        <input
                            type="text"
                            required
                            className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 focus:border-blue-500 focus:outline-none"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">CTF Name</label>
                        <input
                            type="text"
                            className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 focus:border-blue-500 focus:outline-none"
                            placeholder="e.g. DEFCON 2024"
                            value={formData.ctf_name}
                            onChange={e => setFormData({ ...formData, ctf_name: e.target.value })}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">
                            Category
                        </label>
                        <select
                            className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 focus:border-blue-500 focus:outline-none"
                            value={formData.category}
                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                        >
                            <option value="">Select Category</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.name}>{cat.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">
                            Tags (comma separated)
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                className={`w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 focus:border-blue-500 focus:outline-none ${isStudy ? 'opacity-50 cursor-not-allowed' : ''}`}
                                placeholder="xss, sqli, heap"
                                value={formData.tags}
                                onChange={e => setFormData({ ...formData, tags: e.target.value })}
                                disabled={isStudy}
                            />
                            {isStudy && (
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-900/50 text-blue-200 text-xs px-2 py-1 rounded border border-blue-800 flex items-center shadow-sm">
                                    <span className="mr-1">🔒</span> 
                                    Study Tag Applied
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Challenge File URL (Optional)</label>
                    <input
                        type="url"
                        className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 focus:border-blue-500 focus:outline-none"
                        placeholder="https://example.com/challenge.zip"
                        value={formData.file_url}
                        onChange={e => setFormData({ ...formData, file_url: e.target.value })}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Content (Rich Text)</label>
                    <Editor
                        content={formData.content}
                        onChange={html => setFormData({ ...formData, content: html })}
                    />
                </div>

                <div className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        id="is_public"
                        className="rounded bg-gray-900 border-gray-800 text-blue-600 focus:ring-blue-500"
                        checked={formData.is_public}
                        onChange={e => setFormData({ ...formData, is_public: e.target.checked })}
                    />
                    <label htmlFor="is_public" className="text-sm font-medium text-gray-300">
                        Make this post public
                    </label>
                </div>

                <div className="flex justify-between pt-4">
                    <button
                        type="button"
                        onClick={handleDelete}
                        className="text-red-400 hover:text-red-300 px-4 py-2 flex items-center space-x-2 transition-colors disabled:opacity-50"
                        disabled={loading}
                    >
                        <span>Delete Post</span>
                    </button>
                    <div className="flex space-x-4">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="text-gray-400 hover:text-white px-4 py-2"
                        >
                            Cancel
                        </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                    </div>
                </div>
            </form>
        </div>
    )
}
