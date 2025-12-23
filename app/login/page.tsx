"use client"

import { useState } from 'react'
import { createClientComponentClient as createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function Login() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')
    const router = useRouter()

    // Create Supabase client inside component
    const supabase = createClient()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setMessage('')

        // Determine redirect URL: prefer env var (prod), fallback to location.origin (dev/preview)
        let redirectUrl = process.env.NEXT_PUBLIC_APP_URL || location.origin
        if (!redirectUrl.startsWith('http')) {
            redirectUrl = `https://${redirectUrl}`
        }
        // Remove trailing slash if present to avoid dry/auth//callback
        redirectUrl = redirectUrl.replace(/\/$/, '')

        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: `${redirectUrl}/auth/callback`,
            },
        })

        if (error) {
            setMessage(error.message)
        } else {
            setMessage('Check your email for the login link!')
        }
        setLoading(false)
    }

    return (
        <div className="container mx-auto px-4 py-16 flex justify-center">
            <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-lg p-8">
                <h1 className="text-2xl font-bold mb-6 text-center">Login to CTF Writeups</h1>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-1">
                            Email Address
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                            placeholder="you@example.com"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Sending magic link...' : 'Send Magic Link'}
                    </button>
                </form>

                {message && (
                    <div className="mt-4 p-3 bg-gray-800 text-sm text-center rounded">
                        {message}
                    </div>
                )}
            </div>
        </div>
    )
}
