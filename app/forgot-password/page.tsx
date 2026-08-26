'use client';

import Link from 'next/link';

import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
  Mail,
  RefreshCw,
} from 'lucide-react';

import {
  useState,
} from 'react';


/* =========================================================
   API
========================================================= */

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:5000';


/* =========================================================
   STEPS
========================================================= */

type ResetStep =
  | 'identifier'
  | 'otp'
  | 'password'
  | 'success';


/* =========================================================
   PAGE
========================================================= */

export default function ForgotPassword() {

  /* =======================================================
     FORM
  ======================================================= */

  const [identifier, setIdentifier] =
    useState('');

  const [otp, setOtp] =
    useState('');

  const [newPassword, setNewPassword] =
    useState('');

  const [confirmPassword, setConfirmPassword] =
    useState('');


  /* =======================================================
     UI
  ======================================================= */

  const [step, setStep] =
    useState<ResetStep>(
      'identifier'
    );

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState('');

  const [success, setSuccess] =
    useState('');

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);


  /* =======================================================
     SEND OTP
  ======================================================= */

  const handleSendOtp = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {

    e.preventDefault();

    setError('');
    setSuccess('');


    const value =
      identifier.trim();


    if (!value) {

      setError(
        'Please enter your email address or mobile number.'
      );

      return;
    }


    try {

      setLoading(true);


      const response =
        await fetch(
          `${API_URL}/api/auth/forgot-password`,
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',

              Accept:
                'application/json',
            },

            body:
              JSON.stringify({
                identifier:
                  value,
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

        data = null;

      }


      if (
        !response.ok
      ) {

        throw new Error(
          data?.message ||
          'Unable to send OTP.'
        );

      }


      setSuccess(
        data?.message ||
        'OTP sent successfully.'
      );


      setStep(
        'otp'
      );

    } catch (err) {

      console.error(
        'Forgot password OTP error:',
        err
      );


      setError(
        err instanceof Error
          ? err.message
          : 'Unable to send OTP. Please try again.'
      );

    } finally {

      setLoading(false);

    }

  };


  /* =======================================================
     VERIFY OTP
  ======================================================= */

  const handleVerifyOtp = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {

    e.preventDefault();

    setError('');
    setSuccess('');


    const cleanOtp =
      otp
        .replace(
          /\D/g,
          ''
        )
        .slice(
          0,
          6
        );


    if (
      cleanOtp.length !==
      6
    ) {

      setError(
        'Please enter the 6-digit OTP.'
      );

      return;
    }


    try {

      setLoading(true);


      const response =
        await fetch(
          `${API_URL}/api/auth/verify-otp`,
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',

              Accept:
                'application/json',
            },

            body:
              JSON.stringify({
                identifier:
                  identifier.trim(),

                otp:
                  cleanOtp,
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

        data = null;

      }


      if (
        !response.ok
      ) {

        throw new Error(
          data?.message ||
          'Invalid OTP.'
        );

      }


      setOtp(
        cleanOtp
      );


      setSuccess(
        data?.message ||
        'OTP verified successfully.'
      );


      setStep(
        'password'
      );

    } catch (err) {

      console.error(
        'OTP verification error:',
        err
      );


      setError(
        err instanceof Error
          ? err.message
          : 'Unable to verify OTP.'
      );

    } finally {

      setLoading(false);

    }

  };


  /* =======================================================
     RESET PASSWORD
  ======================================================= */

  const handleResetPassword =
    async (
      e: React.FormEvent<HTMLFormElement>
    ) => {

      e.preventDefault();

      setError('');
      setSuccess('');


      if (
        !newPassword
      ) {

        setError(
          'Please enter a new password.'
        );

        return;
      }


      if (
        newPassword.length <
        8
      ) {

        setError(
          'Password must be at least 8 characters long.'
        );

        return;
      }


      if (
        newPassword !==
        confirmPassword
      ) {

        setError(
          'Passwords do not match.'
        );

        return;
      }


      try {

        setLoading(true);


        const response =
          await fetch(
            `${API_URL}/api/auth/reset-password`,
            {
              method: 'POST',

              headers: {
                'Content-Type':
                  'application/json',

                Accept:
                  'application/json',
              },

              body:
                JSON.stringify({
                  identifier:
                    identifier.trim(),

                  otp:
                    otp.trim(),

                  newPassword,
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

          data = null;

        }


        if (
          !response.ok
        ) {

          throw new Error(
            data?.message ||
            'Unable to reset password.'
          );

        }


        setSuccess(
          data?.message ||
          'Password reset successful.'
        );


        setStep(
          'success'
        );

    } catch (err) {

        console.error(
          'Password reset error:',
          err
        );


        setError(
          err instanceof Error
            ? err.message
            : 'Unable to reset password.'
        );

      } finally {

        setLoading(false);

      }

    };


  /* =======================================================
     RESEND OTP
  ======================================================= */

  const handleResendOtp =
    async () => {

      setError('');
      setSuccess('');


      const value =
        identifier.trim();


      if (!value) {

        setError(
          'Please enter your email or mobile number.'
        );

        setStep(
          'identifier'
        );

        return;
      }


      try {

        setLoading(true);


        const response =
          await fetch(
            `${API_URL}/api/auth/forgot-password`,
            {
              method: 'POST',

              headers: {
                'Content-Type':
                  'application/json',

                Accept:
                  'application/json',
              },

              body:
                JSON.stringify({
                  identifier:
                    value,
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

          data = null;

        }


        if (
          !response.ok
        ) {

          throw new Error(
            data?.message ||
            'Unable to resend OTP.'
          );

        }


        setOtp('');


        setSuccess(
          data?.message ||
          'A new OTP has been sent.'
        );

      } catch (err) {

        console.error(
          'Resend OTP error:',
          err
        );


        setError(
          err instanceof Error
            ? err.message
            : 'Unable to resend OTP.'
        );

      } finally {

        setLoading(false);

      }

    };


  /* =======================================================
     BACK TO IDENTIFIER
  ======================================================= */

  const handleChangeIdentifier =
    () => {

      setError('');
      setSuccess('');
      setOtp('');
      setStep('identifier');

    };


  /* =======================================================
     RENDER HEADER
  ======================================================= */

  const renderHeader = () => {

    if (
      step ===
      'success'
    ) {

      return (

        <>
          <div
            className="mx-auto mb-4"
            style={{
              width:
                52,

              height:
                52,

              borderRadius:
                '50%',

              display:
                'grid',

              placeItems:
                'center',

              background:
                'rgba(34,197,94,.10)',

              color:
                '#166534',
            }}
          >

            <CheckCircle2
              size={27}
            />

          </div>

          <div className="eyebrow">
            All done
          </div>

          <h1 className="serif text-4xl text-[#132b49]">
            Password reset
          </h1>

          <p className="muted">
            Your password has been updated successfully.
          </p>
        </>

      );

    }


    return (

      <>
        <div className="eyebrow">
          Account recovery
        </div>

        <h1 className="serif text-4xl text-[#132b49]">
          Forgot Password
        </h1>

        <p className="muted">
          Recover your Shivaay Paridhan account securely.
        </p>
      </>

    );

  };


  /* =======================================================
     RENDER
  ======================================================= */

  return (

    <main className="page">

      <div className="container">

        <div className="auth">

          <div
            className="auth-card card"
          >

            {/* =================================================
                HEADER
            ================================================= */}

            {renderHeader()}


            {/* =================================================
                ERROR
            ================================================= */}

            {error && (

              <div
                className="mt-4 rounded-lg p-3 text-xs"
                style={{
                  background:
                    'rgba(118,36,56,.08)',

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

            {success &&
              step !== 'success' && (

                <div
                  className="mt-4 rounded-lg p-3 text-xs"
                  style={{
                    background:
                      'rgba(34,197,94,.08)',

                    color:
                      '#166534',
                  }}
                >

                  {success}

                </div>

              )}


            {/* =================================================
                STEP 1
            ================================================= */}

            {step ===
              'identifier' && (

              <form
                onSubmit={
                  handleSendOtp
                }
              >

                <div className="field mt-5">

                  <label htmlFor="identifier">
                    Email or Mobile Number
                  </label>

                  <div
                    style={{
                      position:
                        'relative',
                    }}
                  >

                    <Mail
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
                      id="identifier"
                      className="input"
                      value={
                        identifier
                      }
                      onChange={(e) => {

                        setIdentifier(
                          e.target.value
                        );

                        setError('');
                        setSuccess('');

                      }}
                      placeholder="you@example.com or 9876543210"
                      autoComplete="username"
                      disabled={
                        loading
                      }
                      style={{
                        paddingLeft:
                          38,
                      }}
                    />

                  </div>

                </div>


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
                        ? .7
                        : 1,
                  }}
                >

                  {loading ? (

                    <>
                      <LoaderCircle
                        size={17}
                        className="animate-spin"
                      />

                      Sending OTP...
                    </>

                  ) : (

                    <>
                      <Mail
                        size={17}
                      />

                      Send OTP
                    </>

                  )}

                </button>


                <div
                  className="mt-5 text-center text-sm muted"
                >

                  Remember your password?{' '}

                  <Link
                    href="/login"
                    className="font-bold text-[#762438]"
                  >
                    Back to Login
                  </Link>

                </div>

              </form>

            )}


            {/* =================================================
                STEP 2
            ================================================= */}

            {step ===
              'otp' && (

              <form
                onSubmit={
                  handleVerifyOtp
                }
              >

                <div
                  className="mt-5"
                  style={{
                    padding:
                      12,

                    borderRadius:
                      10,

                    background:
                      '#f7f3ee',

                    fontSize:
                      12,
                  }}
                >

                  OTP sent for:

                  <strong
                    style={{
                      display:
                        'block',

                      marginTop:
                        4,

                      color:
                        '#132b49',
                    }}
                  >
                    {identifier}
                  </strong>

                </div>


                <div className="field mt-5">

                  <label htmlFor="otp">
                    6-digit OTP
                  </label>

                  <input
                    id="otp"
                    className="input"
                    inputMode="numeric"
                    maxLength={6}
                    value={
                      otp
                    }
                    onChange={(e) => {

                      setOtp(
                        e.target.value
                          .replace(
                            /\D/g,
                            ''
                          )
                          .slice(
                            0,
                            6
                          )
                      );

                      setError('');
                      setSuccess('');

                    }}
                    placeholder="123456"
                    autoComplete="one-time-code"
                    disabled={
                      loading
                    }
                    style={{
                      letterSpacing:
                        6,

                      textAlign:
                        'center',

                      fontWeight:
                        700,
                    }}
                  />

                </div>


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
                  }}
                >

                  {loading ? (

                    <>
                      <LoaderCircle
                        size={17}
                        className="animate-spin"
                      />

                      Verifying...
                    </>

                  ) : (

                    <>
                      <KeyRound
                        size={17}
                      />

                      Verify OTP
                    </>

                  )}

                </button>


                <div
                  className="mt-4 flex flex-wrap justify-center gap-4 text-xs"
                >

                  <button
                    type="button"
                    onClick={
                      handleResendOtp
                    }
                    disabled={
                      loading
                    }
                    className="font-semibold text-[#762438]"
                    style={{
                      background:
                        'transparent',

                      border:
                        0,

                      cursor:
                        loading
                          ? 'not-allowed'
                          : 'pointer',
                    }}
                  >

                    <RefreshCw
                      size={13}
                      style={{
                        display:
                          'inline',

                        marginRight:
                          4,
                      }}
                    />

                    Resend OTP

                  </button>


                  <button
                    type="button"
                    onClick={
                      handleChangeIdentifier
                    }
                    disabled={
                      loading
                    }
                    className="muted"
                    style={{
                      background:
                        'transparent',

                      border:
                        0,

                      cursor:
                        'pointer',
                    }}
                  >
                    Change email/mobile
                  </button>

                </div>

              </form>

            )}


            {/* =================================================
                STEP 3
            ================================================= */}

            {step ===
              'password' && (

              <form
                onSubmit={
                  handleResetPassword
                }
              >

                <div
                  className="mt-5"
                  style={{
                    padding:
                      12,

                    borderRadius:
                      10,

                    background:
                      '#f7f3ee',

                    fontSize:
                      12,
                  }}
                >

                  OTP verified successfully.

                  <strong
                    style={{
                      display:
                        'block',

                      marginTop:
                        4,

                      color:
                        '#132b49',
                    }}
                  >
                    Create a new password.
                  </strong>

                </div>


                <div className="field mt-5">

                  <label htmlFor="newPassword">
                    New Password
                  </label>

                  <div
                    style={{
                      position:
                        'relative',
                    }}
                  >

                    <input
                      id="newPassword"
                      className="input"
                      type={
                        showPassword
                          ? 'text'
                          : 'password'
                      }
                      value={
                        newPassword
                      }
                      onChange={(e) => {

                        setNewPassword(
                          e.target.value
                        );

                        setError('');
                        setSuccess('');

                      }}
                      placeholder="Enter new password"
                      autoComplete="new-password"
                      disabled={
                        loading
                      }
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

                </div>


                <div className="field mt-4">

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
                      className="input"
                      type={
                        showConfirmPassword
                          ? 'text'
                          : 'password'
                      }
                      value={
                        confirmPassword
                      }
                      onChange={(e) => {

                        setConfirmPassword(
                          e.target.value
                        );

                        setError('');
                        setSuccess('');

                      }}
                      placeholder="Confirm new password"
                      autoComplete="new-password"
                      disabled={
                        loading
                      }
                      style={{
                        paddingRight:
                          46,
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

                </div>


                <p
                  className="muted"
                  style={{
                    marginTop:
                      10,

                    fontSize:
                      11,

                    lineHeight:
                      1.6,
                  }}
                >
                  Password must be at least 8 characters and include an uppercase letter, lowercase letter and number.
                </p>


                <button
                  type="submit"
                  className="btn btn-primary w-full"
                  disabled={
                    loading
                  }
                  style={{
                    marginTop:
                      18,

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

                  {loading ? (

                    <>
                      <LoaderCircle
                        size={17}
                        className="animate-spin"
                      />

                      Updating Password...
                    </>

                  ) : (

                    <>
                      <KeyRound
                        size={17}
                      />

                      Reset Password
                    </>

                  )}

                </button>

              </form>

            )}


            {/* =================================================
                SUCCESS
            ================================================= */}

            {step ===
              'success' && (

              <div
                className="mt-6 text-center"
              >

                <div
                  style={{
                    padding:
                      '12px 14px',

                    borderRadius:
                      10,

                    background:
                      'rgba(34,197,94,.08)',

                    color:
                      '#166534',

                    fontSize:
                      13,

                    marginBottom:
                      18,
                  }}
                >

                  {success ||
                    'Your password has been reset successfully.'}

                </div>


                <Link
                  href="/login"
                  className="btn btn-primary w-full"
                  style={{
                    display:
                      'flex',

                    justifyContent:
                      'center',
                  }}
                >

                  Go to Login

                </Link>

              </div>

            )}


            {/* =================================================
                FOOTER
            ================================================= */}

            {step !==
              'success' && (

              <div
                className="mt-6"
                style={{
                  textAlign:
                    'center',

                  borderTop:
                    '1px solid rgba(0,0,0,.06)',

                  paddingTop:
                    16,
                }}
              >

                <Link
                  href="/login"
                  className="text-link"
                  style={{
                    display:
                      'inline-flex',

                    alignItems:
                      'center',

                    gap:
                      6,

                    fontSize:
                      12,
                  }}
                >

                  <ArrowLeft
                    size={14}
                  />

                  Back to Login

                </Link>

              </div>

            )}

          </div>

        </div>

      </div>

    </main>

  );
}