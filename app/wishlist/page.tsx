'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import ProductCard from '../../components/ProductCard';
import { useWishlist } from '../../store/useWishlist';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:5000';

type BackendProduct = {
  _id: string;
  name?: string;
  price?: number;
  originalPrice?: number;
  images?: string[];
  category?: string;
  material?: string;
  type?: string;
  color?: string;
  colors?: string[];
  occasion?: string;
  description?: string;
  rating?: number;
  stock?: number;
  quantity?: number;
  featured?: boolean;
  slug?: string;
  moreInfo?: string;
};

type WishlistProduct = {
  id: string;
  slug: string;
  name: string;
  price: number;
  oldPrice?: number;
  category: string;
  fabric: string;
  color: string;
  occasion: string;
  description: string;
  image?: string;
  rating: number;
  stock: number;
  featured?: boolean;
};

function resolveImageUrl(image?: string) {
  if (!image) {
    return '/hero-slider.png';
  }

  if (
    image.startsWith('http://') ||
    image.startsWith('https://')
  ) {
    return image;
  }

  if (image.startsWith('/uploads/')) {
    return `${API_URL}${image}`;
  }

  if (image.startsWith('/')) {
    return image;
  }

  return `${API_URL}/${image}`;
}

function createSlug(name: string) {
  return String(name || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getOccasion(product: BackendProduct) {
  if (product.occasion?.trim()) {
    return product.occasion.trim();
  }

  if (product.moreInfo) {
    const match = product.moreInfo.match(
      /occasion\s*:\s*([^\n\r]+)/i
    );

    if (match?.[1]) {
      return match[1].trim();
    }
  }

  return '';
}

function normalizeProduct(
  product: BackendProduct
): WishlistProduct {
  const images = Array.isArray(product.images)
    ? product.images.filter(
        (image): image is string =>
          typeof image === 'string'
      )
    : [];

  const originalPrice = Math.round(
    Number(
      product.originalPrice ??
        product.price ??
        0
    )
  );

  const salePrice = Math.round(
    Number(product.price ?? 0)
  );

  const color =
    product.color ||
    (Array.isArray(product.colors) &&
    product.colors.length > 0
      ? String(product.colors[0])
      : '');

  const slug =
    product.slug ||
    createSlug(product.name || '') ||
    String(product._id);

  return {
    id: String(product._id),
    slug: String(slug),
    name:
      product.name ||
      'Untitled Product',

    price: salePrice,

    oldPrice:
      originalPrice > salePrice
        ? originalPrice
        : undefined,

    category:
      product.type ||
      product.category ||
      'Saree',

    fabric:
      product.material ||
      '',

    color,

    occasion: getOccasion(product),

    description:
      product.description ||
      '',

    image: resolveImageUrl(images[0]),

    rating: Number(
      product.rating || 0
    ),

    stock: Math.max(
      0,
      Math.floor(
        Number(
          product.stock ??
            product.quantity ??
            0
        )
      )
    ),

    featured: Boolean(
      product.featured
    ),
  };
}

export default function Wishlist() {
  const ids = useWishlist(
    (state) => state.ids
  );

  const [products, setProducts] =
    useState<WishlistProduct[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  useEffect(() => {
    let cancelled = false;

    const loadProducts = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await fetch(
          `${API_URL}/api/products`,
          {
            method: 'GET',
            headers: {
              Accept: 'application/json',
            },
            cache: 'no-store',
          }
        );

        if (!response.ok) {
          throw new Error(
            `Failed to load products (${response.status})`
          );
        }

        const data =
          await response.json();

        if (!Array.isArray(data)) {
          throw new Error(
            'Invalid products response from backend.'
          );
        }

        if (!cancelled) {
          setProducts(
            data.map(
              (product: BackendProduct) =>
                normalizeProduct(product)
            )
          );
        }
      } catch (err) {
        console.error(
          'Wishlist loading error:',
          err
        );

        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Unable to load wishlist.'
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  const wishlistProducts = useMemo(() => {
    const idSet = new Set(ids);

    return products.filter(
      (product) =>
        idSet.has(product.id)
    );
  }, [products, ids]);

  if (loading) {
    return (
      <main className="page">
        <div className="container">
          <div className="eyebrow">
            Saved pieces
          </div>

          <h1 className="section-title !text-left !text-[42px]">
            Wishlist
          </h1>

          <div
            className="card"
            style={{
              padding: 48,
              textAlign: 'center',
            }}
          >
            <p className="muted">
              Loading wishlist...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="container">
        <div className="eyebrow">
          Saved pieces
        </div>

        <h1 className="section-title !text-left !text-[42px]">
          Wishlist
        </h1>

        {error && (
          <div
            className="card"
            style={{
              padding: 20,
              marginBottom: 20,
              background:
                'rgba(118, 36, 56, 0.06)',
              color: '#762438',
            }}
          >
            {error}
          </div>
        )}

        {wishlistProducts.length > 0 ? (
          <div className="grid-products">
            {wishlistProducts.map(
              (product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                />
              )
            )}
          </div>
        ) : (
          <div className="card p-12 text-center">
            <h2 className="serif text-3xl text-[#132b49]">
              Nothing saved yet
            </h2>

            <p className="muted">
              Tap the heart on a product
              to save it.
            </p>

            <Link
              className="btn btn-primary mt-5"
              href="/shop"
            >
              Explore Collection
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}