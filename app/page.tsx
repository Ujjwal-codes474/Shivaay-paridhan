'use client';

import Link from 'next/link';

import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Heart,
  ShoppingBag,
  Star,
} from 'lucide-react';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import ProductCard from '../components/ProductCard';



/* =========================================================
   API
========================================================= */

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:5000';



/* =========================================================
   BACKEND PRODUCT TYPE
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

};



/* =========================================================
   FRONTEND PRODUCT TYPE
   Compatible with ProductCard
========================================================= */

type HomeProduct = {

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
   HERO SLIDES
========================================================= */

const heroSlides = [

  {
    image: '/shivaay/image-18.png',

    eyebrow:
      'The Shivaay Collection',

    title:
      'Timeless Elegance',

    accent:
      'defined by grace.',

    text:
      'Premium sarees for weddings, celebrations and everyday moments.',

    cta:
      'Shop Collection',

    href:
      '/shop',

  },

  {
    image: '/shivaay/image-02.png',

    eyebrow:
      'Festive Edit',

    title:
      'Grace in Every',

    accent:
      'drape.',

    text:
      'Rich colours and refined details made for festive celebrations.',

    cta:
      'Shop Festive',

    href:
      '/shop?occasion=Festive',

  },

  {
    image: '/shivaay/image-04.png',

    eyebrow:
      'The Wedding Edit',

    title:
      'Made for Grand',

    accent:
      'moments.',

    text:
      'Elegant silhouettes for weddings, receptions and celebrations.',

    cta:
      'Shop Wedding',

    href:
      '/shop?occasion=Wedding',

  },

  {
    image:
      '/shivaay/image-05.png',

    eyebrow:
      'Everyday Edit',

    title:
      'Effortless Indian',

    accent:
      'grace.',

    text:
      'Comfort-first sarees designed for beautiful everyday moments.',

    cta:
      'Shop Daily Wear',

    href:
      '/shop?occasion=Daily%20Wear',

  },

  {
    image:
      '/shivaay/image-07.png',

    eyebrow:
      'Evening Edit',

    title:
      'Quietly',

    accent:
      'sophisticated.',

    text:
      'Soft drapes and graceful finishes for dinners and special evenings.',

    cta:
      'Explore Collection',

    href:
      '/shop',

  },

];



/* =========================================================
   OCCASIONS
========================================================= */

const occasions = [

  {
    name:
      'Festive',

    image:
      '/shivaay/image-09.png',

    query:
      'Festive',

  },

  {
    name:
      'Wedding',

    image:
      '/shivaay/image-19.png',

    query:
      'Wedding',

  },

  {
    name:
      'Daily Wear',

    image:
      '/shivaay/image-12.png',

    query:
      'Daily Wear',

  },

  {
    name:
      'Party Wear',

    image:
      '/shivaay/image-16.png',

    query:
      'Party Wear',

  },

  {
    name:
      'Formal',

    image:
      '/shivaay/image-11.png',

    query:
      'Formal',

  },

];



/* =========================================================
   FABRICS
========================================================= */

const fabrics = [

  {
    name:
      'Silk',

    image:
      '/legacy/saree1.png',

    query:
      'Silk',

  },

  {
    name:
      'Cotton',

    image:
      '/legacy/saree2.png',

    query:
      'Cotton',

  },

  {
    name:
      'Kanjivaram',

    image:
      '/legacy/saree3.png',

    query:
      'Kanjivaram',

  },

  {
    name:
      'Chiffon',

    image:
      '/legacy/saree4.png',

    query:
      'Chiffon',

  },

  {
    name:
      'Organza',

    image:
      '/legacy/saree5.png',

    query:
      'Organza',

  },

  {
    name:
      'Georgette',

    image:
      '/legacy/saree6.png',

    query:
      'Georgette',

  },

];



/* =========================================================
   IMAGE URL
========================================================= */

function resolveImageUrl(
  image?: string
) {

  if (
    !image
  ) {

    return '/hero-slider.png';

  }


  if (
    image.startsWith(
      'http://'
    ) ||
    image.startsWith(
      'https://'
    )
  ) {

    return image;

  }


  if (
    image.startsWith(
      '/uploads/'
    )
  ) {

    return `${API_URL}${image}`;

  }


  if (
    image.startsWith(
      '/'
    )
  ) {

    return image;

  }


  return `${API_URL}/${image}`;

}



/* =========================================================
   SLUG
========================================================= */

function createSlug(
  name: string
) {

  return String(
    name || ''
  )
    .toLowerCase()
    .trim()
    .replace(
      /[^a-z0-9]+/g,
      '-'
    )
    .replace(
      /^-+|-+$/g,
      ''
    );

}



/* =========================================================
   NORMALIZE PRODUCT
========================================================= */

function normalizeProduct(
  product: BackendProduct
): HomeProduct {

  const images =
    Array.isArray(
      product.images
    )

      ? product.images.filter(
          (
            image
          ): image is string =>
            typeof image ===
            'string'
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
        product.price ??
        0
      )
    );


  const color =
    product.color ||
    (
      Array.isArray(
        product.colors
      ) &&
      product.colors.length > 0

        ? product.colors[0]

        : ''
    );


  return {

    id:
      String(
        product._id
      ),

    slug:
      String(
        product.slug ||
        product._id ||
        createSlug(
          product.name ||
          ''
        )
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

    category:
      product.type ||
      product.category ||
      'Sarees',

    fabric:
      product.material ||
      '',

    color,

    occasion:
      product.occasion ||
      '',

    description:
      product.description ||
      '',

    image:
      resolveImageUrl(
        images[0]
      ),

    rating:
      Number(
        product.rating ??
        0
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
   HOME PAGE
========================================================= */

export default function Home() {

  /* =======================================================
     HERO
  ======================================================= */

  const [slide, setSlide] =
    useState(0);


  const hero =
    heroSlides[
      slide
    ];



  /* =======================================================
     REAL PRODUCTS
  ======================================================= */

  const [
    products,
    setProducts,
  ] =
    useState<HomeProduct[]>([]);



  /* =======================================================
     PRODUCT LOADING
  ======================================================= */

  const [
    productsLoading,
    setProductsLoading,
  ] =
    useState(true);



  /* =======================================================
     PRODUCT ERROR
  ======================================================= */

  const [
    productsError,
    setProductsError,
  ] =
    useState('');



  /* =======================================================
     HERO AUTO SLIDER
  ======================================================= */

  useEffect(() => {

    const timer =
      window.setInterval(
        () => {

          setSlide(
            (current) =>
              (
                current +
                1
              ) %
              heroSlides.length
          );

        },
        5500
      );


    return () =>
      window.clearInterval(
        timer
      );

  }, []);



  /* =======================================================
     LOAD REAL PRODUCTS
  ======================================================= */

  useEffect(() => {

    let cancelled =
      false;


    const loadProducts =
      async () => {

        try {

          setProductsLoading(
            true
          );

          setProductsError('');


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
            data.map(
              (
                product: BackendProduct
              ) =>
                normalizeProduct(
                  product
                )
            );


          if (
            !cancelled
          ) {

            setProducts(
              normalized
            );

          }

        } catch (
          error
        ) {

          console.error(
            'Home products loading error:',
            error
          );


          if (
            !cancelled
          ) {

            setProductsError(
              error instanceof Error
                ? error.message
                : 'Unable to load products.'
            );

          }

        } finally {

          if (
            !cancelled
          ) {

            setProductsLoading(
              false
            );

          }

        }

      };


    loadProducts();


    return () => {

      cancelled =
        true;

    };

  }, []);



  /* =======================================================
     BEST SELLERS
     
     First priority:
     featured products

     Fallback:
     all products sorted by rating.
  ======================================================= */

  const bestSellers =
    useMemo(() => {

      const featured =
        products.filter(
          (
            product
          ) =>
            product.featured
        );


      if (
        featured.length >
        0
      ) {

        return [
          ...featured,
        ]
          .sort(
            (
              a,
              b
            ) =>
              Number(
                b.rating
              ) -
              Number(
                a.rating
              )
          )
          .slice(
            0,
            4
          );

      }


      return [
        ...products,
      ]
        .sort(
          (
            a,
            b
          ) =>
            Number(
              b.rating
            ) -
            Number(
              a.rating
            )
        )
        .slice(
          0,
          4
        );

    }, [
      products,
    ]);



  /* =======================================================
     RENDER
  ======================================================= */

  return (

    <main className="home-page">



      {/* ===================================================
          HERO
      =================================================== */}

      <section
        className="hero-section"
        aria-label="Shivaay Paridhan collection slider"
      >

        <img
          key={
            hero.image
          }
          src={
            hero.image
          }
          alt={
            hero.title
          }
          className="hero-image"
        />


        <div className="hero-shade" />


        <div className="container hero-content">

          <div className="hero-copy">

            <span className="eyebrow gold">
              {
                hero.eyebrow
              }
            </span>


            <h1>

              {
                hero.title
              }

              <br />

              <i>
                {
                  hero.accent
                }
              </i>

            </h1>


            <p>
              {
                hero.text
              }
            </p>


            <div className="hero-buttons">

              <Link
                href={
                  hero.href
                }
                className="btn btn-burgundy"
              >

                {
                  hero.cta
                }

                <ArrowRight
                  size={17}
                />

              </Link>


              <Link
                href="/shop"
                className="btn btn-outline-light"
              >

                Explore Collection

              </Link>

            </div>

          </div>

        </div>


        <button
          className="hero-arrow hero-prev"
          onClick={() =>
            setSlide(
              (
                slide -
                1 +
                heroSlides.length
              ) %
                heroSlides.length
            )
          }
          aria-label="Previous slide"
        >

          <ChevronLeft
            size={22}
          />

        </button>


        <button
          className="hero-arrow hero-next"
          onClick={() =>
            setSlide(
              (
                slide +
                1
              ) %
                heroSlides.length
            )
          }
          aria-label="Next slide"
        >

          <ChevronRight
            size={22}
          />

        </button>


        <div className="hero-dots">

          {
            heroSlides.map(
              (
                item,
                index
              ) => (

                <button
                  key={
                    item.image
                  }
                  onClick={() =>
                    setSlide(
                      index
                    )
                  }
                  className={
                    index ===
                    slide
                      ? 'active'
                      : ''
                  }
                  aria-label={`Go to slide ${
                    index + 1
                  }`}
                />

              )
            )
          }

        </div>

      </section>



      {/* ===================================================
          OCCASION
      =================================================== */}

      <section
        className="container section occasion-section"
      >

        <div className="ornament-title">

          <span>
            ❧
          </span>

          <div>

            <h2>
              Shop by Occasion
            </h2>

            <p>
              Find the perfect drape for every celebration.
            </p>

          </div>

          <span>
            ❧
          </span>

        </div>


        <div className="occasion-grid">

          {
            occasions.map(
              (
                occasion
              ) => (

                <Link
                  className="occasion-card"
                  key={
                    occasion.name
                  }
                  href={`/shop?occasion=${encodeURIComponent(
                    occasion.query
                  )}`}
                >

                  <img
                    src={
                      occasion.image
                    }
                    alt={
                      occasion.name
                    }
                    loading="lazy"
                  />

                  <div className="occasion-overlay" />

                  <strong>
                    {
                      occasion.name
                    }
                  </strong>

                </Link>

              )
            )
          }

        </div>

      </section>



      {/* ===================================================
          FABRICS
      =================================================== */}

      <section
        className="section fabric-section"
      >

        <div className="container">

          <div className="ornament-title">

            <span>
              ❧
            </span>

            <div>

              <h2>
                Shop by Fabrics
              </h2>

              <p>
                Textures chosen to make every drape feel special.
              </p>

            </div>

            <span>
              ❧
            </span>

          </div>


          <div className="fabric-grid">

            {
              fabrics.map(
                (
                  fabric
                ) => (

                  <Link
                    className="fabric-item"
                    key={
                      fabric.name
                    }
                    href={`/shop?fabric=${encodeURIComponent(
                      fabric.query
                    )}`}
                  >

                    <div>

                      <img
                        src={
                          fabric.image
                        }
                        alt={
                          fabric.name
                        }
                        loading="lazy"
                      />

                    </div>

                    <span>
                      {
                        fabric.name
                      }
                    </span>

                  </Link>

                )
              )
            }

          </div>

        </div>

      </section>



      {/* ===================================================
          BEST SELLERS
      =================================================== */}

      <section
        className="container section best-section"
      >

        <div className="section-row">

          <div className="center-heading">

            <span className="eyebrow">
              Handpicked favourites
            </span>

            <h2>
              Our Best Sellers
            </h2>

            <p>
              Elegant pieces selected for the Shivaay collection.
            </p>

          </div>


          <Link
            href="/shop?sort=best"
            className="text-link"
          >

            View All

            <ArrowRight
              size={15}
            />

          </Link>

        </div>



        {/* =================================================
            LOADING
        ================================================= */}

        {productsLoading && (

          <div
            className="card"
            style={{
              padding:
                40,

              textAlign:
                'center',

              marginTop:
                20,
            }}
          >

            <p className="muted">
              Loading best sellers...
            </p>

          </div>

        )}



        {/* =================================================
            ERROR
        ================================================= */}

        {!productsLoading &&
          productsError && (

            <div
              className="card"
              style={{
                padding:
                  28,

                textAlign:
                  'center',

                marginTop:
                  20,

                color:
                  '#762438',

                background:
                  'rgba(118,36,56,.06)',
              }}
            >

              <h3
                className="serif"
              >
                Unable to load products
              </h3>

              <p
                className="muted"
                style={{
                  marginTop:
                    8,
                }}
              >
                {
                  productsError
                }
              </p>

            </div>

          )}



        {/* =================================================
            EMPTY
        ================================================= */}

        {!productsLoading &&
          !productsError &&
          bestSellers.length === 0 && (

            <div
              className="card"
              style={{
                padding:
                  40,

                textAlign:
                  'center',

                marginTop:
                  20,
              }}
            >

              <ShoppingBag
                size={36}
                className="mx-auto mb-3 text-[#762438]"
              />

              <h3
                className="serif text-2xl text-[#132b49]"
              >
                Collection coming soon
              </h3>

              <p className="muted mt-2">
                New Shivaay Paridhan products will appear here.
              </p>

              <Link
                href="/shop"
                className="btn btn-primary mt-5"
              >
                Explore Collection
              </Link>

            </div>

          )}



        {/* =================================================
            REAL PRODUCTS
        ================================================= */}

        {!productsLoading &&
          !productsError &&
          bestSellers.length >
            0 && (

            <div className="products-grid">

              {
                bestSellers.map(
                  (
                    product
                  ) => (

                    <ProductCard
                      key={
                        product.id
                      }
                      product={
                        product
                      }
                    />

                  )
                )
              }

            </div>

          )}

      </section>



      {/* ===================================================
          STORY
      =================================================== */}

      <section
        className="container section story-section"
      >

        <div className="story-banner">

          <div className="story-image">

            <img
              src="/shivaay/image-21.png"
              alt="Shivaay Paridhan wedding edit"
              loading="lazy"
            />

          </div>


          <div className="story-copy">

            <span className="eyebrow">
              Wedding Edit
            </span>

            <h2>
              Make the moment
              {' '}
              <i>
                unforgettable.
              </i>
            </h2>

            <p>
              Discover rich silks, graceful drapes and statement pieces for celebrations.
            </p>

            <Link
              href="/shop?occasion=Wedding"
              className="btn btn-dark"
            >

              Shop Wedding

              <ArrowRight
                size={17}
              />

            </Link>

          </div>

        </div>

      </section>



      {/* ===================================================
          OFFER
      =================================================== */}

      <section
        className="offer-strip"
      >

        <div className="container offer-inner">

          <div>

            <span className="eyebrow gold">
              Shivaay Paridhan
            </span>

            <h2>
              Draped in elegance, defined by grace.
            </h2>

            <p>
              Explore sarees crafted for every beautiful occasion.
            </p>

          </div>


          <Link
            href="/shop"
            className="btn btn-light"
          >

            Explore Collection

            <ArrowRight
              size={17}
            />

          </Link>

        </div>

      </section>



      {/* ===================================================
          REVIEWS
      =================================================== */}

      <section
        className="container section reviews-section"
      >

        <div className="ornament-title">

          <span>
            ❧
          </span>

          <div>

            <h2>
              Our Happy Customers
            </h2>

            <p>
              Real customer stories will be featured here.
            </p>

          </div>

          <span>
            ❧
          </span>

        </div>


        <div className="customer-review-placeholder">

          <Star
            size={24}
          />

          <h3>
            Your experience belongs here.
          </h3>

          <p>
            We’ll feature verified customer reviews and real customer photos here as they come in.
          </p>

          <Link
            href="/contact"
            className="text-link"
          >

            Share your experience

            <ArrowRight
              size={15}
            />

          </Link>

        </div>

      </section>



      {/* ===================================================
          TRUST
      =================================================== */}

      <section
        className="trust-row"
      >

        <div
          className="container trust-grid"
        >

          <div>

            <ShoppingBag />

            <b>
              Best Offers
            </b>

            <span>
              Exciting deals & edits
            </span>

          </div>


          <div>

            <ArrowRight />

            <b>
              Fast Delivery
            </b>

            <span>
              Reliable delivery across India
            </span>

          </div>


          <div>

            <Heart />

            <b>
              Quality Assured
            </b>

            <span>
              Premium products
            </span>

          </div>


          <div>

            <Heart />

            <b>
              Personal Support
            </b>

            <span>
              Via WhatsApp
            </span>

          </div>

        </div>

      </section>

    </main>

  );

}