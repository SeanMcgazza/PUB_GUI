'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BlogContent } from './blog-content';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Send, Eye, Trash2, EyeOff } from 'lucide-react';
import Link from 'next/link';

interface BlogPostData {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image_url: string;
  tags: string;
  meta_title: string;
  meta_description: string;
  published: boolean;
  published_at: string | null;
}

interface BlogEditorProps {
  initialData?: BlogPostData;
  isEdit?: boolean;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export function BlogEditor({ initialData, isEdit = false }: BlogEditorProps) {
  const router = useRouter();
  const supabase = createClient() as any;
  const [saving, setSaving] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('write');

  const [form, setForm] = useState<BlogPostData>({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    cover_image_url: '',
    tags: '',
    meta_title: '',
    meta_description: '',
    published: false,
    published_at: null,
    ...initialData,
  });

  // Auto-generate slug from title (only if not manually edited and creating new)
  useEffect(() => {
    if (!isEdit && !slugManuallyEdited && form.title) {
      setForm((prev) => ({ ...prev, slug: slugify(prev.title) }));
    }
  }, [form.title, isEdit, slugManuallyEdited]);

  const updateField = useCallback(
    (field: keyof BlogPostData, value: string | boolean | null) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  async function save(publish: boolean) {
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('You must be logged in.');
      setSaving(false);
      return;
    }

    const tagsArray = form.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const payload = {
      title: form.title,
      slug: form.slug,
      excerpt: form.excerpt,
      content: form.content,
      cover_image_url: form.cover_image_url || null,
      tags: tagsArray,
      meta_title: form.meta_title || null,
      meta_description: form.meta_description || null,
      published: publish,
      published_at: publish ? (form.published_at || new Date().toISOString()) : form.published_at,
      author_id: user.id,
    };

    let error;

    if (isEdit && initialData?.id) {
      ({ error } = await supabase
        .from('blog_posts')
        .update(payload)
        .eq('id', initialData.id));
    } else {
      ({ error } = await supabase.from('blog_posts').insert(payload));
    }

    if (error) {
      alert(`Error saving: ${error.message}`);
      setSaving(false);
      return;
    }

    router.push('/app/blog');
    router.refresh();
  }

  async function handleDelete() {
    if (!isEdit || !initialData?.id) return;
    if (!confirm('Delete this post? This cannot be undone.')) return;

    const { error } = await supabase
      .from('blog_posts')
      .delete()
      .eq('id', initialData.id);

    if (error) {
      alert(`Error deleting: ${error.message}`);
      return;
    }

    router.push('/app/blog');
    router.refresh();
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6"
      >
        <div className="flex items-center gap-3">
          <Link href="/app/blog">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-gold">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-warm-brown">
              {isEdit ? 'Edit Post' : 'New Post'}
            </h1>
            {form.slug && (
              <p className="text-sm text-muted-foreground">/blog/{form.slug}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isEdit && (
            <Button
              variant="ghost"
              onClick={handleDelete}
              className="text-dusty-rose hover:bg-dusty-rose/10"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          )}
          {isEdit && form.published && (
            <Button
              variant="outline"
              onClick={() => save(false)}
              disabled={saving || !form.title || !form.slug}
            >
              <EyeOff className="w-4 h-4 mr-2" />
              Unpublish
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => save(false)}
            disabled={saving || !form.title || !form.slug}
          >
            <Save className="w-4 h-4 mr-2" />
            {isEdit ? 'Update Draft' : 'Save as Draft'}
          </Button>
          <Button
            onClick={() => save(true)}
            disabled={saving || !form.title || !form.slug}
            className="bg-gold hover:bg-gold-dark text-white"
          >
            <Send className="w-4 h-4 mr-2" />
            {isEdit && form.published ? 'Update & Publish' : 'Publish'}
          </Button>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main editor */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="shadow-soft">
              <CardContent className="p-6 space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={form.title}
                    onChange={(e) => updateField('title', e.target.value)}
                    placeholder="Your amazing blog post title"
                    className="text-lg font-semibold"
                  />
                </div>

                <div>
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    value={form.slug}
                    onChange={(e) => {
                      setSlugManuallyEdited(true);
                      updateField('slug', slugify(e.target.value));
                    }}
                    placeholder="your-blog-post-slug"
                  />
                </div>

                <div>
                  <Label htmlFor="excerpt">Excerpt</Label>
                  <Textarea
                    id="excerpt"
                    value={form.excerpt}
                    onChange={(e) => updateField('excerpt', e.target.value)}
                    placeholder="A brief summary for cards and SEO..."
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Content editor with preview */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="shadow-soft">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Content</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <div className="px-6">
                    <TabsList className="bg-muted">
                      <TabsTrigger value="write">Write</TabsTrigger>
                      <TabsTrigger value="preview">
                        <Eye className="w-4 h-4 mr-1.5" />
                        Preview
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent value="write" className="p-6 pt-4">
                    <Textarea
                      value={form.content}
                      onChange={(e) => updateField('content', e.target.value)}
                      placeholder="Write your post content in Markdown...

# Heading 1
## Heading 2

**Bold text** and *italic text*

- Bullet points
- More points

> Blockquote

[Link text](https://example.com)"
                      rows={20}
                      className="font-mono text-sm resize-y min-h-[400px]"
                    />
                  </TabsContent>

                  <TabsContent value="preview" className="p-6 pt-4">
                    <div className="min-h-[400px] prose-chairtime">
                      {form.content ? (
                        <BlogContent content={form.content} />
                      ) : (
                        <p className="text-muted-foreground italic">
                          Nothing to preview yet. Start writing!
                        </p>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Card className="shadow-soft">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Media & Tags</CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-2 space-y-4">
                <div>
                  <Label htmlFor="cover_image_url">Cover Image URL</Label>
                  <Input
                    id="cover_image_url"
                    value={form.cover_image_url}
                    onChange={(e) => updateField('cover_image_url', e.target.value)}
                    placeholder="https://example.com/image.jpg"
                  />
                  {form.cover_image_url && (
                    <div className="mt-2 rounded-lg overflow-hidden border border-border">
                      <img
                        src={form.cover_image_url}
                        alt="Cover preview"
                        className="w-full h-32 object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <Input
                    id="tags"
                    value={form.tags}
                    onChange={(e) => updateField('tags', e.target.value)}
                    placeholder="salon tips, booking, marketing"
                  />
                  {form.tags && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {form.tags
                        .split(',')
                        .map((t) => t.trim())
                        .filter(Boolean)
                        .map((tag) => (
                          <span
                            key={tag}
                            className="text-xs px-2 py-0.5 rounded-full bg-gold/10 text-gold"
                          >
                            {tag}
                          </span>
                        ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <Card className="shadow-soft">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">SEO</CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-2 space-y-4">
                <div>
                  <Label htmlFor="meta_title">Meta Title</Label>
                  <Input
                    id="meta_title"
                    value={form.meta_title}
                    onChange={(e) => updateField('meta_title', e.target.value)}
                    placeholder={form.title || 'Custom title for search engines'}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {(form.meta_title || form.title || '').length}/60 characters
                  </p>
                </div>

                <div>
                  <Label htmlFor="meta_description">Meta Description</Label>
                  <Textarea
                    id="meta_description"
                    value={form.meta_description}
                    onChange={(e) => updateField('meta_description', e.target.value)}
                    placeholder={form.excerpt || 'Custom description for search engines'}
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {(form.meta_description || form.excerpt || '').length}/160 characters
                  </p>
                </div>

                {/* SEO preview */}
                <div className="border border-border rounded-lg p-3 bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">Search preview</p>
                  <p className="text-sm font-medium text-blue-700 truncate">
                    {form.meta_title || form.title || 'Post title'}
                  </p>
                  <p className="text-xs text-green-700 truncate">
                    chairtime.vercel.app/blog/{form.slug || '...'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                    {form.meta_description || form.excerpt || 'Post description will appear here...'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
