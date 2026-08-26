'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  CheckCircle2,
  Edit3,
  Plus,
  RefreshCw,
  Ticket,
  Trash2,
  X,
} from 'lucide-react';

import { useRouter } from 'next/navigation';


/* =========================================================
   API
========================================================= */

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:5000';


/* =========================================================
   TYPES
========================================================= */

type Coupon = {
  _id: string;

  code: string;

  discountType:
    | 'percentage'
    | 'fixed';

  discountValue: number;

  minOrderAmount: number;

  expiryDate: string;

  usageLimit:
    | number
    | null;

  usedCount: number;

  isActive: boolean;

  createdAt?: string;

  updatedAt?: string;
};


type CouponForm = {
  code: string;

  discountType:
    | 'percentage'
    | 'fixed';

  discountValue: string;

  minOrderAmount: string;

  expiryDate: string;

  usageLimit: string;

  isActive: boolean;
};


/* =========================================================
   INITIAL FORM
========================================================= */

const initialForm: CouponForm = {
  code: '',
  discountType: 'percentage',
  discountValue: '',
  minOrderAmount: '0',
  expiryDate: '',
  usageLimit: '',
  isActive: true,
};


/* =========================================================
   PAGE
========================================================= */

export default function Coupons() {

  const router = useRouter();


  /* =======================================================
     DATA
  ======================================================= */

  const [coupons, setCoupons] =
    useState<Coupon[]>([]);


  /* =======================================================
     LOADING
  ======================================================= */

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);


  /* =======================================================
     FORM
  ======================================================= */

  const [showForm, setShowForm] =
    useState(false);

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [form, setForm] =
    useState<CouponForm>(
      initialForm
    );

  const [submitting, setSubmitting] =
    useState(false);


  /* =======================================================
     DELETE MODAL
  ======================================================= */

  const [couponToDelete, setCouponToDelete] =
    useState<Coupon | null>(null);

  const [deletingId, setDeletingId] =
    useState<string | null>(null);


  /* =======================================================
     MESSAGES
  ======================================================= */

  const [error, setError] =
    useState('');

  const [successMessage, setSuccessMessage] =
    useState('');


  /* =======================================================
     AUTH
  ======================================================= */

  const clearSession =
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

      localStorage.removeItem(
        'rememberMe'
      );

      window.dispatchEvent(
        new Event(
          'auth-change'
        )
      );

    }, []);


  const handleAuthExpired =
    useCallback(() => {

      clearSession();

      router.replace(
        '/login'
      );

    }, [
      clearSession,
      router,
    ]);


  /* =======================================================
     LOAD COUPONS
  ======================================================= */

  const loadCoupons =
    useCallback(
      async (
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


          const response =
            await fetch(
              `${API_URL}/api/coupons`,
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


          if (
            response.status ===
            401
          ) {

            handleAuthExpired();

            return;
          }


          if (
            response.status ===
            403
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
              'Failed to load coupons.'
            );

          }


          if (
            !Array.isArray(
              data
            )
          ) {

            throw new Error(
              'Invalid coupons response from backend.'
            );

          }


          setCoupons(
            data
          );

        } catch (
          err
        ) {

          console.error(
            'Coupon loading error:',
            err
          );


          setError(
            err instanceof Error
              ? err.message
              : 'Unable to load coupons.'
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
        handleAuthExpired,
        router,
      ]
    );


  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {

    loadCoupons();

  }, [
    loadCoupons,
  ]);


  /* =======================================================
     ESCAPE TO CLOSE DELETE MODAL
  ======================================================= */

  useEffect(() => {

    if (
      !couponToDelete
    ) {

      return;

    }


    const handleKeyDown =
      (event: KeyboardEvent) => {

        if (
          event.key ===
          'Escape' &&
          !deletingId
        ) {

          setCouponToDelete(
            null
          );

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
    couponToDelete,
    deletingId,
  ]);


  /* =======================================================
     FORM CHANGE
  ======================================================= */

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement |
      HTMLSelectElement
    >
  ) => {

    const target =
      e.target;


    const name =
      target.name;


    if (
      target instanceof HTMLInputElement &&
      target.type === 'checkbox'
    ) {

      const checked =
        target.checked;


      setForm(
        (prev) => ({
          ...prev,

          [name]:
            checked,
        })
      );


      setError('');

      return;
    }


    const value =
      target.value;


    setForm(
      (prev) => ({
        ...prev,

        [name]:
          value,
      })
    );


    setError('');

  };


  /* =======================================================
     RESET FORM
  ======================================================= */

  const resetForm = () => {

    setForm(
      initialForm
    );

    setEditingId(
      null
    );

  };


  /* =======================================================
     CREATE
  ======================================================= */

  const openCreateForm = () => {

    resetForm();

    setError('');

    setSuccessMessage('');

    setShowForm(
      true
    );

  };


  /* =======================================================
     EDIT
  ======================================================= */

  const openEditForm = (
    coupon: Coupon
  ) => {

    setEditingId(
      coupon._id
    );


    setForm({

      code:
        coupon.code ||
        '',

      discountType:
        coupon.discountType ===
        'fixed'
          ? 'fixed'
          : 'percentage',

      discountValue:
        String(
          coupon.discountValue ??
          ''
        ),

      minOrderAmount:
        String(
          coupon.minOrderAmount ??
          0
        ),

      expiryDate:
        coupon.expiryDate
          ? new Date(
              coupon.expiryDate
            )
              .toISOString()
              .split(
                'T'
              )[0]
          : '',

      usageLimit:
        coupon.usageLimit ===
          null ||
        coupon.usageLimit ===
          undefined
          ? ''
          : String(
              coupon.usageLimit
            ),

      isActive:
        coupon.isActive !==
        false,

    });


    setError('');

    setSuccessMessage('');

    setShowForm(
      true
    );

  };


  /* =======================================================
     CLOSE FORM
  ======================================================= */

  const closeForm = () => {

    if (
      submitting
    ) {

      return;

    }


    setShowForm(
      false
    );

    resetForm();

    setError('');

  };


  /* =======================================================
     VALIDATE
  ======================================================= */

  const validateForm = () => {

    const code =
      form.code
        .trim()
        .toUpperCase();


    if (!code) {

      setError(
        'Please enter a coupon code.'
      );

      return false;

    }


    if (
      !/^[A-Z0-9_-]+$/.test(
        code
      )
    ) {

      setError(
        'Coupon code can contain only letters, numbers, hyphen and underscore.'
      );

      return false;

    }


    const discountValue =
      Number(
        form.discountValue
      );


    if (
      !Number.isFinite(
        discountValue
      ) ||
      discountValue <= 0
    ) {

      setError(
        'Please enter a valid discount value.'
      );

      return false;

    }


    if (
      form.discountType ===
        'percentage' &&
      discountValue > 100
    ) {

      setError(
        'Percentage discount cannot exceed 100%.'
      );

      return false;

    }


    const minOrder =
      Number(
        form.minOrderAmount ||
        0
      );


    if (
      !Number.isFinite(
        minOrder
      ) ||
      minOrder < 0
    ) {

      setError(
        'Minimum order amount cannot be negative.'
      );

      return false;

    }


    if (
      !form.expiryDate
    ) {

      setError(
        'Please select an expiry date.'
      );

      return false;

    }


    const expiry =
      new Date(
        `${form.expiryDate}T23:59:59`
      );


    if (
      Number.isNaN(
        expiry.getTime()
      )
    ) {

      setError(
        'Please select a valid expiry date.'
      );

      return false;

    }


    const usageLimit =
      form.usageLimit
        ? Number(
            form.usageLimit
          )
        : null;


    if (
      usageLimit !== null &&
      (
        !Number.isFinite(
          usageLimit
        ) ||
        usageLimit < 1
      )
    ) {

      setError(
        'Usage limit must be at least 1.'
      );

      return false;

    }


    setError('');

    return true;

  };


  /* =======================================================
     SAVE
  ======================================================= */

  const handleSubmit =
    async (
      e: React.FormEvent<HTMLFormElement>
    ) => {

      e.preventDefault();


      if (
        submitting
      ) {

        return;

      }


      if (
        !validateForm()
      ) {

        return;

      }


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

        setSubmitting(
          true
        );

        setError('');


        const editing =
          Boolean(
            editingId
          );


        const payload = {

          code:
            form.code
              .trim()
              .toUpperCase(),

          discountType:
            form.discountType,

          discountValue:
            Number(
              form.discountValue
            ),

          minOrderAmount:
            Number(
              form.minOrderAmount ||
              0
            ),

          expiryDate:
            new Date(
              `${form.expiryDate}T23:59:59`
            ).toISOString(),

          usageLimit:
            form.usageLimit
              ? Number(
                  form.usageLimit
                )
              : null,

          isActive:
            form.isActive,

        };


        const url =
          editing
            ? `${API_URL}/api/coupons/${editingId}`
            : `${API_URL}/api/coupons`;


        const response =
          await fetch(
            url,
            {
              method:
                editing
                  ? 'PUT'
                  : 'POST',

              headers: {
                'Content-Type':
                  'application/json',

                Authorization:
                  `Bearer ${token}`,

                Accept:
                  'application/json',
              },

              body:
                JSON.stringify(
                  payload
                ),

              cache:
                'no-store',
            }
          );


        if (
          response.status ===
          401
        ) {

          handleAuthExpired();

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

          data =
            null;

        }


        if (
          !response.ok
        ) {

          throw new Error(
            data?.message ||
            `Failed to ${
              editing
                ? 'update'
                : 'create'
            } coupon.`
          );

        }


        setShowForm(
          false
        );

        resetForm();


        await loadCoupons(
          true
        );


        setSuccessMessage(
          editing
            ? 'Coupon updated successfully.'
            : 'Coupon created successfully.'
        );


        window.setTimeout(
          () => {

            setSuccessMessage(
              ''
            );

          },
          3500
        );

      } catch (
        err
      ) {

        console.error(
          'Coupon save error:',
          err
        );


        setError(
          err instanceof Error
            ? err.message
            : 'Unable to save coupon.'
        );

      } finally {

        setSubmitting(
          false
        );

      }

    };


  /* =======================================================
     OPEN DELETE MODAL
  ======================================================= */

  const openDeleteConfirmation = (
    coupon: Coupon
  ) => {

    if (
      deletingId
    ) {

      return;

    }


    setError('');

    setSuccessMessage('');

    setCouponToDelete(
      coupon
    );

  };


  /* =======================================================
     CLOSE DELETE MODAL
  ======================================================= */

  const closeDeleteConfirmation = () => {

    if (
      deletingId
    ) {

      return;

    }


    setCouponToDelete(
      null
    );

  };


  /* =======================================================
     CONFIRM DELETE
  ======================================================= */

  const confirmDelete =
    async () => {

      const coupon =
        couponToDelete;


      if (
        !coupon ||
        deletingId
      ) {

        return;

      }


      const token =
        localStorage.getItem(
          'authToken'
        );


      if (!token) {

        setCouponToDelete(
          null
        );

        router.replace(
          '/login'
        );

        return;

      }


      try {

        setDeletingId(
          coupon._id
        );

        setError('');


        const response =
          await fetch(
            `${API_URL}/api/coupons/${coupon._id}`,
            {
              method:
                'DELETE',

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


        if (
          response.status ===
          401
        ) {

          setCouponToDelete(
            null
          );

          handleAuthExpired();

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

          data =
            null;

        }


        if (
          !response.ok
        ) {

          throw new Error(
            data?.message ||
            'Failed to delete coupon.'
          );

        }


        setCoupons(
          (prev) =>
            prev.filter(
              (item) =>
                item._id !==
                coupon._id
            )
        );


        setCouponToDelete(
          null
        );


        setSuccessMessage(
          data?.message ||
          'Coupon deleted successfully.'
        );


        window.setTimeout(
          () => {

            setSuccessMessage(
              ''
            );

          },
          3500
        );

      } catch (
        err
      ) {

        console.error(
          'Coupon delete error:',
          err
        );


        setCouponToDelete(
          null
        );


        setError(
          err instanceof Error
            ? err.message
            : 'Unable to delete coupon.'
        );

      } finally {

        setDeletingId(
          null
        );

      }

    };


  /* =======================================================
     ACTIVE COUPONS
  ======================================================= */

  const activeCoupons =
    useMemo(
      () => {

        return coupons.filter(
          (coupon) => {

            if (
              !coupon.isActive
            ) {

              return false;

            }


            if (
              !coupon.expiryDate
            ) {

              return false;

            }


            return (
              new Date(
                coupon.expiryDate
              ) >
              new Date()
            );

          }
        ).length;

      },
      [coupons]
    );


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
     RENDER
  ======================================================= */

  return (

    <main className="page">

      <div className="container">


        {/* =================================================
            HEADER
        ================================================= */}

        <div className="eyebrow">
          Promotions
        </div>


        <div
          className="flex flex-wrap items-end justify-between gap-3"
        >

          <div>

            <h1
              className="section-title !text-left !text-[42px]"
            >
              Coupons
            </h1>


            <p className="muted">

              {coupons.length}
              {' total · '}
              {activeCoupons}
              {' active'}

            </p>

          </div>


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

            <button
              type="button"
              className="btn btn-outline"
              onClick={() =>
                loadCoupons(true)
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

                gap:
                  7,
              }}
            >

              <RefreshCw
                size={16}
              />

              {refreshing
                ? 'Refreshing...'
                : 'Refresh'}

            </button>


            <button
              type="button"
              className="btn btn-primary"
              onClick={
                openCreateForm
              }
            >

              <Plus
                size={17}
              />

              Create Coupon

            </button>

          </div>

        </div>


        {/* =================================================
            SUCCESS
        ================================================= */}

        {successMessage && (

          <div
            className="premium-admin-success"
            role="status"
          >

            <CheckCircle2
              size={17}
            />

            <span>
              {successMessage}
            </span>


            <button
              type="button"
              onClick={() =>
                setSuccessMessage('')
              }
              aria-label="Close message"
            >

              <X
                size={15}
              />

            </button>

          </div>

        )}


        {/* =================================================
            ERROR
        ================================================= */}

        {error &&
          !showForm && (

            <div
              className="premium-admin-error"
            >

              <span>
                {error}
              </span>


              <button
                type="button"
                onClick={() =>
                  loadCoupons(true)
                }
              >
                Retry
              </button>

            </div>

          )}


        {/* =================================================
            FORM
        ================================================= */}

        {showForm && (

          <div
            className="card mt-6 p-6"
          >

            <div
              className="flex items-center justify-between gap-3"
            >

              <div>

                <span className="eyebrow">

                  {editingId
                    ? 'Edit promotion'
                    : 'New promotion'}

                </span>


                <h2
                  className="serif text-2xl text-[#132b49]"
                >

                  {editingId
                    ? 'Edit Coupon'
                    : 'Create Coupon'}

                </h2>

              </div>


              <button
                type="button"
                onClick={
                  closeForm
                }
                disabled={
                  submitting
                }
                aria-label="Close"
              >

                <X
                  size={21}
                />

              </button>

            </div>


            {error && (

              <div
                style={{
                  marginTop:
                    18,

                  padding:
                    '12px 14px',

                  borderRadius:
                    10,

                  background:
                    'rgba(118,36,56,.08)',

                  color:
                    '#762438',

                  fontSize:
                    13,
                }}
              >

                {error}

              </div>

            )}


            <form
              className="mt-5"
              onSubmit={
                handleSubmit
              }
            >

              <div className="admin-form-grid">


                {/* CODE */}

                <div className="admin-field">

                  <label>
                    Coupon Code *
                  </label>


                  <input
                    type="text"
                    name="code"
                    value={
                      form.code
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="SHIVAAY10"
                    required
                    disabled={
                      submitting
                    }
                    style={{
                      textTransform:
                        'uppercase',
                    }}
                  />

                </div>


                {/* TYPE */}

                <div className="admin-field">

                  <label>
                    Discount Type *
                  </label>


                  <select
                    name="discountType"
                    value={
                      form.discountType
                    }
                    onChange={
                      handleChange
                    }
                    disabled={
                      submitting
                    }
                  >

                    <option value="percentage">
                      Percentage
                    </option>

                    <option value="fixed">
                      Fixed Amount
                    </option>

                  </select>

                </div>


                {/* VALUE */}

                <div className="admin-field">

                  <label>
                    Discount Value *
                  </label>


                  <input
                    type="number"
                    name="discountValue"
                    value={
                      form.discountValue
                    }
                    onChange={
                      handleChange
                    }
                    placeholder={
                      form.discountType ===
                      'percentage'
                        ? '10'
                        : '500'
                    }
                    min="0"
                    step="1"
                    max={
                      form.discountType ===
                      'percentage'
                        ? 100
                        : undefined
                    }
                    required
                    disabled={
                      submitting
                    }
                  />

                </div>


                {/* MIN ORDER */}

                <div className="admin-field">

                  <label>
                    Minimum Order Amount (₹)
                  </label>


                  <input
                    type="number"
                    name="minOrderAmount"
                    value={
                      form.minOrderAmount
                    }
                    onChange={
                      handleChange
                    }
                    min="0"
                    step="1"
                    placeholder="0"
                    disabled={
                      submitting
                    }
                  />

                </div>


                {/* EXPIRY */}

                <div className="admin-field">

                  <label>
                    Expiry Date *
                  </label>


                  <input
                    type="date"
                    name="expiryDate"
                    value={
                      form.expiryDate
                    }
                    onChange={
                      handleChange
                    }
                    required
                    disabled={
                      submitting
                    }
                  />

                </div>


                {/* USAGE */}

                <div className="admin-field">

                  <label>
                    Usage Limit
                  </label>


                  <input
                    type="number"
                    name="usageLimit"
                    value={
                      form.usageLimit
                    }
                    onChange={
                      handleChange
                    }
                    min="1"
                    step="1"
                    placeholder="Unlimited"
                    disabled={
                      submitting
                    }
                  />

                </div>


                {/* ACTIVE */}

                <div
                  className="admin-field"
                  style={{
                    display:
                      'flex',

                    alignItems:
                      'center',

                    gap:
                      10,

                    alignSelf:
                      'end',
                  }}
                >

                  <input
                    id="isActive"
                    type="checkbox"
                    name="isActive"
                    checked={
                      form.isActive
                    }
                    onChange={
                      handleChange
                    }
                    disabled={
                      submitting
                    }
                    style={{
                      width:
                        18,

                      height:
                        18,
                    }}
                  />


                  <label
                    htmlFor="isActive"
                    style={{
                      margin:
                        0,
                    }}
                  >
                    Active Coupon
                  </label>

                </div>

              </div>


              {/* FORM ACTIONS */}

              <div
                style={{
                  display:
                    'flex',

                  justifyContent:
                    'flex-end',

                  gap:
                    10,

                  marginTop:
                    24,

                  flexWrap:
                    'wrap',
                }}
              >

                <button
                  type="button"
                  className="admin-cancel-btn"
                  onClick={
                    closeForm
                  }
                  disabled={
                    submitting
                  }
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  className="admin-add-product-btn"
                  disabled={
                    submitting
                  }
                >

                  {submitting
                    ? 'Saving...'
                    : editingId
                      ? 'Update Coupon'
                      : 'Create Coupon'}

                </button>

              </div>

            </form>

          </div>

        )}


        {/* =================================================
            COUPON LIST
        ================================================= */}

        <section
          className="mt-6"
        >

          {loading ? (

            <div
              className="card p-10 text-center"
            >

              <p className="muted">
                Loading coupons...
              </p>

            </div>

          ) : coupons.length === 0 ? (

            <div
              className="card p-10 text-center"
            >

              <Ticket
                size={36}
                className="mx-auto mb-4 text-[#c7a35a]"
              />


              <h2
                className="serif text-2xl text-[#132b49]"
              >
                No coupons yet
              </h2>


              <p className="muted mt-2">
                Create your first promotional coupon.
              </p>


              <button
                type="button"
                className="btn btn-primary"
                style={{
                  marginTop:
                    18,
                }}
                onClick={
                  openCreateForm
                }
              >

                <Plus
                  size={17}
                />

                Create Coupon

              </button>

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
                    950,
                }}
              >

                <thead>

                  <tr>

                    <th>
                      CODE
                    </th>

                    <th>
                      DISCOUNT
                    </th>

                    <th>
                      MIN ORDER
                    </th>

                    <th>
                      EXPIRY
                    </th>

                    <th>
                      USAGE
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

                  {coupons.map(
                    (
                      coupon
                    ) => {

                      const expired =
                        Boolean(
                          coupon.expiryDate
                        ) &&
                        new Date(
                          coupon.expiryDate
                        ) <
                        new Date();


                      return (

                        <tr
                          key={
                            coupon._id
                          }
                        >

                          <td>

                            <strong
                              style={{
                                color:
                                  '#762438',

                                letterSpacing:
                                  0.5,
                              }}
                            >

                              {
                                coupon.code
                              }

                            </strong>

                          </td>


                          <td>

                            {
                              coupon.discountType ===
                              'percentage'

                                ? `${coupon.discountValue}%`

                                : `₹${Number(
                                    coupon.discountValue
                                  ).toLocaleString(
                                    'en-IN'
                                  )}`

                            }

                          </td>


                          <td>

                            ₹
                            {Number(
                              coupon.minOrderAmount ||
                              0
                            ).toLocaleString(
                              'en-IN'
                            )}

                          </td>


                          <td>

                            {
                              formatDate(
                                coupon.expiryDate
                              )
                            }

                          </td>


                          <td>

                            {
                              coupon.usedCount ||
                              0
                            }

                            {' / '}

                            {
                              coupon.usageLimit ===
                                null ||
                              coupon.usageLimit ===
                                undefined
                                ? '∞'
                                : coupon.usageLimit
                            }

                          </td>


                          <td>

                            <span
                              style={{
                                display:
                                  'inline-flex',

                                padding:
                                  '5px 9px',

                                borderRadius:
                                  999,

                                fontSize:
                                  12,

                                background:
                                  coupon.isActive &&
                                  !expired
                                    ? 'rgba(34,197,94,0.10)'
                                    : 'rgba(0,0,0,0.06)',

                                color:
                                  coupon.isActive &&
                                  !expired
                                    ? '#166534'
                                    : 'var(--muted)',
                              }}
                            >

                              {expired
                                ? 'Expired'
                                : coupon.isActive
                                  ? 'Active'
                                  : 'Inactive'}

                            </span>

                          </td>


                          <td>

                            <div
                              style={{
                                display:
                                  'flex',

                                alignItems:
                                  'center',

                                gap:
                                  8,

                                flexWrap:
                                  'wrap',
                              }}
                            >

                              <button
                                type="button"
                                className="btn btn-outline"
                                onClick={() =>
                                  openEditForm(
                                    coupon
                                  )
                                }
                                disabled={
                                  deletingId ===
                                  coupon._id
                                }
                                style={{
                                  padding:
                                    '7px 10px',

                                  display:
                                    'inline-flex',

                                  alignItems:
                                    'center',

                                  gap:
                                    5,
                                }}
                              >

                                <Edit3
                                  size={15}
                                />

                                Edit

                              </button>


                              <button
                                type="button"
                                className="btn"
                                onClick={() =>
                                  openDeleteConfirmation(
                                    coupon
                                  )
                                }
                                disabled={
                                  deletingId ===
                                  coupon._id
                                }
                                title="Delete coupon"
                                aria-label={
                                  `Delete ${coupon.code}`
                                }
                                style={{
                                  padding:
                                    '7px 10px',

                                  display:
                                    'inline-flex',

                                  alignItems:
                                    'center',

                                  gap:
                                    5,

                                  background:
                                    '#fee2e2',

                                  color:
                                    '#b91c1c',

                                  border:
                                    '1px solid #fecaca',

                                  cursor:
                                    'pointer',
                                }}
                              >

                                <Trash2
                                  size={15}
                                />

                                {deletingId ===
                                coupon._id
                                  ? 'Deleting...'
                                  : 'Delete'}

                              </button>

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


        {/* =================================================
            PREMIUM DELETE CONFIRMATION MODAL
        ================================================= */}

        {couponToDelete && (

          <div
            className="admin-coupon-delete-overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="coupon-delete-title"
            onMouseDown={(
              event
            ) => {

              if (
                event.target ===
                event.currentTarget
              ) {

                closeDeleteConfirmation();

              }

            }}
          >

            <div
              className="admin-coupon-delete-modal"
              onMouseDown={(
                event
              ) => {

                event.stopPropagation();

              }}
            >

              <button
                type="button"
                className="admin-coupon-delete-close"
                onClick={
                  closeDeleteConfirmation
                }
                disabled={
                  Boolean(
                    deletingId
                  )
                }
                aria-label="Close"
              >

                <X
                  size={17}
                />

              </button>


              <div
                className="admin-coupon-delete-icon"
              >

                <Trash2
                  size={24}
                />

              </div>


              <span className="eyebrow">
                Promotion action
              </span>


              <h2
                id="coupon-delete-title"
              >
                Delete this coupon?
              </h2>


              <p>

                This will permanently remove

                <strong>
                  {' '}
                  {couponToDelete.code}
                </strong>

                {' '}
                from your coupon list.

              </p>


              <div
                className="admin-coupon-delete-preview"
              >

                <div
                  className="admin-coupon-delete-badge"
                >

                  <Ticket
                    size={20}
                  />

                </div>


                <div>

                  <strong>
                    {couponToDelete.code}
                  </strong>

                  <span>

                    {
                      couponToDelete.discountType ===
                      'percentage'
                        ? `${couponToDelete.discountValue}% discount`
                        : `₹${Number(
                            couponToDelete.discountValue
                          ).toLocaleString(
                            'en-IN'
                          )} discount`
                    }

                  </span>

                </div>

              </div>


              <div
                className="admin-coupon-delete-actions"
              >

                <button
                  type="button"
                  className="admin-coupon-delete-cancel"
                  onClick={
                    closeDeleteConfirmation
                  }
                  disabled={
                    Boolean(
                      deletingId
                    )
                  }
                >
                  Cancel
                </button>


                <button
                  type="button"
                  className="admin-coupon-delete-confirm"
                  onClick={
                    confirmDelete
                  }
                  disabled={
                    Boolean(
                      deletingId
                    )
                  }
                >

                  {deletingId ? (

                    <>
                      <RefreshCw
                        size={16}
                        className="animate-spin"
                      />

                      Deleting...
                    </>

                  ) : (

                    <>
                      <Trash2
                        size={16}
                      />

                      Delete Coupon
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