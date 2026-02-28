'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  if (items.length === 0) return null;

  return (
    <nav
      aria-label="麵包屑導航"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-2)',
        padding: 'var(--space-4) 0',
        fontSize: 'var(--text-body-sm)',
        color: 'var(--muted-foreground)',
      }}
    >
      <ol
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          listStyle: 'none',
          margin: 0,
          padding: 0,
        }}
      >
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
              }}
            >
              {index > 0 && (
                <span
                  style={{
                    color: 'var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  aria-hidden="true"
                >
                  <ChevronRight size={14} />
                </span>
              )}

              {isLast || !item.href ? (
                <span
                  style={{
                    color: isLast ? 'var(--foreground)' : 'var(--muted-foreground)',
                    fontWeight: isLast ? 500 : 400,
                  }}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  style={{
                    color: 'var(--muted-foreground)',
                    textDecoration: 'none',
                    transition: 'color 150ms ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--foreground)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--muted-foreground)';
                  }}
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
