"use client"

import DOMPurify from 'dompurify'
import { useEffect, useRef, useState } from 'react'
import hljs from 'highlight.js'
import 'highlight.js/styles/atom-one-dark-reasonable.css' // VS Code-like dark theme
import { cn } from '@/lib/utils'

interface PostContentProps {
    content: string
    className?: string
}

export default function PostContent({ content, className }: PostContentProps) {
    const contentRef = useRef<HTMLDivElement>(null)

    const [sanitizedContent, setSanitizedContent] = useState('')

    useEffect(() => {
        // Sanitize content only on client side to avoid SSR/ESM issues with isomorphic-dompurify
        const clean = DOMPurify.sanitize(content, {
            ADD_TAGS: ['iframe'],
            ADD_ATTR: ['target', 'allow', 'allowfullscreen', 'frameborder', 'scrolling'],
        })
        setSanitizedContent(clean)
    }, [content])

    useEffect(() => {
        if (contentRef.current && sanitizedContent) {
            // Style inline code (make it distinct from block code)
            const codeElements = contentRef.current.querySelectorAll('code')
            codeElements.forEach(code => {
                // If it's NOT inside a pre tag, it's inline code
                if (!code.closest('pre')) {
                    // Remove existing prose classes if any interfering
                    code.classList.add(
                        '!bg-transparent', '!text-red-500', 'dark:!text-red-400',
                        'font-mono', 'text-sm', 'font-medium'
                    )
                }
            })
        }
    }, [sanitizedContent])

    return (
        <div
            ref={contentRef}
            className={cn(
                "prose dark:prose-invert prose-lg max-w-none break-words",
                "text-foreground",
                "prose-headings:text-foreground",
                "prose-p:text-foreground",
                "prose-strong:text-foreground",
                "prose-li:text-foreground",
                "prose-code:before:content-none prose-code:after:content-none",
                className
            )}
            dangerouslySetInnerHTML={{ __html: sanitizedContent }}
        />
    )
}
