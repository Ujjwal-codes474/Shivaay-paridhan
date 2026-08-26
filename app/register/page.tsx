'use client';

import Link from 'next/link';
import {
  Eye,
  EyeOff,
  CheckCircle2,
} from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';


/* =========================================================
   API
========================================================= */

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:5000';


/* =========================================================
   REGISTER PAGE
========================================================= */

export default function RegisterPage() {

  const router = useRouter();


  /* =======================================================
     FORM STATE
  ======================================================= */

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });


  /* =======================================================
     UI STATE
  ======================================================= */

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState('');

  const [success, setSuccess] =
    useState('');


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


    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));


    setError('');
    setSuccess('');
  };


  /* =======================================================
     PASSWORD RULES
  ======================================================= */

  const passwordLength =
    form.password.length >= 8;

  const hasUppercase =
    /[A-Z]/.test(
      form.password
    );

  const hasLowercase =
    /[a-z]/.test(
      form.password
    );

  const hasNumber =
    /\d/.test(
      form.password
    );

  const passwordValid =
    passwordLength &&
    hasUppercase &&
    hasLowercase &&
    hasNumber;


  const passwordsMatch =
    form.confirmPassword.length > 0 &&
    form.password ===
      form.confirmPassword;


  /* =======================================================
     SUBMIT
  ======================================================= */

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {

    e.preventDefault();

    setError('');
    setSuccess('');


    /* =====================================================
       BASIC VALIDATION
    ===================================================== */

    const name =
      form.name.trim();

    const email =
      form.email.trim().toLowerCase();

    const phone =
      form.phone.trim();


    if (!name) {

      setError(
        'Please enter your full name.'
      );

      return;
    }


    if (!email) {

      setError(
        'Please enter your email address.'
      );

      return;
    }


    const emailValid =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email
      );


    if (!emailValid) {

      setError(
        'Please enter a valid email address.'
      );

      return;
    }


    if (!phone) {

      setError(
        'Please enter your phone number.'
      );

      return;
    }


    if (!passwordValid) {

      setError(
        'Password must contain at least 8 characters, 1 uppercase letter, 1 lowercase letter and 1 number.'
      );

      return;
    }


    if (!passwordsMatch) {

      setError(
        'Passwords do not match.'
      );

      return;
    }


    /* =====================================================
       REGISTER API
    ===================================================== */

    try {

      setLoading(true);


      const response =
        await fetch(
          `${API_URL}/api/auth/register`,
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',

              Accept:
                'application/json',
            },

            body: JSON.stringify({
              name,
              email,
              phone,
              password:
                form.password,
            }),

            cache: 'no-store',
          }
        );


      /* ===================================================
         RESPONSE
      =================================================== */

      let data: any = null;


      try {

        data =
          await response.json();

      } catch {

        throw new Error(
          'Invalid response received from server.'
        );

      }


      /* ===================================================
         API ERROR
      =================================================== */

      if (!response.ok) {

        throw new Error(
          data?.message ||
          'Registration failed.'
        );

      }


      /* ===================================================
         SUCCESS
      =================================================== */

      setSuccess(
        'Account created successfully. Redirecting to login...'
      );


      setForm({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
      });


      /* ===================================================
         REDIRECT
      =================================================== */

      setTimeout(() => {

        router.replace(
          '/login'
        );

      }, 1000);


    } catch (err) {

      console.error(
        'Registration error:',
        err
      );


      if (
        err instanceof TypeError
      ) {

        setError(
          'Unable to connect to the backend. Make sure Node.js is running on port 5000.'
        );

      } else {

        setError(
          err instanceof Error
            ? err.message
            : 'Unable to create account.'
        );

      }

    } finally {

      setLoading(false);

    }

  };


  /* =======================================================
     RENDER
  ======================================================= */

  return (

    <main className="page">

      <div className="container">

        <div
          style={{
            maxWidth: 520,
            margin: '0 auto',
          }}
        >


          {/* =================================================
              HEADER
          ================================================= */}

          <div className="eyebrow">
            Join Shivaay Paridhan
          </div>


          <h1
            className="section-title"
            style={{
              marginTop: 8,
            }}
          >
            Create your account
          </h1>


          <p
            className="muted"
            style={{
              marginBottom: 30,
            }}
          >
            Create your account to start shopping.
          </p>


          {/* =================================================
              FORM CARD
          ================================================= */}

          <div className="card p-6">

            <form
              onSubmit={
                handleSubmit
              }
              noValidate
            >


              {/* ===============================================
                  ERROR
              =============================================== */}

              {error && (

                <div
                  style={{
                    marginBottom: 20,
                    padding:
                      '12px 14px',
                    borderRadius: 10,
                    background:
                      'rgba(128, 0, 32, 0.08)',
                    color:
                      'var(--burgundy)',
                    fontSize: 13,
                  }}
                >
                  {error}
                </div>

              )}


              {/* ===============================================
                  SUCCESS
              =============================================== */}

              {success && (

                <div
                  style={{
                    marginBottom: 20,
                    padding:
                      '12px 14px',
                    borderRadius: 10,
                    background:
                      'rgba(34, 197, 94, 0.08)',
                    color:
                      '#166534',
                    fontSize: 13,
                  }}
                >
                  {success}
                </div>

              )}


              {/* ===============================================
                  FULL NAME
              =============================================== */}

              <div className="admin-field">

                <label htmlFor="name">
                  Full Name
                </label>


                <input
                  id="name"
                  name="name"
                  type="text"
                  value={
                    form.name
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Enter your full name"
                  autoComplete="name"
                  required
                  disabled={loading}
                />

              </div>


              {/* ===============================================
                  EMAIL
              =============================================== */}

              <div
                className="admin-field"
                style={{
                  marginTop: 18,
                }}
              >

                <label htmlFor="email">
                  Email Address
                </label>


                <input
                  id="email"
                  name="email"
                  type="email"
                  value={
                    form.email
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Enter your email"
                  autoComplete="email"
                  required
                  disabled={loading}
                />

              </div>


              {/* ===============================================
                  PHONE
              =============================================== */}

              <div
                className="admin-field"
                style={{
                  marginTop: 18,
                }}
              >

                <label htmlFor="phone">
                  Phone Number
                </label>


                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={
                    form.phone
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Enter your phone number"
                  autoComplete="tel"
                  required
                  disabled={loading}
                />

              </div>


              {/* ===============================================
                  PASSWORD
              =============================================== */}

              <div
                className="admin-field"
                style={{
                  marginTop: 18,
                }}
              >

                <label htmlFor="password">
                  Password
                </label>


                <div
                  style={{
                    position:
                      'relative',
                  }}
                >

                  <input
                    id="password"
                    name="password"
                    type={
                      showPassword
                        ? 'text'
                        : 'password'
                    }
                    value={
                      form.password
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Create a password"
                    autoComplete="new-password"
                    required
                    disabled={loading}
                    style={{
                      paddingRight:
                        45,
                    }}
                  />


                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (prev) =>
                          !prev
                      )
                    }
                    aria-label={
                      showPassword
                        ? 'Hide password'
                        : 'Show password'
                    }
                    disabled={loading}
                    style={{
                      position:
                        'absolute',
                      right: 12,
                      top: '50%',
                      transform:
                        'translateY(-50%)',
                      border: 0,
                      background:
                        'transparent',
                      cursor:
                        'pointer',
                      padding: 3,
                    }}
                  >

                    {showPassword ? (
                      <EyeOff
                        size={18}
                      />
                    ) : (
                      <Eye
                        size={18}
                      />
                    )}

                  </button>

                </div>


                {/* PASSWORD RULES */}

                <div
                  style={{
                    marginTop: 9,
                    fontSize: 12,
                    lineHeight: 1.7,
                  }}
                >

                  <div
                    style={{
                      color:
                        passwordLength
                          ? '#166534'
                          : 'var(--muted)',
                    }}
                  >
                    {passwordLength
                      ? '✓'
                      : '•'}
                    {' '}
                    Minimum 8 characters
                  </div>


                  <div
                    style={{
                      color:
                        hasUppercase
                          ? '#166534'
                          : 'var(--muted)',
                    }}
                  >
                    {hasUppercase
                      ? '✓'
                      : '•'}
                    {' '}
                    1 uppercase letter
                  </div>


                  <div
                    style={{
                      color:
                        hasLowercase
                          ? '#166534'
                          : 'var(--muted)',
                    }}
                  >
                    {hasLowercase
                      ? '✓'
                      : '•'}
                    {' '}
                    1 lowercase letter
                  </div>


                  <div
                    style={{
                      color:
                        hasNumber
                          ? '#166534'
                          : 'var(--muted)',
                    }}
                  >
                    {hasNumber
                      ? '✓'
                      : '•'}
                    {' '}
                    1 number
                  </div>

                </div>

              </div>


              {/* ===============================================
                  CONFIRM PASSWORD
              =============================================== */}

              <div
                className="admin-field"
                style={{
                  marginTop: 18,
                }}
              >

                <label htmlFor="confirmPassword">
                  Confirm Password
                </label>


                <div
                  style={{
                    position:
                      'relative',
                  }}
                >

                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={
                      showConfirmPassword
                        ? 'text'
                        : 'password'
                    }
                    value={
                      form.confirmPassword
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Confirm your password"
                    autoComplete="new-password"
                    required
                    disabled={loading}
                    style={{
                      paddingRight:
                        45,
                    }}
                  />


                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(
                        (prev) =>
                          !prev
                      )
                    }
                    aria-label={
                      showConfirmPassword
                        ? 'Hide password'
                        : 'Show password'
                    }
                    disabled={loading}
                    style={{
                      position:
                        'absolute',
                      right: 12,
                      top: '50%',
                      transform:
                        'translateY(-50%)',
                      border: 0,
                      background:
                        'transparent',
                      cursor:
                        'pointer',
                      padding: 3,
                    }}
                  >

                    {showConfirmPassword ? (
                      <EyeOff
                        size={18}
                      />
                    ) : (
                      <Eye
                        size={18}
                      />
                    )}

                  </button>

                </div>


                {/* PASSWORD MATCH */}

                {form.confirmPassword && (

                  <div
                    style={{
                      marginTop: 8,
                      display:
                        'flex',
                      alignItems:
                        'center',
                      gap: 5,
                      color:
                        passwordsMatch
                          ? '#166534'
                          : '#b91c1c',
                      fontSize: 12,
                    }}
                  >

                    <CheckCircle2
                      size={14}
                    />

                    {passwordsMatch
                      ? 'Passwords match'
                      : 'Passwords do not match'}

                  </div>

                )}

              </div>


              {/* ===============================================
                  SUBMIT
              =============================================== */}

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{
                  width: '100%',
                  marginTop: 25,
                  opacity:
                    loading
                      ? 0.7
                      : 1,
                  cursor:
                    loading
                      ? 'not-allowed'
                      : 'pointer',
                }}
              >

                {loading
                  ? 'Creating Account...'
                  : 'Create Account'}

              </button>


              {/* ===============================================
                  LOGIN LINK
              =============================================== */}

              <p
                className="muted"
                style={{
                  textAlign:
                    'center',
                  marginTop: 20,
                  fontSize: 13,
                }}
              >

                Already have an account?{' '}

                <Link
                  href="/login"
                  className="text-link"
                >
                  Login

                  <span
                    style={{
                      marginLeft: 4,
                    }}
                  >
                    →
                  </span>

                </Link>

              </p>

            </form>

          </div>

        </div>

      </div>

    </main>
  );
}