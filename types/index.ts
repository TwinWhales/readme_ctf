export interface Profile {
    id: string
    username: string | null
    avatar_url: string | null
    created_at: string
    role?: 'user' | 'manager' | 'admin'
}

export interface Category {
    id: string
    name: string
    icon: string
    created_at: string
}

export interface Post {
    id: string
    title: string
    content: string
    is_public: boolean
    ctf_name: string | null
    category: string | null
    tags: string[] | null
    author_id: string
    file_url: string | null
    created_at: string
    updated_at: string | null
    username?: string // From posts_view
    author?: {
        username: string | null
    }
}

export interface Like {
    id: string
    user_id: string
    post_id: string
    created_at: string
}

export interface Bookmark {
    id: string
    user_id: string
    post_id: string
    created_at: string
}

export interface Comment {
    id: string
    post_id: string
    author_id: string
    content: string
    created_at: string
}
