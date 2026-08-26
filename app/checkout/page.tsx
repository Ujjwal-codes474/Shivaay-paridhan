'use client';

import Link from 'next/link';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  CheckCircle2,
  LoaderCircle,
  MapPin,
  PackageCheck,
  MessageCircle,
} from 'lucide-react';

import {
  useCart,
} from '../../store/useCart';


/* =========================================================
   API
========================================================= */

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:5000';


/* =========================================================
   WHATSAPP
========================================================= */

const WHATSAPP_NUMBER =
  '918448460446';


/* =========================================================
   FORM TYPE
========================================================= */

type CheckoutForm = {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
};


/* =========================================================
   INITIAL FORM
========================================================= */

const initialForm: CheckoutForm = {
  name: '',
  phone: '',
  email: '',
  address: '',
  city: '',
  state: '',
  pinCode: '',
};


/* =========================================================
   CHECKOUT
========================================================= */

export default function Checkout() {

  const items =
    useCart(
      (state) =>
        state.items
    );

  const clearCart =
    useCart(
      (state) =>
        state.clear
    );


  /* =======================================================
     FORM
  ======================================================= */

  const [form, setForm] =
    useState<CheckoutForm>(
      initialForm
    );


  /* =======================================================
     UI
  ======================================================= */

  const [loading, setLoading] =
    useState(false);

  const [whatsappLoading, setWhatsappLoading] =
    useState(false);

  const [error, setError] =
    useState('');

  const [done, setDone] =
    useState(false);

  const [orderId, setOrderId] =
    useState('');

  const [orderMode, setOrderMode] =
    useState<'website' | 'whatsapp'>(
      'website'
    );


  /* =======================================================
     PIN LOOKUP
  ======================================================= */

  const [pinLoading, setPinLoading] =
    useState(false);

  const [pinError, setPinError] =
    useState('');


  /* =======================================================
     TOTALS
  ======================================================= */

  const subtotal =
    useMemo(
      () =>
        items.reduce(
          (
            total,
            item
          ) =>
            total +
            Number(
              item.product.price ||
              0
            ) *
              item.qty,
          0
        ),
      [items]
    );


  const shipping =
    subtotal >= 999 ||
    subtotal === 0
      ? 0
      : 99;


  const total =
    subtotal +
    shipping;


  /* =======================================================
     LOAD LOGGED-IN USER
  ======================================================= */

  useEffect(() => {

    try {

      const savedUser =
        localStorage.getItem(
          'currentUser'
        );

      if (!savedUser) {
        return;
      }

      const user =
        JSON.parse(
          savedUser
        );

      setForm(
        (prev) => ({
          ...prev,

          name:
            prev.name ||
            user?.name ||
            '',

          phone:
            prev.phone ||
            user?.phone ||
            '',

          email:
            prev.email ||
            user?.email ||
            '',
        })
      );

    } catch (err) {

      console.error(
        'Checkout user data error:',
        err
      );

    }

  }, []);


  /* =======================================================
     PIN LOOKUP
  ======================================================= */

  const lookupPinCode =
    async (
      pinCode: string
    ) => {

      try {

        setPinLoading(
          true
        );

        setPinError('');


        setForm(
          (prev) => ({
            ...prev,
            city: '',
            state: '',
          })
        );


        const response =
          await fetch(
            `${API_URL}/api/pincode/${pinCode}`,
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
            'Unable to find this PIN code.'
          );

        }


        const city =
          String(
            data?.city ||
            data?.district ||
            ''
          ).trim();


        const state =
          String(
            data?.state ||
            ''
          ).trim();


        if (
          !city ||
          !state
        ) {

          throw new Error(
            'Location details were not found for this PIN code.'
          );

        }


        setForm(
          (prev) => ({
            ...prev,
            city,
            state,
          })
        );


      } catch (err) {

        console.error(
          'PIN lookup error:',
          err
        );


        setForm(
          (prev) => ({
            ...prev,
            city: '',
            state: '',
          })
        );


        setPinError(
          err instanceof Error
            ? err.message
            : 'Unable to find this PIN code.'
        );


      } finally {

        setPinLoading(
          false
        );

      }

    };


  /* =======================================================
     FORM CHANGE
  ======================================================= */

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {

    const {
      name,
      value,
    } = e.target;


    if (
      name === 'pinCode'
    ) {

      const pinCode =
        value
          .replace(
            /\D/g,
            ''
          )
          .slice(
            0,
            6
          );


      setForm(
        (prev) => ({
          ...prev,

          pinCode,

          city:
            pinCode.length === 6
              ? prev.city
              : '',

          state:
            pinCode.length === 6
              ? prev.state
              : '',
        })
      );


      setPinError('');
      setError('');


      if (
        pinCode.length === 6
      ) {

        lookupPinCode(
          pinCode
        );

      }

      return;

    }


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
     VALIDATION
  ======================================================= */

  const validateForm = () => {

    if (
      !form.name.trim()
    ) {

      return 'Please enter your full name.';

    }


    if (
      !form.phone.trim()
    ) {

      return 'Please enter your phone number.';

    }


    const phoneDigits =
      form.phone.replace(
        /\D/g,
        ''
      );


    if (
      phoneDigits.length <
      10
    ) {

      return 'Please enter a valid phone number.';

    }


    if (
      !form.email.trim()
    ) {

      return 'Please enter your email address.';

    }


    const emailValid =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        form.email.trim()
      );


    if (
      !emailValid
    ) {

      return 'Please enter a valid email address.';

    }


    if (
      !form.address.trim()
    ) {

      return 'Please enter your delivery address.';

    }


    if (
      !form.pinCode.trim()
    ) {

      return 'Please enter your PIN code.';

    }


    const pinDigits =
      form.pinCode.replace(
        /\D/g,
        ''
      );


    if (
      pinDigits.length !==
      6
    ) {

      return 'Please enter a valid 6-digit PIN code.';

    }


    if (
      pinError
    ) {

      return pinError;

    }


    if (
      !form.city.trim()
    ) {

      return 'Please wait for the city to be detected from the PIN code.';

    }


    if (
      !form.state.trim()
    ) {

      return 'Please wait for the state to be detected from the PIN code.';

    }


    if (
      pinLoading
    ) {

      return 'Please wait for the PIN code verification to finish.';

    }


    return '';

  };


  /* =======================================================
     CREATE ORDER ITEMS
  ======================================================= */

  const buildOrderItems = () => {

    return items.map(
      (
        item
      ) => {

        const image =
          item.product.image ||
          item.product.images?.[0] ||
          '';


        return {

          productId:
            item.product.id,

          name:
            item.product.name,

          price:
            Math.round(
              Number(
                item.product.price ||
                0
              )
            ),

          quantity:
            item.qty,

          qty:
            item.qty,

          image,

          images:
            image
              ? [image]
              : [],

        };

      }
    );

  };


  /* =======================================================
     CUSTOMER DATA
  ======================================================= */

  const buildCustomer = () => {

    return {

      name:
        form.name.trim(),

      phone:
        form.phone.trim(),

      email:
        form.email
          .trim()
          .toLowerCase(),

      address:
        form.address.trim(),

      city:
        form.city.trim(),

      state:
        form.state.trim(),

      pinCode:
        form.pinCode.trim(),

    };

  };


  /* =======================================================
     CREATE WEBSITE ORDER
  ======================================================= */

  const createOrder = async (
    mode:
      | 'website'
      | 'whatsapp'
  ) => {

    const token =
      localStorage.getItem(
        'authToken'
      );


    const orderItems =
      buildOrderItems();


    const customer =
      buildCustomer();


    const response =
      await fetch(
        `${API_URL}/api/orders`,
        {
          method:
            'POST',

          headers: {

            'Content-Type':
              'application/json',

            Accept:
              'application/json',

            ...(token
              ? {
                  Authorization:
                    `Bearer ${token}`,
                }
              : {}),

          },

          body:
            JSON.stringify({

              customer,

              items:
                orderItems,

              total:
                Math.round(
                  total
                ),

              paymentMethod:
                mode === 'whatsapp'
                  ? 'whatsapp'
                  : 'cod',

              source:
                mode,

            }),

          cache:
            'no-store',

        }
      );


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
      response.status === 401
    ) {

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


      throw new Error(
        'Your session has expired. Please login again.'
      );

    }


    if (
      !response.ok
    ) {

      throw new Error(
        data?.message ||
        'Unable to place order.'
      );

    }


    return data;

  };


  /* =======================================================
     WEBSITE ORDER
  ======================================================= */

  const handlePlaceOrder =
    async () => {

      if (
        loading ||
        whatsappLoading ||
        pinLoading
      ) {

        return;

      }


      if (
        items.length ===
        0
      ) {

        setError(
          'Your bag is empty.'
        );

        return;

      }


      const validationError =
        validateForm();


      if (
        validationError
      ) {

        setError(
          validationError
        );

        return;

      }


      try {

        setOrderMode(
          'website'
        );

        setLoading(
          true
        );

        setError('');


        const data =
          await createOrder(
            'website'
          );


        const createdOrderId =
          data?.order?.orderId ||
          data?.order?._id ||
          '';


        setOrderId(
          String(
            createdOrderId
          )
        );


        setDone(
          true
        );


        clearCart();


      } catch (err) {

        console.error(
          'Place order error:',
          err
        );


        setError(
          err instanceof Error
            ? err.message
            : 'Unable to place order. Please try again.'
        );


      } finally {

        setLoading(
          false
        );

      }

    };


  /* =======================================================
     WHATSAPP MESSAGE
  ======================================================= */

  const createWhatsAppMessage = (
    createdOrderId: string
  ) => {

    const productLines =
      items
        .map(
          (
            item
          ) =>
            `• ${item.product.name} × ${item.qty} — ₹${(
              Number(
                item.product.price ||
                0
              ) *
              item.qty
            ).toLocaleString(
              'en-IN'
            )}`
        )
        .join('\n');


    return [
      'Hi Shivaay Paridhan,',
      '',
      'I would like to confirm my order.',
      '',
      `Order ID: ${createdOrderId || 'Pending'}`,
      '',
      'Customer Details',
      `Name: ${form.name.trim()}`,
      `Phone: ${form.phone.trim()}`,
      `Email: ${form.email.trim()}`,
      '',
      'Delivery Address',
      form.address.trim(),
      `${form.city.trim()}, ${form.state.trim()}`,
      `PIN: ${form.pinCode.trim()}`,
      '',
      'Order Items',
      productLines,
      '',
      `Subtotal: ₹${subtotal.toLocaleString('en-IN')}`,
      `Shipping: ${
        shipping
          ? `₹${shipping}`
          : 'FREE'
      }`,
      `Total: ₹${total.toLocaleString('en-IN')}`,
      '',
      'Payment: Cash on Delivery',
      '',
      'Please confirm my order.',
      '',
      'Thank you.',
    ].join('\n');

  };


  /* =======================================================
     WHATSAPP ORDER
  ======================================================= */

  const handleWhatsAppOrder =
    async () => {

      if (
        loading ||
        whatsappLoading ||
        pinLoading
      ) {

        return;

      }


      if (
        items.length ===
        0
      ) {

        setError(
          'Your bag is empty.'
        );

        return;

      }


      const validationError =
        validateForm();


      if (
        validationError
      ) {

        setError(
          validationError
        );

        return;

      }


      try {

        setOrderMode(
          'whatsapp'
        );

        setWhatsappLoading(
          true
        );

        setError('');


        /*
          First create the order in MongoDB.
          Backend will mark it as
          pending_whatsapp.
        */

        const data =
          await createOrder(
            'whatsapp'
          );


        const createdOrderId =
          data?.order?.orderId ||
          data?.order?._id ||
          '';


        setOrderId(
          String(
            createdOrderId
          )
        );


        /*
          Build WhatsApp message.
        */

        const message =
          createWhatsAppMessage(
            String(
              createdOrderId
            )
          );


        const whatsappUrl =
          `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
            message
          )}`;


        /*
          Open WhatsApp.
        */

        window.open(
          whatsappUrl,
          '_blank',
          'noopener,noreferrer'
        );


        /*
          Mark checkout complete
          after order has been created.
        */

        setDone(
          true
        );


        clearCart();


      } catch (err) {

        console.error(
          'WhatsApp order error:',
          err
        );


        setError(
          err instanceof Error
            ? err.message
            : 'Unable to create WhatsApp order.'
        );


      } finally {

        setWhatsappLoading(
          false
        );

      }

    };


  /* =======================================================
     EMPTY CART
  ======================================================= */

  if (
    !items.length &&
    !done
  ) {

    return (

      <main className="page">

        <div className="container">

          <div className="eyebrow">
            Secure checkout
          </div>


          <h1
            className="section-title !text-left !text-[42px]"
          >
            Checkout
          </h1>


          <div
            className="card p-12 text-center"
          >

            <PackageCheck
              className="mx-auto mb-4 text-[#762438]"
              size={42}
            />


            <h2
              className="serif text-3xl text-[#132b49]"
            >
              Your bag is empty
            </h2>


            <p className="muted">
              Add a product before checking out.
            </p>


            <Link
              className="btn btn-primary mt-5"
              href="/shop"
            >
              Explore Collection
            </Link>

          </div>

        </div>

      </main>

    );

  }


  /* =======================================================
     SUCCESS
  ======================================================= */

  if (
    done
  ) {

    return (

      <main className="page">

        <div className="container">

          <div
            className="card p-12 text-center"
          >

            {orderMode ===
            'whatsapp' ? (

              <MessageCircle
                className="mx-auto mb-4 text-[#166534]"
                size={52}
              />

            ) : (

              <CheckCircle2
                className="mx-auto mb-4 text-[#166534]"
                size={52}
              />

            )}


            <h2
              className="serif mt-3 text-3xl text-[#132b49]"
            >
              {orderMode ===
              'whatsapp'
                ? 'WhatsApp order created'
                : 'Order placed successfully'}
            </h2>


            <p className="muted mt-2">

              {orderMode ===
              'whatsapp'
                ? 'WhatsApp has been opened with your complete order details.'
                : 'Thank you for shopping with Shivaay Paridhan.'}

            </p>


            {orderId && (

              <div
                className="mt-4"
                style={{
                  fontSize:
                    14,

                  fontWeight:
                    700,

                  color:
                    '#762438',
                }}
              >

                Order ID:
                {' '}
                #{orderId}

              </div>

            )}


            <div
              className="mt-6 flex flex-wrap justify-center gap-3"
            >

              <Link
                className="btn btn-primary"
                href="/account#orders"
              >
                View My Orders
              </Link>


              <Link
                className="btn btn-outline"
                href="/shop"
              >
                Continue Shopping
              </Link>

            </div>

          </div>

        </div>

      </main>

    );

  }


  /* =======================================================
     CHECKOUT
  ======================================================= */

  return (

    <main className="page">

      <div className="container">

        <div className="eyebrow">
          Secure checkout
        </div>


        <h1
          className="section-title !text-left !text-[42px]"
        >
          Checkout
        </h1>


        {/* =================================================
            ERROR
        ================================================= */}

        {error && (

          <div
            className="card mt-5 p-4"
            style={{
              background:
                'rgba(118, 36, 56, 0.07)',

              color:
                '#762438',

              fontSize:
                13,
            }}
          >
            {error}
          </div>

        )}


        <div
          className="grid gap-6 md:grid-cols-[1.2fr_.8fr]"
          style={{
            marginTop:
              28,
          }}
        >

          {/* =================================================
              DELIVERY
          ================================================= */}

          <div className="card p-6">

            <h2
              className="serif text-2xl text-[#132b49]"
            >
              Delivery details
            </h2>


            {/* NAME */}

            <div className="field">

              <label htmlFor="name">
                Full name
              </label>

              <input
                id="name"
                name="name"
                className="input"
                placeholder="Enter your full name"
                value={
                  form.name
                }
                onChange={
                  handleChange
                }
                autoComplete="name"
                disabled={
                  loading ||
                  whatsappLoading
                }
              />

            </div>


            {/* PHONE */}

            <div className="field">

              <label htmlFor="phone">
                Phone
              </label>

              <input
                id="phone"
                name="phone"
                type="tel"
                className="input"
                placeholder="Enter your phone number"
                value={
                  form.phone
                }
                onChange={
                  handleChange
                }
                autoComplete="tel"
                disabled={
                  loading ||
                  whatsappLoading
                }
              />

            </div>


            {/* EMAIL */}

            <div className="field">

              <label htmlFor="email">
                Email
              </label>

              <input
                id="email"
                name="email"
                type="email"
                className="input"
                placeholder="you@example.com"
                value={
                  form.email
                }
                onChange={
                  handleChange
                }
                autoComplete="email"
                disabled={
                  loading ||
                  whatsappLoading
                }
              />

            </div>


            {/* ADDRESS */}

            <div className="field">

              <label htmlFor="address">
                Address
              </label>

              <input
                id="address"
                name="address"
                className="input"
                placeholder="House number, street, area"
                value={
                  form.address
                }
                onChange={
                  handleChange
                }
                autoComplete="street-address"
                disabled={
                  loading ||
                  whatsappLoading
                }
              />

            </div>


            {/* PIN CODE */}

            <div className="field">

              <label
                htmlFor="pinCode"
              >
                PIN code
              </label>


              <div
                style={{
                  position:
                    'relative',
                }}
              >

                <MapPin
                  size={17}
                  style={{
                    position:
                      'absolute',

                    left:
                      12,

                    top:
                      '50%',

                    transform:
                      'translateY(-50%)',

                    color:
                      'var(--muted)',

                    pointerEvents:
                      'none',
                  }}
                />


                <input
                  id="pinCode"
                  name="pinCode"
                  inputMode="numeric"
                  maxLength={6}
                  className="input"
                  placeholder="Enter 6-digit PIN"
                  value={
                    form.pinCode
                  }
                  onChange={
                    handleChange
                  }
                  autoComplete="postal-code"
                  disabled={
                    loading ||
                    whatsappLoading ||
                    pinLoading
                  }
                  style={{
                    paddingLeft:
                      38,
                  }}
                />


                {pinLoading && (

                  <LoaderCircle
                    size={18}
                    className="animate-spin"
                    style={{
                      position:
                        'absolute',

                      right:
                        12,

                      top:
                        '50%',

                      transform:
                        'translateY(-50%)',
                    }}
                  />

                )}

              </div>


              {!pinLoading &&
                form.pinCode.length ===
                  6 &&
                form.city &&
                form.state &&
                !pinError && (

                  <div
                    style={{
                      marginTop:
                        8,

                      fontSize:
                        12,

                      color:
                        '#166534',

                      fontWeight:
                        600,
                    }}
                  >

                    ✓ {form.city}, {form.state}

                  </div>

                )}


              {pinError && (

                <div
                  style={{
                    marginTop:
                      8,

                    fontSize:
                      12,

                    color:
                      '#762438',
                  }}
                >

                  {pinError}

                </div>

              )}

            </div>


            {/* CITY */}

            <div className="field">

              <label htmlFor="city">
                City / District
              </label>

              <input
                id="city"
                name="city"
                className="input"
                placeholder="Auto detected from PIN"
                value={
                  form.city
                }
                readOnly
                disabled={
                  loading ||
                  whatsappLoading
                }
                style={{
                  background:
                    '#f7f3ee',

                  cursor:
                    'default',
                }}
              />

            </div>


            {/* STATE */}

            <div className="field">

              <label htmlFor="state">
                State
              </label>

              <input
                id="state"
                name="state"
                className="input"
                placeholder="Auto detected from PIN"
                value={
                  form.state
                }
                readOnly
                disabled={
                  loading ||
                  whatsappLoading
                }
                style={{
                  background:
                    '#f7f3ee',

                  cursor:
                    'default',
                }}
              />

            </div>


            {/* PAYMENT */}

            <div
              className="card"
              style={{
                marginTop:
                  18,

                padding:
                  14,

                background:
                  '#f6eee2',
              }}
            >

              <strong>
                Payment
              </strong>

              <p
                className="muted"
                style={{
                  margin:
                    '5px 0 0',

                  fontSize:
                    12,
                }}
              >
                Cash on Delivery
              </p>

            </div>


            {/* ACTIONS */}

            <div
              className="mt-5 grid gap-3"
            >

              {/* WEBSITE ORDER */}

              <button
                type="button"
                className="btn btn-primary w-full"
                onClick={
                  handlePlaceOrder
                }
                disabled={
                  loading ||
                  whatsappLoading ||
                  pinLoading
                }
                style={{
                  opacity:
                    loading ||
                    whatsappLoading ||
                    pinLoading
                      ? 0.7
                      : 1,
                }}
              >

                {loading
                  ? 'Placing Order...'
                  : `Place Order — ₹${total.toLocaleString(
                      'en-IN'
                    )}`}

              </button>


              {/* WHATSAPP */}

              <button
                type="button"
                className="btn btn-dark w-full"
                onClick={
                  handleWhatsAppOrder
                }
                disabled={
                  loading ||
                  whatsappLoading ||
                  pinLoading
                }
                style={{
                  opacity:
                    loading ||
                    whatsappLoading ||
                    pinLoading
                      ? 0.7
                      : 1,

                  display:
                    'flex',

                  alignItems:
                    'center',

                  justifyContent:
                    'center',

                  gap:
                    8,
                }}
              >

                <MessageCircle
                  size={18}
                />

                {whatsappLoading
                  ? 'Preparing WhatsApp Order...'
                  : 'Order on WhatsApp'}

              </button>

            </div>

          </div>


          {/* =================================================
              ORDER SUMMARY
          ================================================= */}

          <div
            className="card h-max p-6"
          >

            <h2
              className="serif text-2xl text-[#132b49]"
            >
              Your order
            </h2>


            <div className="mt-5">

              {items.map(
                (
                  item
                ) => (

                  <div
                    key={
                      item.product.id
                    }
                    className="summary-row"
                  >

                    <span>

                      {
                        item.product.name
                      }

                      {' × '}

                      {
                        item.qty
                      }

                    </span>


                    <b>

                      ₹
                      {(
                        Number(
                          item.product.price
                        ) *
                        item.qty
                      ).toLocaleString(
                        'en-IN'
                      )}

                    </b>

                  </div>

                )
              )}


              <div
                className="summary-row"
              >

                <span>
                  Shipping
                </span>


                <b>

                  {shipping
                    ? `₹${shipping}`
                    : 'FREE'}

                </b>

              </div>


              <div
                className="summary-row total"
              >

                <span>
                  Total
                </span>


                <span>

                  ₹
                  {total.toLocaleString(
                    'en-IN'
                  )}

                </span>

              </div>

            </div>

          </div>

        </div>

      </div>

    </main>

  );

}