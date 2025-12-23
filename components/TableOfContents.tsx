"use client"

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface TOCItem {
    id: string
    text: string
    level: number
}

export default function TableOfContents({ content }: { content: string }) {
    const [headings, setHeadings] = useState<TOCItem[]>([])
    const [activeId, setActiveId] = useState<string>('')

    useEffect(() => {
        // Parse content for h2 and h3
        const regex = /<h([2-3])(?:\s+id="([^"]*)")?[^>]*>(.*?)<\/h\1>/gi
        const items: TOCItem[] = []
        let match
        let index = 0

        // We need to parse from the DOM essentially because we need the IDs to match what is rendered.
        // PostContent renders HTML. We should query the DOM elements.
        // But since we are in a separate component, let's wait for mount.

        // Actually, let's grab them from document after a small delay to ensure render
        const updateHeadings = () => {
            const elements = Array.from(document.querySelectorAll('.prose h2, .prose h3'))
            const tocItems = elements.map((el, i) => {
                if (!el.id) {
                    el.id = `heading-${i}`
                }
                return {
                    id: el.id,
                    text: el.textContent || '',
                    level: parseInt(el.tagName.substring(1))
                }
            })
            setHeadings(tocItems)
        }

        const timer = setTimeout(updateHeadings, 100)

        return () => clearTimeout(timer)
    }, [content])

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveId(entry.target.id)
                    }
                })
            },
            { rootMargin: '-100px 0px -66% 0px' }
        )

        headings.forEach((heading) => {
            const element = document.getElementById(heading.id)
            if (element) observer.observe(element)
        })

        return () => observer.disconnect()
    }, [headings])

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
        e.preventDefault()
        const element = document.getElementById(id)
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' })
            setActiveId(id)
        }
    }

    if (headings.length === 0) return null

    return (
        <nav className="space-y-1">
            <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">On this page</h4>
            <ul className="space-y-2 text-sm border-l border-gray-800">
                {headings.map((heading) => (
                    <li key={heading.id}>
                        <a
                            href={`#${heading.id}`}
                            onClick={(e) => handleClick(e, heading.id)}
                            className={cn(
                                "block pl-4 transition-colors border-l-2 -ml-[1px]",
                                activeId === heading.id
                                    ? "border-blue-500 text-blue-400 font-medium"
                                    : "border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-700",
                                heading.level === 3 && "ml-4"
                            )}
                        >
                            {heading.text}
                        </a>
                    </li>
                ))}
            </ul>
        </nav>
    )
}
