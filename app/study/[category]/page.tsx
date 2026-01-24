"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { Post } from "@/types";
import { Clock, User, Lock, BookOpen } from "lucide-react";
import { notFound } from "next/navigation";

// Helper to extract headers (Reuse from Home)
function PostHeaders({ content }: { content: string }) {
  const headers = [];
  const regex = /<h([1-3])[^>]*>(.*?)<\/h\1>/gi;
  let match;
  while ((match = regex.exec(content)) !== null) {
    headers.push({ level: match[1], text: match[2].replace(/<[^>]+>/g, "") });
    if (headers.length >= 3) break;
  }

  if (headers.length === 0) return <div className="flex-1"></div>;

  return (
    <div className="flex-1 mb-4 space-y-1">
      {headers.map((h, i) => (
        <div
          key={i}
          className={`text-gray-400 truncate ${
            h.level === "1"
              ? "text-sm font-semibold text-gray-300"
              : h.level === "2"
              ? "text-xs font-medium pl-2 border-l-2 border-gray-700"
              : "text-xs pl-3 border-l border-gray-800"
          }`}
        >
          {h.text}
        </div>
      ))}
    </div>
  );
}

// Valid categories for validation
const VALID_CATEGORIES = ["Web", "Pwn", "Rev", "Crypto", "Misc"];

export default function StudyCategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = use(params);
  
  // Normalize category for display and query
  // "all" is a special case
  const isAll = category.toLowerCase() === "all";
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Basic validation
    // if (!isAll && !VALID_CATEGORIES.some(c => c.toLowerCase() === category.toLowerCase())) {
    //   // Optional: Redirect to 404 or show empty
    // }

    const getData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUserId(user ? user.id : null);

      let query = supabase
        .from("posts_view")
        .select(`
          *,
          author:profiles!posts_author_id_fkey(username)
        `)
        // Filter for Study Notes using tags
        .contains("tags", ["Study"])
        .order("created_at", { ascending: false });

      if (!isAll) {
        // Case-insensitive match would be better, but category is stored as text.
        // Assuming consistent casing or using ilike if needed.
        // Let's assume the Sidebar links provide the correct casing (Web, Pwn, etc.)
        // But to be safe, maybe use ilike or exact match if ensuring storage is capitalized.
        // Current DB likely stores "Web", "Pwn".
        query = query.ilike("category", category);
      }

      const { data, error } = await query;

      if (error) {
        console.warn("View might not exist or error:", error);
        // Fallback to table
        let tableQuery = supabase
          .from("posts")
          .select("*")
          .contains("tags", ["Study"])
          .order("created_at", { ascending: false });
          
        if (!isAll) {
             tableQuery = tableQuery.ilike("category", category);
        }

        const { data: tableData, error: tableError } = await tableQuery;

        if (tableError) console.error("Error fetching posts:", tableError);
        else setPosts(tableData as Post[]);
      } else {
        setPosts(data as any[]);
      }
      setLoading(false);
    };
    getData();
  }, [category, isAll]);

  if (loading)
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 capitalize flex items-center">
            <BookOpen className="mr-3 h-8 w-8 text-primary" />
            {isAll ? "All Study Notes" : `${category} Study Room`}
        </h1>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-64 bg-gray-900 border border-gray-800 rounded-lg animate-pulse"
            ></div>
          ))}
        </div>
      </div>
    );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold capitalize flex items-center">
            <BookOpen className="mr-3 h-8 w-8 text-primary" />
            {isAll ? "All Study Notes" : `${category} Study Room`}
        </h1>
        {/* Could add a 'New Study Note' button here distinct from general Write */}
        {userId && (
             <Link 
                href="/write?type=study" 
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
                Create Note
            </Link>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {posts?.map((post: Post) => (
          <div key={post.id} className="relative group block h-full">
            <Link href={`/posts/${post.id}`} className="block h-full">
              <div className="bg-card border border-border rounded-lg p-6 shadow-sm hover:shadow-md hover:border-primary/50 transition-all h-full flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                    {post.category || "General"}
                  </span>
                  {!post.is_public && (
                    <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded border border-destructive/20">
                      Private
                    </span>
                  )}
                </div>

                <h2 className="text-xl font-bold mb-3 text-card-foreground group-hover:text-primary transition-colors line-clamp-2">
                  {post.title}
                </h2>

                {!post.is_public && userId !== post.author_id ? (
                  <div className="flex-1 flex items-center justify-center text-muted-foreground bg-muted/50 rounded-lg mb-4 border border-border border-dashed">
                    <div className="flex items-center space-x-2">
                      <Lock className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        Private Content
                      </span>
                    </div>
                  </div>
                ) : (
                  <PostHeaders content={post.content} />
                )}

                <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto pt-4 border-t border-border">
                  <div className="flex items-center space-x-2">
                    {/* @ts-ignore */}
                    {post.author?.username && (
                      <>
                        <div className="flex items-center space-x-1">
                          <User className="h-3 w-3" />
                          {/* @ts-ignore */}
                          <span className="font-medium text-foreground/80">
                            {post.author.username}
                          </span>
                        </div>
                        <span>&bull;</span>
                      </>
                    )}
                    {/* Show Semester (ctf_name) */}
                     <span className="italic opacity-70">{post.ctf_name || "Study Note"}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>
                      {new Date(post.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        ))}

        {(!posts || posts.length === 0) && (
            <div className="col-span-full flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-gray-800 rounded-lg bg-gray-900/50">
                <BookOpen className="h-12 w-12 text-gray-700 mb-4" /> 
                <h3 className="text-lg font-medium text-gray-400">No study notes found</h3>
                <p className="text-gray-500 mt-2 max-w-sm">
                    Be the first to share your knowledge in the {isAll ? "" : category} room!
                </p>
            </div>
        )}
      </div>
    </div>
  );
}
