'use client';

interface ProductStructuredDataProps {
  name: string;
  description: string;
  images: string[];
  price: number;
  currency?: string;
  availability?: 'InStock' | 'OutOfStock' | 'PreOrder';
  sku?: string;
  brand?: string;
  category?: string;
  rating?: number;
  reviewCount?: number;
  url?: string;
}

export function ProductStructuredData({
  name,
  description,
  images,
  price,
  currency = 'INR',
  availability = 'InStock',
  sku,
  brand = 'KawaiOra Artisan Hampers',
  category,
  rating,
  reviewCount,
  url,
}: ProductStructuredDataProps) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    image: images,
    sku,
    brand: {
      '@type': 'Brand',
      name: brand,
    },
    category,
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: currency,
      price: price.toFixed(2),
      availability: `https://schema.org/${availability}`,
      seller: {
        '@type': 'Organization',
        name: brand,
      },
    },
    ...(rating && reviewCount && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: rating,
        reviewCount,
        bestRating: 5,
        worstRating: 1,
      },
    }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BreadcrumbStructuredDataProps {
  items: BreadcrumbItem[];
}

export function BreadcrumbStructuredData({ items }: BreadcrumbStructuredDataProps) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

interface OrganizationStructuredDataProps {
  name?: string;
  url?: string;
  logo?: string;
  sameAs?: string[];
  contactPoint?: {
    telephone: string;
    contactType: string;
    availableLanguage: string[];
  }[];
}

export function OrganizationStructuredData({
  name = 'KawaiOra Artisan Hampers',
  url = 'https://kawaiora.com',
  logo = 'https://kawaiora.com/logo.png',
  sameAs = [],
  contactPoint = [
    {
      telephone: '+91-98765-43210',
      contactType: 'customer service',
      availableLanguage: ['English', 'Hindi'],
    },
  ],
}: OrganizationStructuredDataProps) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name,
    url,
    logo,
    sameAs,
    contactPoint: contactPoint.map((cp) => ({
      '@type': 'ContactPoint',
      ...cp,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

interface WebSiteStructuredDataProps {
  name?: string;
  url?: string;
  potentialAction?: {
    '@type': 'SearchAction';
    target: {
      '@type': 'EntryPoint';
      urlTemplate: string;
    };
    'query-input': string;
  };
}

export function WebSiteStructuredData({
  name = 'KawaiOra Artisan Hampers',
  url = 'https://kawaiora.com',
  potentialAction = {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: 'https://kawaiora.com/search?q={search_term_string}',
    },
    'query-input': 'required name=search_term_string',
  },
}: WebSiteStructuredDataProps) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name,
    url,
    potentialAction,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

interface FAQStructuredDataProps {
  faqs: Array<{
    question: string;
    answer: string;
  }>;
}

export function FAQStructuredData({ faqs }: FAQStructuredDataProps) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

interface ArticleStructuredDataProps {
  headline: string;
  description: string;
  image: string[];
  author: string;
  datePublished: string;
  dateModified: string;
  publisher: {
    name: string;
    logo: string;
  };
  mainEntityOfPage: string;
}

export function ArticleStructuredData({
  headline,
  description,
  image,
  author,
  datePublished,
  dateModified,
  publisher = { name: 'KawaiOra Artisan Hampers', logo: 'https://kawaiora.com/logo.png' },
  mainEntityOfPage,
}: ArticleStructuredDataProps) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline,
    description,
    image,
    author: {
      '@type': 'Person',
      name: author,
    },
    publisher: {
      '@type': 'Organization',
      name: publisher.name,
      logo: {
        '@type': 'ImageObject',
        url: publisher.logo,
      },
    },
    datePublished,
    dateModified,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': mainEntityOfPage,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}