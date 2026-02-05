import { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';
import { Calendar, Tag, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Blog — ChairTime | Salon Tips, Booking Insights & Industry News',
  description:
    'Expert tips for independent stylists and salon owners. Learn about booking management, client retention, pricing strategies, and growing your beauty business.',
  openGraph: {
    title: 'ChairTime Blog — Tips for Independent Stylists',
    description:
      'Expert tips for independent stylists and salon owners. Booking management, client retention, and more.',
    type: 'website',
    url: 'https://chairtime.vercel.app/blog',
  },
};

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  cover_image_url: string | null;
  published_at: string | null;
  tags: string[];
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-IE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default async function BlogListingPage() {
  const supabase = await createClient();
  const sb = supabase as any;
  const { data: posts } = await sb
    .from('blog_posts')
    .select('id, title, slug, excerpt, cover_image_url, published_at, tags')
    .eq('published', true)
    .order('published_at', { ascending: false }) as { data: BlogPost[] | null };

  const blogPosts = posts ?? [];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'ChairTime Blog',
    description:
      'Expert tips for independent stylists and salon owners.',
    url: 'https://chairtime.vercel.app/blog',
    publisher: {
      '@type': 'Organization',
      name: 'ChairTime',
      url: 'https://chairtime.vercel.app',
    },
    blogPost: blogPosts.map((post) => ({
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.excerpt,
      url: `https://chairtime.vercel.app/blog/${post.slug}`,
      datePublished: post.published_at,
      image: post.cover_image_url || undefined,
    })),
  };

  return (
    <main className="min-h-screen bg-cream">
      <Navbar />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <section className="pt-28 pb-12 md:pt-32 md:pb-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-warm-brown mb-4">
            The ChairTime Blog
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Tips, insights, and inspiration for independent stylists and salon
            owners building thriving businesses.
          </p>
        </div>
      </section>

      {/* Posts Grid */}
      <section className="pb-20">
        <div className="container mx-auto px-4">
          {blogPosts.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground text-lg">
                No posts yet — check back soon!
              </p>
            </div>
          ) : (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {blogPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="group"
                >
                  <article className="bg-white rounded-2xl overflow-hidden shadow-soft hover:shadow-soft-lg transition-all duration-300 h-full flex flex-col">
                    {post.cover_image_url ? (
                      <div className="aspect-[16/9] overflow-hidden bg-muted">
                        <img
                          src={post.cover_image_url}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ) : (
                      <div className="aspect-[16/9] bg-gradient-to-br from-gold-light/50 to-lavender-light/50 flex items-center justify-center">
                        <span className="text-4xl">✂️</span>
                      </div>
                    )}

                    <div className="p-6 flex flex-col flex-1">
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {post.tags.slice(0, 3).map((tag) => (
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

                      <h2 className="text-xl font-semibold text-warm-brown mb-2 group-hover:text-gold transition-colors line-clamp-2">
                        {post.title}
                      </h2>

                      {post.excerpt && (
                        <p className="text-muted-foreground text-sm mb-4 line-clamp-3 flex-1">
                          {post.excerpt}
                        </p>
                      )}

                      <div className="flex items-center justify-between mt-auto pt-4 border-t border-border">
                        {post.published_at && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDate(post.published_at)}
                          </div>
                        )}
                        <span className="text-sm font-medium text-gold group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                          Read more <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
