import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';
import { BlogContent } from '@/components/blog/blog-content';
import { ArrowLeft, Calendar, Clock, Tag } from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image_url: string | null;
  published: boolean;
  published_at: string | null;
  tags: string[];
  meta_title: string | null;
  meta_description: string | null;
  created_at: string;
  updated_at: string;
}

interface Props {
  params: Promise<{ slug: string }>;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-IE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function estimateReadingTime(content: string): number {
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const sb = supabase as any;
  const { data: post } = await sb
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .single() as { data: BlogPost | null };

  if (!post) return { title: 'Post Not Found — ChairTime' };

  return {
    title: post.meta_title || `${post.title} — ChairTime Blog`,
    description: post.meta_description || post.excerpt || '',
    openGraph: {
      title: post.meta_title || post.title,
      description: post.meta_description || post.excerpt || '',
      type: 'article',
      url: `https://chairtime.vercel.app/blog/${slug}`,
      images: post.cover_image_url ? [{ url: post.cover_image_url }] : [],
      publishedTime: post.published_at || undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.meta_title || post.title,
      description: post.meta_description || post.excerpt || '',
      images: post.cover_image_url ? [post.cover_image_url] : [],
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const sb = supabase as any;

  const { data: post } = await sb
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .single() as { data: BlogPost | null };

  if (!post) notFound();

  // Fetch related posts (same tags, excluding current)
  let relatedPosts: BlogPost[] = [];
  if (post.tags && post.tags.length > 0) {
    const { data } = await sb
      .from('blog_posts')
      .select('*')
      .eq('published', true)
      .neq('id', post.id)
      .overlaps('tags', post.tags)
      .order('published_at', { ascending: false })
      .limit(3) as { data: BlogPost[] | null };
    relatedPosts = data ?? [];
  }

  const readingTime = estimateReadingTime(post.content || '');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt || post.meta_description || '',
    image: post.cover_image_url || undefined,
    datePublished: post.published_at,
    dateModified: post.updated_at,
    url: `https://chairtime.vercel.app/blog/${slug}`,
    publisher: {
      '@type': 'Organization',
      name: 'ChairTime',
      url: 'https://chairtime.vercel.app',
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://chairtime.vercel.app/blog/${slug}`,
    },
  };

  return (
    <main className="min-h-screen bg-cream">
      <Navbar />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article className="pt-24 md:pt-28 pb-16">
        <div className="container mx-auto px-4 max-w-3xl">
          {/* Back link */}
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-gold transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to blog
          </Link>

          {/* Header */}
          <header className="mb-8">
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {post.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-gold/10 text-gold"
                  >
                    <Tag className="w-3 h-3" />
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-warm-brown leading-tight mb-4">
              {post.title}
            </h1>

            {post.excerpt && (
              <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                {post.excerpt}
              </p>
            )}

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {post.published_at && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  {formatDate(post.published_at)}
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {readingTime} min read
              </div>
            </div>
          </header>

          {/* Cover image */}
          {post.cover_image_url && (
            <div className="rounded-2xl overflow-hidden mb-10 shadow-soft">
              <img
                src={post.cover_image_url}
                alt={post.title}
                className="w-full h-auto object-cover"
              />
            </div>
          )}

          {/* Content */}
          <div className="prose-chairtime">
            <BlogContent content={post.content || ''} />
          </div>
        </div>
      </article>

      {/* Related posts */}
      {relatedPosts.length > 0 && (
        <section className="pb-20 border-t border-border">
          <div className="container mx-auto px-4 max-w-3xl pt-12">
            <h2 className="text-2xl font-bold text-warm-brown mb-8">
              Related Articles
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {relatedPosts.map((related) => (
                <Link
                  key={related.id}
                  href={`/blog/${related.slug}`}
                  className="group"
                >
                  <article className="bg-white rounded-xl overflow-hidden shadow-soft hover:shadow-soft-lg transition-all h-full flex flex-col">
                    {related.cover_image_url ? (
                      <div className="aspect-[16/10] overflow-hidden bg-muted">
                        <img
                          src={related.cover_image_url}
                          alt={related.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ) : (
                      <div className="aspect-[16/10] bg-gradient-to-br from-gold-light/50 to-lavender-light/50 flex items-center justify-center">
                        <span className="text-3xl">✂️</span>
                      </div>
                    )}
                    <div className="p-4 flex-1">
                      <h3 className="font-semibold text-warm-brown group-hover:text-gold transition-colors line-clamp-2 text-sm">
                        {related.title}
                      </h3>
                      {related.published_at && (
                        <p className="text-xs text-muted-foreground mt-2">
                          {formatDate(related.published_at)}
                        </p>
                      )}
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </main>
  );
}
