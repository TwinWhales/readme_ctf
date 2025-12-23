"use client"

import { useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export default function AuthCallbackPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const code = searchParams.get('code')
    const next = searchParams.get('next') || '/'

    const processingRef = useRef(false)

    useEffect(() => {
        if (code) {
            if (processingRef.current) return
            processingRef.current = true

            const handleCallback = async () => {
                const { error } = await supabase.auth.exchangeCodeForSession(code)
                if (error) {
                    console.error('Auth error:', error)
                    // If error is "Auth session missing", it might mean code is already used.
                    // But if local session exists, maybe we are good?
                }
                router.push(next)
                router.refresh()
            }
            handleCallback()
        } else {
            // If no code, check session or just redirect
            router.push(next)
        }
    }, [code, next, router])

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-950 text-gray-400">
            <div className="flex flex-col items-center space-y-4">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-400 border-t-white"></div>
                <p>Authenticating...</p>
            </div>
        </div>
    )
}
