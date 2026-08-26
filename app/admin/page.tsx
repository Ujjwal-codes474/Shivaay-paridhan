'use client';

import Link from 'next/link';

import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  Box,
  ChartNoAxesCombined,
  CircleDollarSign,
  ClipboardList,
  LogOut,
  RefreshCw,
  Ticket,
  Users,
  ShieldAlert,
  X,
} from 'lucide-react';

import {
  useRouter,
} from 'next/navigation';


/* =========================================================
   API
========================================================= */

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:5000';


/* =========================================================
   DASHBOARD DATA
========================================================= */

type RecentOrder = {
  _id?: string;
  orderId?: string;
  total?: number;
  status?: string;
  createdAt?: string;
};


type DashboardData = {
  revenue: number;
  orders: number;
  users: number;
  products: number;
  recentOrders: RecentOrder[];
};


/* =========================================================
   DEFAULT DATA
========================================================= */

const emptyDashboard: DashboardData = {
  revenue: 0,
  orders: 0,
  users: 0,
  products: 0,
  recentOrders: [],
};


/* =========================================================
   ADMIN DASHBOARD
========================================================= */

export default function Admin() {

  const router =
    useRouter();


  /* =======================================================
     AUTH
  ======================================================= */

  const [checkingAuth, setCheckingAuth] =
    useState(true);


  /* =======================================================
     LOADING
  ======================================================= */

  const [loading, setLoading] =
    useState(true);


  /* =======================================================
     REFRESH
  ======================================================= */

  const [refreshing, setRefreshing] =
    useState(false);


  /* =======================================================
     LOGOUT
  ======================================================= */

  const [loggingOut, setLoggingOut] =
    useState(false);


  const [showLogoutConfirm, setShowLogoutConfirm] =
    useState(false);


  /* =======================================================
     ERROR
  ======================================================= */

  const [error, setError] =
    useState('');


  /* =======================================================
     DATA
  ======================================================= */

  const [dashboard, setDashboard] =
    useState<DashboardData>(
      emptyDashboard
    );


  /* =======================================================
     FORMAT CURRENCY
  ======================================================= */

  const formatCurrency = (
    value: number
  ) => {

    return `₹${Number(
      value || 0
    ).toLocaleString(
      'en-IN'
    )}`;

  };


  /* =======================================================
     FORMAT DATE
  ======================================================= */

  const formatDate = (
    value?: string
  ) => {

    if (!value) {
      return '—';
    }


    const date =
      new Date(
        value
      );


    if (
      Number.isNaN(
        date.getTime()
      )
    ) {

      return '—';

    }


    return date.toLocaleDateString(
      'en-IN',
      {
        day:
          '2-digit',

        month:
          'short',

        year:
          'numeric',
      }
    );

  };


  /* =======================================================
     CLEAR AUTH + LOGIN
  ======================================================= */

  const clearAuthAndLogin = () => {

    setLoggingOut(
      true
    );


    localStorage.removeItem(
      'authToken'
    );

    localStorage.removeItem(
      'role'
    );

    localStorage.removeItem(
      'currentUser'
    );

    localStorage.removeItem(
      'rememberMe'
    );


    window.dispatchEvent(
      new Event(
        'auth-change'
      )
    );


    setShowLogoutConfirm(
      false
    );


    router.replace(
      '/login'
    );

    router.refresh();

  };


  /* =======================================================
     OPEN LOGOUT MODAL
  ======================================================= */

  const handleLogoutClick = () => {

    if (
      loggingOut
    ) {

      return;

    }


    setShowLogoutConfirm(
      true
    );

  };


  /* =======================================================
     CLOSE LOGOUT MODAL
  ======================================================= */

  const closeLogoutConfirm = () => {

    if (
      loggingOut
    ) {

      return;

    }


    setShowLogoutConfirm(
      false
    );

  };


  /* =======================================================
     ESCAPE KEY
  ======================================================= */

  useEffect(() => {

    if (
      !showLogoutConfirm
    ) {

      return;

    }


    const handleKeyDown =
      (event: KeyboardEvent) => {

        if (
          event.key === 'Escape'
        ) {

          closeLogoutConfirm();

        }

      };


    document.addEventListener(
      'keydown',
      handleKeyDown
    );


    return () => {

      document.removeEventListener(
        'keydown',
        handleKeyDown
      );

    };

  }, [
    showLogoutConfirm,
    loggingOut,
  ]);


  /* =======================================================
     LOAD DASHBOARD
  ======================================================= */

  const loadDashboard =
    useCallback(
      async (
        token: string,
        isRefresh = false
      ) => {

        try {

          if (
            isRefresh
          ) {

            setRefreshing(
              true
            );

          } else {

            setLoading(
              true
            );

          }


          setError('');


          const response =
            await fetch(
              `${API_URL}/api/dashboard-stats`,
              {
                method:
                  'GET',

                headers: {
                  Authorization:
                    `Bearer ${token}`,

                  Accept:
                    'application/json',
                },

                cache:
                  'no-store',
              }
            );


          /* =========================================
             AUTH EXPIRED
          ========================================= */

          if (
            response.status === 401
          ) {

            clearAuthAndLogin();

            return;

          }


          /* =========================================
             NOT ADMIN
          ========================================= */

          if (
            response.status === 403
          ) {

            router.replace(
              '/'
            );

            return;

          }


          let data: any =
            null;


          try {

            data =
              await response.json();

          } catch {

            throw new Error(
              'Invalid dashboard response from server.'
            );

          }


          if (
            !response.ok
          ) {

            throw new Error(
              data?.message ||
              'Unable to load dashboard.'
            );

          }


          setDashboard({

            revenue:
              Number(
                data?.revenue ||
                0
              ),

            orders:
              Number(
                data?.orders ||
                0
              ),

            users:
              Number(
                data?.users ||
                0
              ),

            products:
              Number(
                data?.products ||
                0
              ),

            recentOrders:
              Array.isArray(
                data?.recentOrders
              )
                ? data.recentOrders
                : [],

          });

        } catch (
          err
        ) {

          console.error(
            'Dashboard loading error:',
            err
          );


          setError(
            err instanceof Error
              ? err.message
              : 'Unable to load dashboard.'
          );

        } finally {

          setLoading(
            false
          );

          setRefreshing(
            false
          );

        }

      },
      [
        router,
      ]
    );


  /* =======================================================
     AUTH CHECK
  ======================================================= */

  useEffect(() => {

    const token =
      localStorage.getItem(
        'authToken'
      );


    const role =
      localStorage.getItem(
        'role'
      );


    if (!token) {

      router.replace(
        '/login'
      );

      return;

    }


    if (
      role !== 'admin'
    ) {

      router.replace(
        '/'
      );

      return;

    }


    setCheckingAuth(
      false
    );


    loadDashboard(
      token
    );

  }, [
    router,
    loadDashboard,
  ]);


  /* =======================================================
     MANUAL REFRESH
  ======================================================= */

  const handleRefresh = () => {

    const token =
      localStorage.getItem(
        'authToken'
      );


    if (!token) {

      router.replace(
        '/login'
      );

      return;

    }


    loadDashboard(
      token,
      true
    );

  };


  /* =======================================================
     STATUS
  ======================================================= */

  const formatStatus = (
    status?: string
  ) => {

    return (
      status ||
      'pending'
    )
      .replace(
        /_/g,
        ' '
      )
      .replace(
        /\b\w/g,
        (char) =>
          char.toUpperCase()
      );

  };


  /* =======================================================
     AUTH LOADING
  ======================================================= */

  if (
    checkingAuth
  ) {

    return (

      <main className="page">

        <div className="container">

          <div
            style={{
              minHeight:
                '50vh',

              display:
                'flex',

              alignItems:
                'center',

              justifyContent:
                'center',
            }}
          >

            <p className="muted">
              Checking admin access...
            </p>

          </div>

        </div>

      </main>

    );

  }


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
          Single-shop management
        </div>


        <div
          className="flex flex-wrap items-end justify-between gap-3"
        >

          <div>

            <h1 className="section-title !text-left !text-[42px]">
              Admin Dashboard
            </h1>


            <p className="muted">
              Shivaay Paridhan — one shop, one brand.
            </p>

          </div>


          {/* =================================================
              HEADER ACTIONS
          ================================================= */}

          <div
            style={{
              display:
                'flex',

              gap:
                8,

              flexWrap:
                'wrap',
            }}
          >

            {/* REFRESH */}

            <button
              type="button"
              className="btn btn-outline"
              onClick={
                handleRefresh
              }
              disabled={
                refreshing ||
                loggingOut
              }
              style={{
                display:
                  'flex',

                alignItems:
                  'center',

                gap:
                  7,

                opacity:
                  refreshing ||
                  loggingOut
                    ? 0.7
                    : 1,
              }}
            >

              <RefreshCw
                size={16}
              />

              {refreshing
                ? 'Refreshing...'
                : 'Refresh'}

            </button>


            {/* VIEW STORE */}

            <Link
              className="btn btn-outline"
              href="/"
              style={{
                display:
                  'flex',

                alignItems:
                  'center',

                gap:
                  7,

                pointerEvents:
                  loggingOut
                    ? 'none'
                    : 'auto',

                opacity:
                  loggingOut
                    ? 0.6
                    : 1,
              }}
            >

              View Store

            </Link>


            {/* LOGOUT */}

            <button
              type="button"
              className="btn btn-primary"
              onClick={
                handleLogoutClick
              }
              disabled={
                loggingOut
              }
              style={{
                display:
                  'flex',

                alignItems:
                  'center',

                gap:
                  7,

                opacity:
                  loggingOut
                    ? 0.7
                    : 1,

                cursor:
                  loggingOut
                    ? 'not-allowed'
                    : 'pointer',
              }}
            >

              <LogOut
                size={16}
              />

              Logout

            </button>

          </div>

        </div>


        {/* =================================================
            ERROR
        ================================================= */}

        {error && (

          <div
            className="mt-5 rounded-xl"
            style={{
              padding:
                '14px 16px',

              background:
                'rgba(118, 36, 56, 0.08)',

              color:
                '#762438',

              fontSize:
                13,
            }}
          >

            <span>
              {error}
            </span>


            <button
              type="button"
              onClick={
                handleRefresh
              }
              disabled={
                loggingOut
              }
              style={{
                marginLeft:
                  12,

                textDecoration:
                  'underline',

                fontWeight:
                  600,

                cursor:
                  'pointer',

                opacity:
                  loggingOut
                    ? 0.5
                    : 1,
              }}
            >
              Retry
            </button>

          </div>

        )}


        {/* =================================================
            STATS
        ================================================= */}

        <div className="stat-grid mt-7">

          <div className="stat">

            <CircleDollarSign
              className="text-[#762438]"
            />

            <span className="muted text-xs">
              Revenue
            </span>

            <strong>

              {loading
                ? '—'
                : formatCurrency(
                    dashboard.revenue
                  )}

            </strong>

          </div>


          <div className="stat">

            <ClipboardList
              className="text-[#762438]"
            />

            <span className="muted text-xs">
              Orders
            </span>

            <strong>

              {loading
                ? '—'
                : dashboard.orders}

            </strong>

          </div>


          <div className="stat">

            <Users
              className="text-[#762438]"
            />

            <span className="muted text-xs">
              Customers
            </span>

            <strong>

              {loading
                ? '—'
                : dashboard.users}

            </strong>

          </div>


          <div className="stat">

            <Box
              className="text-[#762438]"
            />

            <span className="muted text-xs">
              Products
            </span>

            <strong>

              {loading
                ? '—'
                : dashboard.products}

            </strong>

          </div>

        </div>


        {/* =================================================
            QUICK LINKS
        ================================================= */}

        <div
          className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >

          <AdminLink
            href="/admin/products"
            icon={
              <Box />
            }
            title="Products"
          />

          <AdminLink
            href="/admin/orders"
            icon={
              <ClipboardList />
            }
            title="Orders"
          />

          <AdminLink
            href="/admin/users"
            icon={
              <Users />
            }
            title="Customers"
          />

          <AdminLink
            href="/admin/coupons"
            icon={
              <Ticket />
            }
            title="Coupons"
          />

        </div>


        {/* =================================================
            SALES OVERVIEW
        ================================================= */}

        <div className="card mt-5 p-6">

          <div
            className="flex flex-wrap items-center justify-between gap-3"
          >

            <div>

              <span className="eyebrow">
                Analytics
              </span>

              <h2 className="serif text-2xl text-[#132b49]">
                Sales overview
              </h2>

            </div>

          </div>


          <div
            className="mt-6 grid h-44 place-items-center rounded-xl bg-[#f6eee2] text-sm muted"
          >

            <div
              style={{
                textAlign:
                  'center',
              }}
            >

              <ChartNoAxesCombined
                className="mx-auto mb-2 text-[#c7a35a]"
              />

              {loading
                ? 'Loading analytics...'
                : 'Live dashboard data connected.'}

            </div>

          </div>

        </div>


        {/* =================================================
            RECENT ORDERS
        ================================================= */}

        <div className="card mt-5 p-6">

          <div
            className="flex flex-wrap items-center justify-between gap-3"
          >

            <div>

              <span className="eyebrow">
                Latest activity
              </span>

              <h2 className="serif text-2xl text-[#132b49]">
                Recent Orders
              </h2>

            </div>


            <Link
              href="/admin/orders"
              className="text-sm font-semibold text-[#762438]"
            >
              View All →
            </Link>

          </div>


          {loading ? (

            <p className="muted mt-5">
              Loading recent orders...
            </p>

          ) : dashboard.recentOrders.length > 0 ? (

            <div
              className="mt-5"
              style={{
                overflowX:
                  'auto',
              }}
            >

              <table
                style={{
                  width:
                    '100%',

                  minWidth:
                    650,

                  borderCollapse:
                    'collapse',
                }}
              >

                <thead>

                  <tr>

                    <th className="admin-table-heading">
                      ORDER
                    </th>

                    <th className="admin-table-heading">
                      DATE
                    </th>

                    <th className="admin-table-heading">
                      AMOUNT
                    </th>

                    <th className="admin-table-heading">
                      STATUS
                    </th>

                    <th className="admin-table-heading">
                      VIEW
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {dashboard.recentOrders
                    .map(
                      (
                        order,
                        index
                      ) => (

                        <tr
                          key={
                            order._id ||
                            index
                          }
                        >

                          <td className="admin-table-cell">

                            {order._id ? (

                              <strong>
                                #
                                {String(
                                  order._id
                                ).slice(
                                  -6
                                )}
                              </strong>

                            ) : (
                              '—'
                            )}

                          </td>


                          <td className="admin-table-cell">

                            {
                              formatDate(
                                order.createdAt
                              )
                            }

                          </td>


                          <td className="admin-table-cell">

                            {
                              formatCurrency(
                                Number(
                                  order.total ||
                                  0
                                )
                              )
                            }

                          </td>


                          <td className="admin-table-cell">

                            <span
                              style={{
                                display:
                                  'inline-block',

                                padding:
                                  '4px 8px',

                                borderRadius:
                                  999,

                                background:
                                  'rgba(118, 36, 56, 0.08)',

                                color:
                                  '#762438',

                                fontSize:
                                  11,
                              }}
                            >

                              {
                                formatStatus(
                                  order.status
                                )
                              }

                            </span>

                          </td>


                          <td className="admin-table-cell">

                            {order._id ? (

                              <Link
                                href={`/admin/orders/${order._id}`}
                                className="text-link"
                              >
                                View
                              </Link>

                            ) : (
                              '—'
                            )}

                          </td>

                        </tr>

                      )
                    )}

                </tbody>

              </table>

            </div>

          ) : (

            <div
              className="mt-5 rounded-xl"
              style={{
                padding:
                  28,

                textAlign:
                  'center',

                background:
                  '#f6eee2',
              }}
            >

              <ClipboardList
                size={30}
                className="mx-auto mb-3 text-[#c7a35a]"
              />

              <p className="muted">
                No recent orders yet.
              </p>

            </div>

          )}

        </div>


        {/* =================================================
            PREMIUM LOGOUT CONFIRMATION MODAL
        ================================================= */}

        {showLogoutConfirm && (

          <div
            className="admin-logout-modal-overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-logout-title"
            onMouseDown={(
              event
            ) => {

              if (
                event.target ===
                event.currentTarget
              ) {

                closeLogoutConfirm();

              }

            }}
          >

            <div
              className="admin-logout-modal"
              onMouseDown={(
                event
              ) => {

                event.stopPropagation();

              }}
            >

              <button
                type="button"
                className="admin-logout-modal-close"
                onClick={
                  closeLogoutConfirm
                }
                disabled={
                  loggingOut
                }
                aria-label="Close"
              >

                <X
                  size={17}
                />

              </button>


              <div
                className="admin-logout-icon"
              >

                <ShieldAlert
                  size={24}
                />

              </div>


              <span className="eyebrow">
                Admin session
              </span>


              <h2
                id="admin-logout-title"
              >
                Log out of admin panel?
              </h2>


              <p>
                Are you sure you want to sign
                out of the Shivaay Paridhan
                admin dashboard?
              </p>


              <div
                className="admin-logout-actions"
              >

                <button
                  type="button"
                  className="admin-logout-cancel"
                  onClick={
                    closeLogoutConfirm
                  }
                  disabled={
                    loggingOut
                  }
                >
                  Stay Logged In
                </button>


                <button
                  type="button"
                  className="admin-logout-confirm"
                  onClick={
                    clearAuthAndLogin
                  }
                  disabled={
                    loggingOut
                  }
                >

                  {loggingOut ? (

                    <>
                      <RefreshCw
                        size={16}
                        className="animate-spin"
                      />

                      Logging out...
                    </>

                  ) : (

                    <>
                      <LogOut
                        size={16}
                      />

                      Logout
                    </>

                  )}

                </button>

              </div>

            </div>

          </div>

        )}

      </div>

    </main>

  );
}


/* =========================================================
   ADMIN QUICK LINK
========================================================= */

function AdminLink({
  href,
  icon,
  title,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
}) {

  return (

    <Link
      href={
        href
      }
      className="card flex items-center gap-4 p-5 transition-transform hover:-translate-y-1"
    >

      <span className="text-[#762438]">
        {icon}
      </span>

      <span className="serif text-xl text-[#132b49]">
        {title}
      </span>

    </Link>

  );

}