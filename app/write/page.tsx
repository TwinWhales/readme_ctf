"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Editor from '@/components/Editor'
import { marked } from 'marked'
import { Category } from '@/types'


// Re-writing the component logic to include import feature
export default function WritePage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    // New state for Post Type: 'writeup' | 'study'
    const [postType, setPostType] = useState<'writeup' | 'study'>('writeup')
    const [categories, setCategories] = useState<Category[]>([])
    
    useEffect(() => {
        const fetchCategories = async () => {
            const { data } = await supabase.from('categories').select('*').order('name')
            if (data) setCategories(data as Category[])
        }
        fetchCategories()
    }, [])

    // Helper to get current semester string
    const getCurrentSemester = () => {
        const date = new Date()
        const year = date.getFullYear()
        const month = date.getMonth() + 1 // 1-12
        // Simple logic: Mar-Aug = 1st Semester, Sep-Feb = 2nd Semester? 
        // Or simple 1H (Jan-Jun) / 2H (Jul-Dec)?
        // User asked for "1st Semester" / "2nd Semester".
        // Let's assume standard academic semester roughly.
        // Actually often: 1st (Mar-Jun), Summer, 2nd (Sep-Dec), Winter.
        // Let's stick to simple 1st (Jan-Jun) / 2nd (Jul-Dec) for now or just 1st/2nd.
        const semester = month <= 6 ? "1st Semester" : "2nd Semester"
        return `${year} ${semester}`
    }

    const [formData, setFormData] = useState({
        title: '',
        ctf_name: '',
        category: '',
        content: '',
        is_public: true,
        tags: '',
        file_url: ''
    })

    // Update ctf_name when postType changes
    const handlePostTypeChange = (type: 'writeup' | 'study') => {
        setPostType(type)
        if (type === 'study') {
            setFormData(prev => ({ ...prev, ctf_name: getCurrentSemester() }))
        } else {
            setFormData(prev => ({ ...prev, ctf_name: '' })) // Reset or keep previous? Resetting is safer.
        }
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = async (event) => {
            const text = event.target?.result as string
            if (text) {
                // Parse markdown to HTML
                const html = await marked.parse(text)

                // Try to extract title from # Heading
                let title = formData.title
                const titleMatch = text.match(/^#\s+(.+)$/m)
                if (titleMatch && !title) {
                    title = titleMatch[1].trim()
                }

                setFormData(prev => ({
                    ...prev,
                    content: html,
                    title: title
                }))
            }
        }
        reader.readAsText(file)
        // Reset input
        e.target.value = ''
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const user = (await supabase.auth.getUser()).data.user

        if (!user) {
            alert('You must be logged in to post.')
            setLoading(false)
            return
        }

        // Prepare tags: split string, trim, filter empty
        let tagsArray = formData.tags.split(',').map(t => t.trim()).filter(Boolean)
        
        // Auto-add "Study" tag if Study Note
        if (postType === 'study' && !tagsArray.includes('Study')) {
            tagsArray.push('Study')
        }

        // Prepare payload
        const payload = {
            title: formData.title,
            // Use the form data ctf_name (which is pre-filled with Semester for study notes)
            ctf_name: formData.ctf_name, 
            category: formData.category,
            content: formData.content,
            is_public: formData.is_public,
            tags: tagsArray,
            author_id: user.id,
            file_url: formData.file_url || null
        }

        const { error } = await supabase.from('posts').insert(payload)

        if (error) {
            alert('Error creating post: ' + error.message)
        } else {
            router.push('/')
            router.refresh()
        }
        setLoading(false)
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-3xl">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Write New Post</h1>
                <div>
                    <input
                        type="file"
                        accept=".md"
                        className="hidden"
                        id="md-upload"
                        onChange={handleFileUpload}
                    />
                    <label
                        htmlFor="md-upload"
                        className="cursor-pointer inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium py-2 px-4 rounded-md transition-colors shadow-sm"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" /></svg>
                        Import Markdown
                    </label>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Post Type Selector */}
                <div className="bg-muted/30 p-4 rounded-lg border border-border">
                    <label className="block text-sm font-medium text-muted-foreground mb-3">Post Type</label>
                    <div className="flex space-x-4">
                        <label className={`flex-1 flex items-center justify-center p-3 rounded-md border cursor-pointer transition-all ${postType === 'writeup' ? 'bg-primary/10 border-primary text-primary font-bold' : 'bg-card border-border hover:border-gray-500'}`}>
                            <input 
                                type="radio" 
                                name="postType" 
                                value="writeup" 
                                checked={postType === 'writeup'} 
                                onChange={() => handlePostTypeChange('writeup')}
                                className="hidden" 
                            />
                            CTF Writeup
                        </label>
                        <label className={`flex-1 flex items-center justify-center p-3 rounded-md border cursor-pointer transition-all ${postType === 'study' ? 'bg-primary/10 border-primary text-primary font-bold' : 'bg-card border-border hover:border-gray-500'}`}>
                            <input 
                                type="radio" 
                                name="postType" 
                                value="study" 
                                checked={postType === 'study'} 
                                onChange={() => handlePostTypeChange('study')}
                                className="hidden" 
                            />
                            Study Note
                        </label>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">Title</label>
                        <input
                            type="text"
                            required
                            className="w-full bg-background border border-input rounded px-3 py-2 focus:border-primary focus:outline-none text-foreground placeholder:text-muted-foreground"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>

                    {postType === 'writeup' && (
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-1">CTF Name</label>
                            <input
                                type="text"
                                className="w-full bg-background border border-input rounded px-3 py-2 focus:border-primary focus:outline-none text-foreground placeholder:text-muted-foreground"
                                placeholder="e.g. DEFCON 2024"
                                value={formData.ctf_name}
                                onChange={e => setFormData({ ...formData, ctf_name: e.target.value })}
                            />
                        </div>
                    )}
                    {postType === 'study' && (
                         <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Semester / Period</label>
                             <input
                                type="text"
                                className="w-full bg-background border border-input rounded px-3 py-2 focus:border-primary focus:outline-none text-foreground placeholder:text-muted-foreground"
                                value={formData.ctf_name}
                                onChange={e => setFormData({ ...formData, ctf_name: e.target.value })}
                                placeholder="e.g. 2025 1st Semester"
                            />
                         </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">Category (Room)</label>
                        <select
                            className="w-full bg-background border border-input rounded px-3 py-2 focus:border-primary focus:outline-none text-foreground"
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
                        <label className="block text-sm font-medium text-muted-foreground mb-1">Tags (comma separated)</label>
                        <div className="relative">
                            <input
                                type="text"
                                className={`w-full bg-background border border-input rounded px-3 py-2 focus:border-primary focus:outline-none text-foreground placeholder:text-muted-foreground ${postType === 'study' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                placeholder="xss, sqli, heap"
                                value={formData.tags}
                                onChange={e => setFormData({ ...formData, tags: e.target.value })}
                                disabled={postType === 'study'}
                            />
                            {postType === 'study' && (
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-900/50 text-blue-200 text-xs px-2 py-1 rounded border border-blue-800 flex items-center shadow-sm">
                                    <span className="mr-1">🔒</span> 
                                    Study Tag Applied
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Challenge File URL (Optional)</label>
                    <input
                        type="url"
                        className="w-full bg-background border border-input rounded px-3 py-2 focus:border-primary focus:outline-none text-foreground placeholder:text-muted-foreground"
                        placeholder="https://example.com/challenge.zip"
                        value={formData.file_url}
                        onChange={e => setFormData({ ...formData, file_url: e.target.value })}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Content (Rich Text)</label>
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
                    <label htmlFor="is_public" className="text-sm font-medium text-muted-foreground">
                        Make this post public
                    </label>
                </div>

                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2 px-6 rounded transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Publishing...' : 'Publish'}
                    </button>
                </div>
            </form>
        </div>
    )
}
