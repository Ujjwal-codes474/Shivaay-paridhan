'use client';

import {
  Suspense,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Search,
  SlidersHorizontal,
} from 'lucide-react';

import ProductCard from '../../components/ProductCard';

import {
  useSearchParams,
} from 'next/navigation';


/* =========================================================
   API
========================================================= */

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:5000';


/* =========================================================
   PRODUCT TYPE
========================================================= */

type ShopProduct = {
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


/* =========================================================
   BACKEND PRODUCT
========================================================= */

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

  discount?: number;

  stock?: number;

  quantity?: number;

  rating?: number;

  featured?: boolean;

  slug?: string;

  moreInfo?: string;
};


/* =========================================================
   IMAGE URL
========================================================= */

function getImageUrl(
  image?: string
): string | undefined {

  if (!image) {
    return undefined;
  }


  /* Cloudinary / external URL */

  if (
    image.startsWith('http://') ||
    image.startsWith('https://')
  ) {
    return image;
  }


  /* Backend local image */

  if (
    image.startsWith('/uploads/')
  ) {
    return `${API_URL}${image}`;
  }


  /* Root image */

  if (
    image.startsWith('/')
  ) {
    return image;
  }


  return `${API_URL}/${image}`;
}


/* =========================================================
   CREATE SLUG
========================================================= */

function createSlug(
  name: string
): string {

  return String(name || '')
    .toLowerCase()
    .trim()
    .replace(
      /[^a-z0-9]+/g,
      '-'
    )
    .replace(
      /^-+|-+$/g,
      '');
}


/* =========================================================
   OCCASION FROM BACKEND
========================================================= */

function getOccasion(
  product: BackendProduct
): string {

  /* Direct field */

  if (
    product.occasion &&
    String(product.occasion).trim()
  ) {
    return String(
      product.occasion
    ).trim();
  }


  /* Older products / current
     AddProductModal stores:
     Occasion: Wedding
  */

  if (
    product.moreInfo
  ) {

    const match =
      String(
        product.moreInfo
      ).match(
        /occasion\s*:\s*([^\n\r]+)/i
      );

    if (
      match?.[1]
    ) {
      return match[1].trim();
    }
  }


  return '';
}


/* =========================================================
   NORMALIZE PRODUCT
========================================================= */

function normalizeProduct(
  product: BackendProduct
): ShopProduct {

  const images =
    Array.isArray(
      product.images
    )
      ? product.images.filter(
          (
            image
          ): image is string =>
            typeof image === 'string'
        )
      : [];


  const originalPrice =
    Math.round(
      Number(
        product.originalPrice ??
        product.price ??
        0
      )
    );


  const salePrice =
    Math.round(
      Number(
        product.price ?? 0
      )
    );


  const color =
    product.color ||
    (
      Array.isArray(
        product.colors
      ) &&
      product.colors.length > 0
        ? String(
            product.colors[0]
          )
        : ''
    );


  const occasion =
    getOccasion(
      product
    );


  const slug =
    product.slug ||
    createSlug(
      product.name ||
      ''
    ) ||
    String(
      product._id
    );


  return {
    id:
      String(
        product._id
      ),

    slug:
      String(
        slug
      ),

    name:
      product.name ||
      'Untitled Product',

    price:
      salePrice,

    oldPrice:
      originalPrice >
      salePrice
        ? originalPrice
        : undefined,

    /*
      Backend currently stores
      "clothing" in category and
      Saree/Lehenga/etc in type.
    */
    category:
      product.type ||
      product.category ||
      'Saree',

    fabric:
      product.material ||
      '',

    color,

    occasion,

    description:
      product.description ||
      '',

    image:
      getImageUrl(
        images[0]
      ),

    rating:
      Number(
        product.rating ?? 0
      ),

    stock:
      Math.max(
        0,
        Math.floor(
          Number(
            product.stock ??
            product.quantity ??
            0
          )
        )
      ),

    featured:
      Boolean(
        product.featured
      ),
  };
}


/* =========================================================
   SHOP CONTENT
========================================================= */

function ShopContent() {

  const params =
    useSearchParams();


  /* =======================================================
     FILTER STATE
  ======================================================= */

  const [q, setQ] =
    useState('');


  const [occasion, setOccasion] =
    useState(
      params.get('occasion') ||
      'All'
    );


  const [fabric, setFabric] =
    useState(
      params.get('fabric') ||
      'All'
    );


  const [sort, setSort] =
    useState(
      params.get('sort') === 'best'
        ? 'Best'
        : 'Featured'
    );


  /* =======================================================
     PRODUCTS
  ======================================================= */

  const [products, setProducts] =
    useState<ShopProduct[]>([]);


  /* =======================================================
     LOADING
  ======================================================= */

  const [loading, setLoading] =
    useState(true);


  /* =======================================================
     ERROR
  ======================================================= */

  const [error, setError] =
    useState('');


  /* =======================================================
     FILTER OPTIONS
  ======================================================= */

  const occasions = [
    'All',
    'Wedding',
    'Festive',
    'Daily Wear',
    'Party Wear',
    'Formal',
  ];


  const fabrics = [
    'All',
    'Silk',
    'Cotton',
    'Banarasi',
    'Kanjivaram',
    'Chiffon',
    'Georgette',
    'Organza',
    'Handloom',
    'Cotton Silk',
    'Satin Silk',
    'Silk Blend',
  ];


  /* =======================================================
     LOAD PRODUCTS
  ======================================================= */

  useEffect(() => {

    let cancelled = false;


    const loadProducts =
      async () => {

        try {

          setLoading(true);

          setError('');


          const response =
            await fetch(
              `${API_URL}/api/products`,
              {
                method:
                  'GET',

                headers: {
                  Accept:
                    'application/json',
                },

                cache:
                  'no-store',
              }
            );


          if (
            !response.ok
          ) {
            throw new Error(
              `Failed to load products (${response.status})`
            );
          }


          const data =
            await response.json();


          if (
            !Array.isArray(
              data
            )
          ) {
            throw new Error(
              'Invalid products response from backend.'
            );
          }


          const normalized =
            data
              .map(
                (
                  product: BackendProduct
                ) =>
                  normalizeProduct(
                    product
                  )
              )
              .filter(
                (
                  product: ShopProduct
                ) =>
                  Boolean(
                    product.id
                  )
              );


          if (
            !cancelled
          ) {
            setProducts(
              normalized
            );
          }

        } catch (err) {

          console.error(
            'Shop product loading error:',
            err
          );


          if (
            !cancelled
          ) {

            setError(
              err instanceof Error
                ? err.message
                : 'Unable to load products.'
            );

          }

        } finally {

          if (
            !cancelled
          ) {

            setLoading(false);

          }

        }

      };


    loadProducts();


    return () => {
      cancelled = true;
    };

  }, []);


  /* =======================================================
     FILTER + SORT
  ======================================================= */

  const filtered =
    useMemo(() => {

      const query =
        q
          .trim()
          .toLowerCase();


      let result =
        products.filter(
          (product) => {

            const matchesOccasion =
              occasion ===
                'All' ||
              product.occasion
                .trim()
                .toLowerCase() ===
                occasion
                  .trim()
                  .toLowerCase();


            const matchesFabric =
              fabric ===
                'All' ||
              product.fabric
                .trim()
                .toLowerCase() ===
                fabric
                  .trim()
                  .toLowerCase();


            const matchesSearch =
              !query ||

              product.name
                .toLowerCase()
                .includes(query) ||

              product.fabric
                .toLowerCase()
                .includes(query) ||

              product.color
                .toLowerCase()
                .includes(query) ||

              product.category
                .toLowerCase()
                .includes(query) ||

              product.occasion
                .toLowerCase()
                .includes(query) ||

              product.description
                .toLowerCase()
                .includes(query);


            return (
              matchesOccasion &&
              matchesFabric &&
              matchesSearch
            );
          }
        );


      result = [...result];


      /* =====================================================
         SORT
      ===================================================== */

      if (
        sort === 'Price Low'
      ) {

        result.sort(
          (a, b) =>
            a.price -
            b.price
        );

      }


      if (
        sort === 'Price High'
      ) {

        result.sort(
          (a, b) =>
            b.price -
            a.price
        );

      }


      if (
        sort === 'Best'
      ) {

        result.sort(
          (a, b) =>
            b.rating -
            a.rating
        );

      }


      if (
        sort === 'Featured'
      ) {

        result.sort(
          (a, b) => {

            const featuredDifference =
              Number(
                Boolean(
                  b.featured
                )
              ) -
              Number(
                Boolean(
                  a.featured
                )
              );


            if (
              featuredDifference !== 0
            ) {
              return featuredDifference;
            }


            return (
              a.name.localeCompare(
                b.name
              )
            );
          }
        );

      }


      return result;

    }, [
      products,
      q,
      occasion,
      fabric,
      sort,
    ]);


  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main className="page">

      <div className="container">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="eyebrow">
          The collection
        </div>


        <h1
          className="section-title"
          style={{
            marginTop: 8,
          }}
        >
          Shop Sarees
        </h1>


        <p
          className="muted"
          style={{
            maxWidth: 620,
          }}
        >
          Explore the Shivaay Paridhan
          edit by occasion, fabric and
          style.
        </p>


        {/* =================================================
            FILTERS
        ================================================= */}

        <div className="filter-row">

          {/* SEARCH */}

          <div
            style={{
              position:
                'relative',
            }}
          >

            <Search
              style={{
                position:
                  'absolute',

                left:
                  12,

                top:
                  13,

                color:
                  '#999',
              }}
              size={18}
            />


            <input
              className="input"
              style={{
                paddingLeft:
                  40,
              }}
              placeholder="Search sarees..."
              value={q}
              onChange={(e) =>
                setQ(
                  e.target.value
                )
              }
            />

          </div>


          {/* OCCASION */}

          <select
            className="select"
            value={
              occasion
            }
            onChange={(e) =>
              setOccasion(
                e.target.value
              )
            }
          >
            {occasions.map(
              (item) => (
                <option
                  key={item}
                  value={item}
                >
                  {item}
                </option>
              )
            )}
          </select>


          {/* FABRIC */}

          <select
            className="select"
            value={
              fabric
            }
            onChange={(e) =>
              setFabric(
                e.target.value
              )
            }
          >
            {fabrics.map(
              (item) => (
                <option
                  key={item}
                  value={item}
                >
                  {item}
                </option>
              )
            )}
          </select>


          {/* SORT */}

          <select
            className="select"
            value={
              sort
            }
            onChange={(e) =>
              setSort(
                e.target.value
              )
            }
          >
            <option value="Featured">
              Featured
            </option>

            <option value="Best">
              Best
            </option>

            <option value="Price Low">
              Price Low
            </option>

            <option value="Price High">
              Price High
            </option>
          </select>

        </div>


        {/* =================================================
            PRODUCT COUNT
        ================================================= */}

        <div
          style={{
            display:
              'flex',

            alignItems:
              'center',

            gap:
              8,

            fontSize:
              12,

            color:
              '#747477',

            marginBottom:
              18,
          }}
        >

          <SlidersHorizontal
            size={16}
          />

          {loading
            ? 'Loading products...'
            : `Showing ${filtered.length} products`
          }

        </div>


        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div
            className="card"
            style={{
              padding:
                24,

              marginBottom:
                20,

              color:
                '#762438',

              background:
                'rgba(118, 36, 56, 0.06)',
            }}
          >

            <h2 className="serif">
              Unable to load products
            </h2>

            <p className="muted mt-2">
              {error}
            </p>

          </div>
        )}


        {/* =================================================
            LOADING
        ================================================= */}

        {loading ? (

          <div
            className="card"
            style={{
              padding:
                48,

              textAlign:
                'center',
            }}
          >

            <p className="muted">
              Loading collection…
            </p>

          </div>

        ) : filtered.length > 0 ? (

          /* =================================================
             PRODUCTS
          ================================================= */

          <div className="grid-products">

            {filtered.map(
              (product) => (

                <ProductCard
                  key={
                    product.id
                  }
                  product={
                    product as any
                  }
                />

              )
            )}

          </div>

        ) : (

          /* =================================================
             EMPTY
          ================================================= */

          <div
            className="card"
            style={{
              padding:
                48,

              textAlign:
                'center',
            }}
          >

            <h2 className="serif">
              No products found
            </h2>

            <p className="muted">
              Try another search or filter.
            </p>

          </div>

        )}

      </div>

    </main>
  );
}


/* =========================================================
   SHOP WRAPPER
========================================================= */

export default function Shop() {

  return (
    <Suspense
      fallback={
        <main className="page">

          <div className="container">

            <div
              className="card"
              style={{
                padding:
                  48,

                textAlign:
                  'center',
              }}
            >
              Loading collection…
            </div>

          </div>

        </main>
      }
    >

      <ShopContent />

    </Suspense>
  );
}
