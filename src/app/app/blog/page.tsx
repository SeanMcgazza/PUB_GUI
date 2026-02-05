'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { motion } from 'framer-motion';
import { Plus, Newspaper, Pencil, Trash2, Eye, EyeOff, ExternalLink } from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-IE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function AdminBlogPage() {
  const router = useRouter();
  const supabase = createClient() as any;
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPosts();
  }, []);

  async function loadPosts() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('blog_posts')
      .select('id, title, slug, published, published_at, created_at, updated_at')
      .eq('author_id', user.id)
      .order('updated_at', { ascending: false });

    setPosts((data as BlogPost[]) ?? []);
    setLoading(false);
  }

  async function deletePost(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;

    const { error } = await supabase.from('blog_posts').delete().eq('id', id);
    if (!error) {
      setPosts((prev) => prev.filter((p) => p.id !== id));
    }
  }

  async function togglePublish(post: BlogPost) {
    const updates = post.published
      ? { published: false }
      : { published: true, published_at: post.published_at || new Date().toISOString() };

    const { error } = await supabase
      .from('blog_posts')
      .update(updates)
      .eq('id', post.id);

    if (!error) {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === post.id
            ? { ...p, published: !p.published, published_at: updates.published ? (post.published_at || new Date().toISOString()) : p.published_at }
            : p
        )
      );
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-warm-brown">Blog Posts</h1>
          <p className="text-muted-foreground">
            {posts.filter((p) => p.published).length} published · {posts.filter((p) => !p.published).length} drafts
          </p>
        </div>

        <Link href="/app/blog/new">
          <Button className="bg-gold hover:bg-gold-dark text-white w-full md:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            New Post
          </Button>
        </Link>
      </motion.div>

      {/* Posts list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="shadow-soft animate-pulse">
              <CardContent className="p-5 h-20" />
            </Card>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <EmptyState
          icon={Newspaper}
          title="No blog posts yet"
          description="Start writing to boost your SEO and attract new clients"
          action={{
            label: 'Write Your First Post',
            onClick: () => router.push('/app/blog/new'),
          }}
        />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-3"
        >
          {posts.map((post) => (
            <Card key={post.id} className="shadow-soft hover:shadow-soft-lg transition-all">
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-warm-brown truncate">
                        {post.title}
                      </h3>
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${
                          post.published
                            ? 'bg-sage/10 text-sage'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {post.published ? (
                          <>
                            <Eye className="w-3 h-3" /> Published
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3 h-3" /> Draft
                          </>
                        )}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {post.published && post.published_at
                        ? `Published ${formatDate(post.published_at)}`
                        : `Last edited ${formatDate(post.updated_at)}`}
                      {' · '}
                      <span className="text-muted-foreground/70">/blog/{post.slug}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {post.published && (
                      <Link href={`/blog/${post.slug}`} target="_blank">
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-gold" title="View live">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </Link>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-gold"
                      onClick={() => togglePublish(post)}
                      title={post.published ? 'Unpublish' : 'Publish'}
                    >
                      {post.published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                    <Link href={`/app/blog/${post.id}/edit`}>
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-gold" title="Edit">
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-dusty-rose"
                      onClick={() => deletePost(post.id, post.title)}
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      )}
    </div>
  );
}
