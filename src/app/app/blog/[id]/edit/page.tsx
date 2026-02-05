'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { BlogEditor } from '@/components/blog/blog-editor';
import { Card, CardContent } from '@/components/ui/card';

interface Props {
  params: Promise<{ id: string }>;
}

export default function EditBlogPostPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const supabase = createClient() as any;
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('id', id)
        .single();

      if (!data) {
        router.push('/app/blog');
        return;
      }

      setPost(data);
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="p-4 md:p-8 max-w-5xl mx-auto">
        <Card className="shadow-soft animate-pulse">
          <CardContent className="p-8 h-96" />
        </Card>
      </div>
    );
  }

  if (!post) return null;

  return (
    <BlogEditor
      isEdit
      initialData={{
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt || '',
        content: post.content || '',
        cover_image_url: post.cover_image_url || '',
        tags: (post.tags || []).join(', '),
        meta_title: post.meta_title || '',
        meta_description: post.meta_description || '',
        published: post.published,
        published_at: post.published_at,
      }}
    />
  );
}
