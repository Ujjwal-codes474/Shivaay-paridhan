'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Eye,
  EyeOff,
  LogIn,
} from 'lucide-react';


/* =========================================================
   API
========================================================= */

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:5000';


/* =========================================================
   LOGIN PAGE
========================================================= */

export default function Login() {

  const router = useRouter();


  /* =======================================================
     FORM STATE
  ======================================================= */

  const [email, setEmail] =
    useState('');

  const [password, setPassword] =
    useState('');


  /* =======================================================
     UI STATE
  ======================================================= */

  const [showPassword, setShowPassword] =
    useState(false);

  const [rememberMe, setRememberMe] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState('');

  const [success, setSuccess] =
    useState('');


  /* =======================================================
     LOGIN
  ======================================================= */

  const handleLogin = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {

    e.preventDefault();

    setError('');
    setSuccess('');


    /* =====================================================
       VALIDATION
    ===================================================== */

    const trimmedEmail =
      email.trim().toLowerCase();


    if (!trimmedEmail) {

      setError(
        'Please enter your email address.'
      );

      return;
    }


    if (!password) {

      setError(
        'Please enter your password.'
      );

      return;
    }


    try {

      setLoading(true);


      /* ===================================================
         API REQUEST
      =================================================== */

      const response =
        await fetch(
          `${API_URL}/api/auth/login`,
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',

              Accept:
                'application/json',
            },

            body: JSON.stringify({
              email:
                trimmedEmail,

              password,
            }),

            cache:
              'no-store',
          }
        );


      /* ===================================================
         RESPONSE
      =================================================== */

      let data: any =
        null;


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
          'Invalid email or password.'
        );

      }


      /* ===================================================
         TOKEN CHECK
      =================================================== */

      if (!data?.token) {

        throw new Error(
          'Login succeeded, but the server did not return an authentication token.'
        );

      }


      /* ===================================================
         USER
      =================================================== */

      const user =
        data.user || {};


      const role =
        user.role || 'user';


      /* ===================================================
         SAVE AUTH
         
         IMPORTANT KEYS
         authToken
         role
         currentUser
      =================================================== */

      localStorage.setItem(
        'authToken',
        data.token
      );


      localStorage.setItem(
        'role',
        role
      );


      localStorage.setItem(
        'currentUser',
        JSON.stringify(user)
      );

     window.dispatchEvent(
  new Event('auth-change')
);


      /* ===================================================
         REMEMBER ME
         
         Authentication already remains available through
         localStorage. This flag only remembers the user's
         preference.
      =================================================== */

      if (rememberMe) {

        localStorage.setItem(
          'rememberMe',
          'true'
        );

      } else {

        localStorage.removeItem(
          'rememberMe'
        );

      }


      /* ===================================================
         UPDATE HEADER IMMEDIATELY
      =================================================== */

      window.dispatchEvent(
        new Event(
          'auth-change'
        )
      );


      /* ===================================================
         SUCCESS MESSAGE
      =================================================== */

      setSuccess(
        role === 'admin'
          ? 'Admin login successful. Opening admin panel...'
          : 'Login successful. Opening your account...'
      );


      /* ===================================================
         ROLE-BASED REDIRECT
      =================================================== */

      if (
        role === 'admin'
      ) {

        router.replace(
          '/admin'
        );

      } else {

        router.replace(
          '/'
        );

      }

    } catch (err) {

      console.error(
        'Login error:',
        err
      );


      /* ===================================================
         BACKEND CONNECTION ERROR
      =================================================== */

      if (
        err instanceof TypeError
      ) {

        setError(
          'Something want wrong .'
        );

      } else {

        setError(
          err instanceof Error
            ? err.message
            : 'Unable to login. Please try again.'
        );

      }

    } finally {

      setLoading(false);

    }

  };


  /* =========================================================
     RENDER
  ========================================================= */

  return (

    <main className="page">

      <div className="container">

        <div className="auth">

          <div className="auth-card card">


            {/* =================================================
                HEADER
            ================================================= */}

            <div className="eyebrow">
              Welcome back
            </div>


            <h1 className="serif text-4xl text-[#132b49]">
              Sign in
            </h1>


            <p className="muted">
              Enter your details to continue shopping.
            </p>


            {/* =================================================
                FORM
            ================================================= */}

            <form
              onSubmit={handleLogin}
              noValidate
            >


              {/* =================================================
                  ERROR
              ================================================= */}

              {error && (

                <div
                  className="mt-4 rounded-lg p-3 text-xs"
                  style={{
                    background:
                      'rgba(118, 36, 56, 0.08)',

                    color:
                      '#762438',
                  }}
                >

                  {error}

                </div>

              )}


              {/* =================================================
                  SUCCESS
              ================================================= */}

              {success && (

                <div
                  className="mt-4 rounded-lg p-3 text-xs"
                  style={{
                    background:
                      'rgba(34, 197, 94, 0.08)',

                    color:
                      '#166534',
                  }}
                >

                  {success}

                </div>

              )}


              {/* =================================================
                  EMAIL
              ================================================= */}

              <div className="field mt-5">

                <label htmlFor="email">
                  Email
                </label>


                <input
                  id="email"
                  name="email"
                  className="input"
                  type="email"
                  value={email}
                  onChange={(e) => {

                    setEmail(
                      e.target.value
                    );

                    setError('');
                    setSuccess('');

                  }}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />

              </div>


              {/* =================================================
                  PASSWORD
              ================================================= */}

              <div className="field mt-4">

                <div
                  style={{
                    display:
                      'flex',

                    alignItems:
                      'center',

                    justifyContent:
                      'space-between',

                    marginBottom:
                      7,
                  }}
                >

                  <label
                    htmlFor="password"
                    style={{
                      marginBottom:
                        0,
                    }}
                  >
                    Password
                  </label>


                  <Link
                    href="/forgot-password"
                    className="text-xs font-semibold text-[#762438]"
                  >
                    Forgot password?
                  </Link>

                </div>


                <div
                  style={{
                    position:
                      'relative',
                  }}
                >

                  <input
                    id="password"
                    name="password"
                    className="input"
                    type={
                      showPassword
                        ? 'text'
                        : 'password'
                    }
                    value={
                      password
                    }
                    onChange={(e) => {

                      setPassword(
                        e.target.value
                      );

                      setError('');
                      setSuccess('');

                    }}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                    style={{
                      paddingRight:
                        46,
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
                    style={{
                      position:
                        'absolute',

                      right:
                        12,

                      top:
                        '50%',

                      transform:
                        'translateY(-50%)',

                      border:
                        0,

                      background:
                        'transparent',

                      cursor:
                        'pointer',

                      padding:
                        4,

                      color:
                        'var(--muted)',
                    }}
                  >

                    {showPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}

                  </button>

                </div>

              </div>


              {/* =================================================
                  REMEMBER ME
              ================================================= */}

              <label
                style={{
                  display:
                    'flex',

                  alignItems:
                    'center',

                  gap:
                    8,

                  marginTop:
                    16,

                  fontSize:
                    12,

                  color:
                    'var(--muted)',

                  cursor:
                    'pointer',
                }}
              >

                <input
                  type="checkbox"
                  checked={
                    rememberMe
                  }
                  onChange={(e) =>
                    setRememberMe(
                      e.target.checked
                    )
                  }
                />

                Remember me

              </label>


              {/* =================================================
                  LOGIN BUTTON
              ================================================= */}

              <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={
                  loading
                }
                style={{
                  marginTop:
                    22,

                  display:
                    'flex',

                  alignItems:
                    'center',

                  justifyContent:
                    'center',

                  gap:
                    8,

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

                <LogIn
                  size={17}
                />


                {loading
                  ? 'Signing In...'
                  : 'Sign In'}

              </button>


              {/* =================================================
                  REGISTER
              ================================================= */}

              <div
                className="mt-5 text-center text-sm muted"
              >

                New to Shivaay?{' '}


                <Link
                  className="font-bold text-[#762438]"
                  href="/register"
                >
                  Create an account
                </Link>

              </div>

            </form>

          </div>

        </div>

      </div>

    </main>

  );
}