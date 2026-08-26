'use client';

import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import Link from 'next/link';

import {
  ArrowRight,
  Eye,
  RefreshCw,
  ShoppingBag,
} from 'lucide-react';

import { useRouter } from 'next/navigation';


/* =========================================================
   API
========================================================= */

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:5000';


/* =========================================================
   ORDER STATUSES
========================================================= */

const ORDER_STATUSES = [
  'pending',
  'pending_whatsapp',
  'confirmed',
  'shipped',
  'delivered',
  'cancelled',
] as const;

type OrderStatus =
  (typeof ORDER_STATUSES)[number];


/* =========================================================
   CUSTOMER
========================================================= */

type Customer = {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  pinCode?: string;
};


/* =========================================================
   ORDER ITEM
========================================================= */

type OrderItem = {
  productId?: string;
  id?: string;
  name?: string;
  quantity?: number;
  qty?: number;
  price?: number;
  image?: string;
  images?: string[];
};


/* =========================================================
   ORDER
========================================================= */

type AdminOrder = {
  _id: string;

  orderId?: string;

  userId?: string | null;

  customer?: Customer;

  items?: OrderItem[];

  total?: number;

  paymentMethod?: string;

  orderSource?: string;

  status?: string;

  createdAt?: string;

  updatedAt?: string;
};


/* =========================================================
   PAGE
========================================================= */

export default function AdminOrders() {

  const router =
    useRouter();


  /* =======================================================
     AUTH
  ======================================================= */

  const [checkingAuth, setCheckingAuth] =
    useState(true);


  /* =======================================================
     ORDERS
  ======================================================= */

  const [orders, setOrders] =
    useState<AdminOrder[]>([]);


  /* =======================================================
     LOADING
  ======================================================= */

  const [loading, setLoading] =
    useState(true);


  const [refreshing, setRefreshing] =
    useState(false);


  /* =======================================================
     ERROR
  ======================================================= */

  const [error, setError] =
    useState('');


  /* =======================================================
     UPDATING
  ======================================================= */

  const [updatingOrderId, setUpdatingOrderId] =
    useState<string | null>(null);


  /* =======================================================
     AUTH CLEAR
  ======================================================= */

  const clearAuthAndLogin = () => {

    localStorage.removeItem(
      'authToken'
    );

    localStorage.removeItem(
      'role'
    );

    localStorage.removeItem(
      'currentUser'
    );

    window.dispatchEvent(
      new Event(
        'auth-change'
      )
    );

    router.replace(
      '/login'
    );

  };


  /* =======================================================
     LOAD ORDERS
  ======================================================= */

  const loadOrders =
    useCallback(
      async (
        token: string,
        isRefresh = false
      ) => {

        try {

          if (isRefresh) {
            setRefreshing(true);
          } else {
            setLoading(true);
          }

          setError('');


          const response =
            await fetch(
              `${API_URL}/api/orders`,
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
             AUTH
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
              'Invalid response received from backend.'
            );

          }


          if (
            !response.ok
          ) {

            throw new Error(
              data?.message ||
              'Failed to load orders.'
            );

          }


          if (
            !Array.isArray(data)
          ) {

            throw new Error(
              'Invalid orders response from backend.'
            );

          }


          setOrders(
            data
          );

        } catch (err) {

          console.error(
            'Order loading error:',
            err
          );


          setError(
            err instanceof Error
              ? err.message
              : 'Unable to load orders.'
          );

        } finally {

          setLoading(false);
          setRefreshing(false);

        }

      },
      [router]
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


    loadOrders(
      token
    );

  }, [
    router,
    loadOrders,
  ]);


  /* =======================================================
     REFRESH
  ======================================================= */

  const handleRefresh =
    () => {

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


      loadOrders(
        token,
        true
      );

    };


  /* =======================================================
     UPDATE STATUS
  ======================================================= */

  const handleStatusChange =
    async (
      orderId: string,
      status: OrderStatus
    ) => {

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


      try {

        setUpdatingOrderId(
          orderId
        );


        const response =
          await fetch(
            `${API_URL}/api/orders/${orderId}/status`,
            {
              method:
                'PUT',

              headers: {
                'Content-Type':
                  'application/json',

                Authorization:
                  `Bearer ${token}`,

                Accept:
                  'application/json',
              },

              body:
                JSON.stringify({
                  status,
                }),

              cache:
                'no-store',
            }
          );


        if (
          response.status ===
          401
        ) {

          clearAuthAndLogin();

          return;

        }


        if (
          response.status ===
          403
        ) {

          throw new Error(
            'Admin access required.'
          );

        }


        let data: any =
          null;


        try {

          data =
            await response.json();

        } catch {

          data = null;

        }


        if (
          !response.ok
        ) {

          throw new Error(
            data?.message ||
            'Failed to update order status.'
          );

        }


        const updatedOrder =
          data?.order;


        if (
          updatedOrder
        ) {

          setOrders(
            (previous) =>
              previous.map(
                (order) =>
                  order._id ===
                  orderId
                    ? {
                        ...order,
                        ...updatedOrder,
                      }
                    : order
              )
          );

        } else {

          await loadOrders(
            token,
            true
          );

        }

      } catch (err) {

        console.error(
          'Order status update error:',
          err
        );


        alert(
          err instanceof Error
            ? err.message
            : 'Unable to update order status.'
        );

      } finally {

        setUpdatingOrderId(
          null
        );

      }

    };


  /* =======================================================
     FORMAT CURRENCY
  ======================================================= */

  const formatCurrency =
    (
      value?: number
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

  const formatDate =
    (
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
     STATUS LABEL
  ======================================================= */

  const getStatusLabel =
    (
      status?: string
    ) => {

      if (!status) {
        return 'Pending';
      }


      return status
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
     STATUS CLASS
  ======================================================= */

  const getStatusClass =
    (
      status?: string
    ) => {

      switch (
        status
      ) {

        case 'confirmed':
          return 'order-status-confirmed';

        case 'shipped':
          return 'order-status-shipped';

        case 'delivered':
          return 'order-status-delivered';

        case 'cancelled':
          return 'order-status-cancelled';

        case 'pending_whatsapp':
          return 'order-status-whatsapp';

        default:
          return 'order-status-pending';

      }

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
          Order management
        </div>


        <div
          className="flex flex-wrap items-end justify-between gap-3"
        >

          <div>

            <h1 className="section-title !text-left !text-[42px]">
              Orders
            </h1>

            <p className="muted">
              Manage customer orders and update
              their delivery status.
            </p>

          </div>


          <button
            type="button"
            className="btn btn-outline"
            onClick={
              handleRefresh
            }
            disabled={
              refreshing
            }
            style={{
              display:
                'flex',

              alignItems:
                'center',

              gap:
                8,
            }}
          >

            <RefreshCw
              size={16}
            />

            {refreshing
              ? 'Refreshing...'
              : 'Refresh'}

          </button>

        </div>


        {/* =================================================
            ERROR
        ================================================= */}

        {error && (

          <div
            className="card mt-5 p-4"
            style={{
              background:
                'rgba(118, 36, 56, 0.06)',

              color:
                '#762438',
            }}
          >

            <div
              className="flex items-center justify-between gap-3"
            >

              <span>
                {error}
              </span>


              <button
                type="button"
                onClick={
                  handleRefresh
                }
                className="font-semibold underline"
              >
                Retry
              </button>

            </div>

          </div>

        )}


        {/* =================================================
            ORDERS
        ================================================= */}

        <section className="mt-7">

          {loading ? (

            <div className="card p-10 text-center">

              <div
                className="products-loading-spinner"
                style={{
                  margin:
                    '0 auto 14px',
                }}
              />

              <p className="muted">
                Loading orders...
              </p>

            </div>


          ) : orders.length === 0 ? (

            <div className="card p-10 text-center">

              <ShoppingBag
                size={34}
                className="mx-auto mb-4 text-[#c7a35a]"
              />


              <h2 className="serif text-2xl text-[#132b49]">
                No orders yet
              </h2>


              <p className="muted mt-2">
                Customer orders will appear here
                after they are placed.
              </p>

            </div>


          ) : (

            <div
              className="card"
              style={{
                overflowX:
                  'auto',
              }}
            >

              <table
                className="products-table"
                style={{
                  minWidth:
                    1050,
                }}
              >

                <thead>

                  <tr>

                    <th>
                      ORDER
                    </th>

                    <th>
                      CUSTOMER
                    </th>

                    <th>
                      ITEMS
                    </th>

                    <th>
                      TOTAL
                    </th>

                    <th>
                      PAYMENT
                    </th>

                    <th>
                      DATE
                    </th>

                    <th>
                      STATUS
                    </th>

                    <th>
                      ACTION
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {orders.map(
                    (order) => {

                      const itemCount =
                        (
                          order.items ||
                          []
                        ).reduce(
                          (
                            total,
                            item
                          ) =>
                            total +
                            Number(
                              item.quantity ??
                              item.qty ??
                              1
                            ),
                          0
                        );


                      return (

                        <tr
                          key={
                            order._id
                          }
                        >


                          {/* ORDER */}

                          <td>

                            <div>

                              <strong>
                                {order.orderId
                                  ? `#${order.orderId}`
                                  : `#${String(
                                      order._id
                                    ).slice(
                                      -8
                                    )}`}
                              </strong>


                              {order.orderSource && (

                                <small
                                  style={{
                                    display:
                                      'block',

                                    marginTop:
                                      4,

                                    textTransform:
                                      'capitalize',

                                    color:
                                      'var(--muted)',
                                  }}
                                >
                                  {
                                    order.orderSource
                                  }
                                </small>

                              )}

                            </div>

                          </td>


                          {/* CUSTOMER */}

                          <td>

                            <div>

                              <strong>
                                {
                                  order.customer?.name ||
                                  'Guest'
                                }
                              </strong>


                              {order.customer?.email && (

                                <small
                                  style={{
                                    display:
                                      'block',

                                    marginTop:
                                      4,
                                  }}
                                >
                                  {
                                    order.customer.email
                                  }
                                </small>

                              )}


                              {order.customer?.phone && (

                                <small
                                  style={{
                                    display:
                                      'block',

                                    marginTop:
                                      2,
                                  }}
                                >
                                  {
                                    order.customer.phone
                                  }
                                </small>

                              )}

                            </div>

                          </td>


                          {/* ITEMS */}

                          <td>

                            {itemCount}{' '}

                            {itemCount === 1
                              ? 'item'
                              : 'items'}

                          </td>


                          {/* TOTAL */}

                          <td>

                            <strong>
                              {formatCurrency(
                                order.total
                              )}
                            </strong>

                          </td>


                          {/* PAYMENT */}

                          <td>

                            <span
                              style={{
                                textTransform:
                                  'uppercase',

                                fontSize:
                                  12,
                              }}
                            >
                              {
                                order.paymentMethod ||
                                '—'
                              }
                            </span>

                          </td>


                          {/* DATE */}

                          <td>

                            {
                              formatDate(
                                order.createdAt
                              )
                            }

                          </td>


                          {/* STATUS */}

                          <td>

                            <span
                              className={
                                `order-status-pill ${
                                  getStatusClass(
                                    order.status
                                  )
                                }`
                              }
                            >
                              {
                                getStatusLabel(
                                  order.status
                                )
                              }
                            </span>

                          </td>


                          {/* ACTIONS */}

                          <td>

                            <div
                              style={{
                                display:
                                  'flex',

                                alignItems:
                                  'center',

                                gap:
                                  8,
                              }}
                            >

                              <select
                                value={
                                  ORDER_STATUSES.includes(
                                    order.status as OrderStatus
                                  )
                                    ? order.status
                                    : 'pending'
                                }
                                onChange={(
                                  event
                                ) =>
                                  handleStatusChange(
                                    order._id,
                                    event.target.value as OrderStatus
                                  )
                                }
                                disabled={
                                  updatingOrderId ===
                                  order._id
                                }
                                aria-label={
                                  `Update status for ${
                                    order.orderId ||
                                    order._id
                                  }`
                                }
                                style={{
                                  minWidth:
                                    150,
                                }}
                              >

                                {ORDER_STATUSES.map(
                                  (
                                    status
                                  ) => (

                                    <option
                                      key={
                                        status
                                      }
                                      value={
                                        status
                                      }
                                    >
                                      {
                                        getStatusLabel(
                                          status
                                        )
                                      }
                                    </option>

                                  )
                                )}

                              </select>


                              <Link
                                href={
                                  `/admin/orders/${order._id}`
                                }
                                className="text-[#762438]"
                                title="View order"
                                aria-label="View order"
                              >

                                <Eye
                                  size={
                                    17
                                  }
                                />

                              </Link>

                            </div>

                          </td>

                        </tr>

                      );

                    }
                  )}

                </tbody>

              </table>

            </div>

          )}

        </section>

      </div>

    </main>

  );
}