import { useEffect } from 'react';
import { CANONICAL_DOMAIN } from '../data/initialData';

interface SeoHeadProps {
  title: string;
  description: string;
  path: string;
  ogImage?: string;
  noIndex?: boolean;
}

function upsertMeta(attr: 'name' | 'property', key: string, content: string): void {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = content;
}

export function SeoHead({ title, description, path, ogImage, noIndex }: SeoHeadProps): null {
  useEffect(() => {
    document.title = title;
    const cleanPath = path === '/' ? '/' : path.replace(/\/+$/, '');
    const canonicalUrl = `${CANONICAL_DOMAIN}${cleanPath}`;
    const resolvedImage =
      ogImage || `${CANONICAL_DOMAIN}/assets/aistudio/header_bb02064d.jpg`;

    upsertMeta('name', 'description', description);
    upsertMeta('name', 'robots', noIndex ? 'noindex, nofollow' : 'index, follow');
    upsertMeta('property', 'og:title', title);
    upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:url', canonicalUrl);
    upsertMeta('property', 'og:image', resolvedImage);
    upsertMeta('name', 'twitter:title', title);
    upsertMeta('name', 'twitter:description', description);
    upsertMeta('name', 'twitter:image', resolvedImage);

    let link = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (noIndex) {
      if (link) link.remove();
    } else {
      if (!link) {
        link = document.createElement('link');
        link.rel = 'canonical';
        document.head.appendChild(link);
      }
      link.href = canonicalUrl;
    }
  }, [title, description, path, ogImage, noIndex]);

  return null;
}
