'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Mail,
  Phone,
  RefreshCw,
  Search,
  Shield,
  UserRound,
} from 'lucide-react';

import { useRouter } from 'next/navigation';


/* =========================================================
   API
========================================================= */

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:5000';


/* =========================================================
   USER TYPE
========================================================= */

type AdminUser = {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  createdAt?: string;
};


/* =========================================================
   ADMIN USERS PAGE
========================================================= */

export default function AdminUsers() {
  const router = useRouter();


  /* =======================================================
     USERS
  ======================================================= */

  const [users, setUsers] =
    useState<AdminUser[]>([]);


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
     SEARCH
  ======================================================= */

  const [search, setSearch] =
    useState('');


  /* =======================================================
     AUTH EXPIRED
  ======================================================= */

  const handleAuthExpired =
    useCallback(() => {
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
        new Event('auth-change')
      );

      router.replace(
        '/login'
      );
    }, [router]);


  /* =======================================================
     LOAD USERS
  ======================================================= */

  const loadUsers =
    useCallback(
      async (
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
              `${API_URL}/api/users`,
              {
                method: 'GET',

                headers: {
                  Accept:
                    'application/json',
                  Authorization:
                    `Bearer ${
                      localStorage.getItem(
                        'authToken'
                      ) || ''
                    }`,
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
            handleAuthExpired();
            return;
          }


          /* =========================================
             NOT ADMIN
          ========================================= */

          if (
            response.status === 403
          ) {
            router.replace('/');
            return;
          }


          let data: unknown =
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
            const message =
              typeof data === 'object' &&
              data !== null &&
              'message' in data
                ? String(
                    (
                      data as {
                        message?: unknown;
                      }
                    ).message ||
                      'Failed to load customers.'
                  )
                : 'Failed to load customers.';

            throw new Error(
              message
            );
          }


          if (
            !Array.isArray(data)
          ) {
            throw new Error(
              'Invalid users response from backend.'
            );
          }


          setUsers(
            data as AdminUser[]
          );

        } catch (err) {
          console.error(
            'Users loading error:',
            err
          );

          setError(
            err instanceof Error
              ? err.message
              : 'Unable to load customers.'
          );

        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [
        handleAuthExpired,
        router,
      ]
    );


  /* =======================================================
     AUTH CHECK + INITIAL LOAD
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


    loadUsers();
  }, [
    router,
    loadUsers,
  ]);


  /* =======================================================
     REFRESH
  ======================================================= */

  const handleRefresh = () => {
    loadUsers(true);
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
      new Date(value);


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
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }
    );
  };


  /* =======================================================
     FILTER USERS
  ======================================================= */

  const filteredUsers =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();


      if (!query) {
        return users;
      }


      return users.filter(
        (user) =>
          user.name
            ?.toLowerCase()
            .includes(query) ||

          user.email
            ?.toLowerCase()
            .includes(query) ||

          user.phone
            ?.toLowerCase()
            .includes(query) ||

          user.role
            ?.toLowerCase()
            .includes(query)
      );
    }, [
      users,
      search,
    ]);


  /* =======================================================
     INITIAL LOADING
  ======================================================= */

  if (
    loading &&
    users.length === 0 &&
    !error
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
              Loading customers...
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
          Customer management
        </div>


        <div
          className="flex flex-wrap items-end justify-between gap-3"
        >
          <div>
            <h1
              className="section-title !text-left !text-[42px]"
            >
              Customers
            </h1>

            <p className="muted">
              {filteredUsers.length ===
              users.length
                ? `${users.length} ${
                    users.length === 1
                      ? 'customer'
                      : 'customers'
                  } registered.`
                : `${filteredUsers.length} of ${
                    users.length
                  } customers shown.`}
            </p>
          </div>


          <button
            type="button"
            className="btn btn-outline"
            onClick={
              handleRefresh
            }
            disabled={
              loading ||
              refreshing
            }
            style={{
              display:
                'flex',

              alignItems:
                'center',

              gap: 8,
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
            SEARCH
        ================================================= */}

        <div
          className="card mt-6 p-4"
        >
          <div
            style={{
              position:
                'relative',
            }}
          >
            <Search
              size={18}
              style={{
                position:
                  'absolute',

                left:
                  13,

                top:
                  '50%',

                transform:
                  'translateY(-50%)',

                color:
                  'var(--muted)',
              }}
            />

            <input
              type="search"
              value={
                search
              }
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="Search by name, email, phone or role..."
              style={{
                width:
                  '100%',

                paddingLeft:
                  40,
              }}
            />
          </div>
        </div>


        {/* =================================================
            USERS
        ================================================= */}

        <section
          className="mt-6"
        >
          {filteredUsers.length ===
          0 ? (

            <div
              className="card p-10 text-center"
            >
              <UserRound
                size={36}
                className="mx-auto mb-4 text-[#c7a35a]"
              />

              <h2
                className="serif text-2xl text-[#132b49]"
              >
                {users.length === 0
                  ? 'No customers found'
                  : 'No matching customers'}
              </h2>

              <p className="muted mt-2">
                {users.length === 0
                  ? 'Registered users will appear here.'
                  : 'Try a different search term.'}
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
                    820,
                }}
              >
                <thead>
                  <tr>
                    <th>
                      CUSTOMER
                    </th>

                    <th>
                      EMAIL
                    </th>

                    <th>
                      PHONE
                    </th>

                    <th>
                      ROLE
                    </th>

                    <th>
                      JOINED
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredUsers.map(
                    (
                      user,
                      index
                    ) => {

                      const userId =
                        user._id ||
                        user.id ||
                        `user-${index}`;

                      const isAdmin =
                        user.role ===
                        'admin';

                      const initial =
                        user.name
                          ?.trim()
                          ?.charAt(0)
                          ?.toUpperCase() ||
                        'U';


                      return (
                        <tr
                          key={
                            userId
                          }
                        >

                          {/* CUSTOMER */}

                          <td>
                            <div
                              className="admin-product-info"
                            >
                              <div
                                className="admin-product-placeholder"
                                style={{
                                  flex:
                                    '0 0 42px',

                                  width:
                                    42,

                                  height:
                                    42,

                                  borderRadius:
                                    '50%',
                                }}
                              >
                                <span>
                                  {
                                    initial
                                  }
                                </span>
                              </div>


                              <div
                                className="admin-product-details"
                              >
                                <strong>
                                  {user.name ||
                                    'Unnamed User'}
                                </strong>

                                <small>
                                  ID:{' '}
                                  {String(
                                    userId
                                  ).slice(
                                    -8
                                  )}
                                </small>
                              </div>
                            </div>
                          </td>


                          {/* EMAIL */}

                          <td>
                            {user.email ? (
                              <a
                                href={`mailto:${user.email}`}
                                style={{
                                  display:
                                    'inline-flex',

                                  alignItems:
                                    'center',

                                  gap: 6,
                                }}
                              >
                                <Mail
                                  size={15}
                                />

                                {
                                  user.email
                                }
                              </a>
                            ) : (
                              '—'
                            )}
                          </td>


                          {/* PHONE */}

                          <td>
                            {user.phone ? (
                              <a
                                href={`tel:${user.phone}`}
                                style={{
                                  display:
                                    'inline-flex',

                                  alignItems:
                                    'center',

                                  gap: 6,
                                }}
                              >
                                <Phone
                                  size={15}
                                />

                                {
                                  user.phone
                                }
                              </a>
                            ) : (
                              '—'
                            )}
                          </td>


                          {/* ROLE */}

                          <td>
                            <span
                              style={{
                                display:
                                  'inline-flex',

                                alignItems:
                                  'center',

                                gap: 5,

                                padding:
                                  '5px 9px',

                                borderRadius:
                                  999,

                                fontSize:
                                  12,

                                background:
                                  isAdmin
                                    ? 'rgba(118, 36, 56, 0.10)'
                                    : 'rgba(0, 0, 0, 0.05)',

                                color:
                                  isAdmin
                                    ? '#762438'
                                    : 'var(--text)',
                              }}
                            >
                              {isAdmin && (
                                <Shield
                                  size={13}
                                />
                              )}

                              {
                                user.role ||
                                'user'
                              }
                            </span>
                          </td>


                          {/* JOINED */}

                          <td>
                            {
                              formatDate(
                                user.createdAt
                              )
                            }
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