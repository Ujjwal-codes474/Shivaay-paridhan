'use client';

import Link from 'next/link';

import {
  Menu,
  Search,
  ShoppingBag,
  UserRound,
  X,
  Heart,
} from 'lucide-react';

import {
  useEffect,
  useState,
} from 'react';

import {
  useCart,
} from '../store/useCart';


/* =========================================================
   HEADER
========================================================= */

export default function Header() {

  const [open, setOpen] =
    useState(false);


  /* =======================================================
     AUTH
  ======================================================= */

  const [role, setRole] =
    useState<string | null>(
      null
    );


  const [isLoggedIn, setIsLoggedIn] =
    useState(false);


  /* =======================================================
     READ AUTH
  ======================================================= */

  const checkAuth =
    () => {

      const token =
        localStorage.getItem(
          'authToken'
        );

      const storedRole =
        localStorage.getItem(
          'role'
        );


      if (
        token
      ) {

        setIsLoggedIn(
          true
        );

        setRole(
          storedRole
        );

      } else {

        setIsLoggedIn(
          false
        );

        setRole(
          null
        );

      }

    };


  /* =======================================================
     AUTH CHECK
  ======================================================= */

  useEffect(() => {

    checkAuth();


    /*
      Login/logout ke baad Header ko refresh
      karne ke liye custom event.
    */

    const handleAuthChange =
      () => {
        checkAuth();
      };


    window.addEventListener(
      'auth-change',
      handleAuthChange
    );


    window.addEventListener(
      'storage',
      handleAuthChange
    );


    return () => {

      window.removeEventListener(
        'auth-change',
        handleAuthChange
      );

      window.removeEventListener(
        'storage',
        handleAuthChange
      );

    };

  }, []);


  /* =======================================================
     CART COUNT
  ======================================================= */

  const count =
    useCart(
      (state) =>
        state.items.reduce(
          (
            total,
            item
          ) =>
            total +
            item.qty,
          0
        )
    );


  /* =======================================================
     CLOSE MOBILE MENU
  ======================================================= */

  const closeMenu =
    () => {
      setOpen(false);
    };


  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <>

      {/* =====================================================
          ANNOUNCEMENT BAR
      ===================================================== */}

      <div className="announcement">

        <span>
          ✦
        </span>

        {' '}
        Complimentary shipping on orders above ₹2,000

        <span className="hide-mobile">
          {' '}·{' '}
        </span>

        <span className="hide-mobile">
          WhatsApp ordering available
        </span>

      </div>


      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="site-header">

        <div className="container nav-inner">


          {/* =================================================
              MOBILE MENU
          ================================================= */}

          <button
            type="button"
            className="mobile-menu-btn"
            aria-label="Open menu"
            onClick={() =>
              setOpen(true)
            }
          >

            <Menu
              size={23}
            />

          </button>


          {/* =================================================
              BRAND
          ================================================= */}

          <Link
            href="/"
            className="brand"
          >

            <img
              src="/legacy/shivaay.jpeg"
              alt="Shivaay Paridhan logo"
            />


            <span>

              <b>
                SHIVAAY PARIDHAN
              </b>


              <small>
                DRAPED IN ELEGANCE, DEFINED BY GRACE.
              </small>

            </span>

          </Link>


          {/* =================================================
              DESKTOP NAV
          ================================================= */}

          <nav className="desktop-nav">

            <Link href="/">
              Home
            </Link>

            <Link href="/shop">
              Shop
            </Link>

            <Link href="/contact">
              Contact Us
            </Link>

            <Link href="/about">
              About Us
            </Link>

          </nav>


          {/* =================================================
              ACTIONS
          ================================================= */}

          <div className="nav-actions">


            {/* SEARCH */}

            <Link
              href="/shop"
              aria-label="Search"
            >

              <Search
                size={20}
              />

            </Link>


            {/* WISHLIST */}

            <Link
              href="/wishlist"
              aria-label="Wishlist"
            >

              <Heart
                size={20}
              />

            </Link>


            {/* ACCOUNT */}

            <Link
              href="/account"
              aria-label={
                isLoggedIn
                  ? 'Account'
                  : 'Login'
              }
            >

              <UserRound
                size={20}
              />

            </Link>


            {/* CART */}

            <Link
              href="/cart"
              className="cart-link"
              aria-label="Cart"
            >

              <ShoppingBag
                size={21}
              />

              <em>
                {count}
              </em>

            </Link>

          </div>

        </div>

      </header>


      {/* =====================================================
          MOBILE DRAWER
      ===================================================== */}

      {open && (
        <>

          {/* OVERLAY */}

          <div
            className="menu-overlay"
            onClick={
              closeMenu
            }
            aria-hidden="true"
          />


          {/* DRAWER */}

          <aside className="mobile-drawer">


            {/* ===============================================
                DRAWER HEADER
            =============================================== */}

            <div className="drawer-top">

              <div className="drawer-brand">
                SHIVAAY PARIDHAN
              </div>


              <button
                type="button"
                onClick={
                  closeMenu
                }
                aria-label="Close menu"
              >

                <X
                  size={24}
                />

              </button>

            </div>


            {/* ===============================================
                DRAWER LINKS
            =============================================== */}

            <nav className="drawer-links">


              <Link
                href="/"
                onClick={
                  closeMenu
                }
              >
                Home
              </Link>


              <Link
                href="/shop"
                onClick={
                  closeMenu
                }
              >
                Shop
              </Link>


              <Link
                href="/about"
                onClick={
                  closeMenu
                }
              >
                About
              </Link>


              <Link
                href="/account"
                onClick={
                  closeMenu
                }
              >
                {isLoggedIn
                  ? 'Account'
                  : 'Login'}
              </Link>


              <Link
                href="/wishlist"
                onClick={
                  closeMenu
                }
              >
                Wishlist
              </Link>


              <Link
                href="/cart"
                onClick={
                  closeMenu
                }
              >
                Cart
              </Link>


              <Link
                href="/contact"
                onClick={
                  closeMenu
                }
              >
                Contact
              </Link>


              {/* =============================================
                  ADMIN
                  ONLY ADMIN
              ============================================= */}

              {role === 'admin' && (

                <Link
                  href="/admin"
                  onClick={
                    closeMenu
                  }
                >
                  Admin
                </Link>

              )}

            </nav>

          </aside>

        </>
      )}

    </>
  );
}