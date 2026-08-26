'use client';

import Link from 'next/link';

import {
  Heart,
  LogOut,
  MapPin,
  Save,
  UserRound,
  LoaderCircle,
  Pencil,
  Trash2,
  Plus,
  Package,
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

import {
  useEffect,
  useState,
} from 'react';

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
   ADDRESS TYPE
========================================================= */

type SavedAddress = {
  line1: string;
  line2: string;
  city: string;
  state: string;
  pinCode: string;
  country: string;
};


/* =========================================================
   USER TYPE
========================================================= */

type CurrentUser = {
  id?: string;
  _id?: string;
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  createdAt?: string;
  address?: SavedAddress;
};


/* =========================================================
   INITIAL ADDRESS
========================================================= */

const initialAddress: SavedAddress = {
  line1: '',
  line2: '',
  city: '',
  state: '',
  pinCode: '',
  country: 'India',
};


/* =========================================================
   HELPERS
========================================================= */

function normalizeAddress(
  address?: Partial<SavedAddress>
): SavedAddress {

  return {
    line1:
      address?.line1 || '',

    line2:
      address?.line2 || '',

    city:
      address?.city || '',

    state:
      address?.state || '',

    pinCode:
      address?.pinCode || '',

    country:
      address?.country || 'India',
  };
}


function hasAddress(
  address?: Partial<SavedAddress>
) {

  return Boolean(
    address?.line1?.trim() ||
    address?.line2?.trim() ||
    address?.city?.trim() ||
    address?.state?.trim() ||
    address?.pinCode?.trim()
  );

}


/* =========================================================
   ACCOUNT PAGE
========================================================= */

export default function Account() {

  const router =
    useRouter();


  /* =======================================================
     AUTH
  ======================================================= */

  const [checkingAuth, setCheckingAuth] =
    useState(true);

  const [user, setUser] =
    useState<CurrentUser | null>(
      null
    );


  /* =======================================================
     ADDRESS
  ======================================================= */

  const [address, setAddress] =
    useState<SavedAddress>(
      initialAddress
    );

  const [hasSavedAddress, setHasSavedAddress] =
    useState(false);

  const [editingAddress, setEditingAddress] =
    useState(false);


  /* =======================================================
     ADDRESS UI
  ======================================================= */

  const [savingAddress, setSavingAddress] =
    useState(false);

  const [deletingAddress, setDeletingAddress] =
    useState(false);

  const [addressSaved, setAddressSaved] =
    useState(false);

  const [addressError, setAddressError] =
    useState('');


  /* =======================================================
     PROFILE UI
  ======================================================= */

  const [profileError, setProfileError] =
    useState('');


  /* =======================================================
     PIN LOOKUP
  ======================================================= */

  const [pinLoading, setPinLoading] =
    useState(false);

  const [pinError, setPinError] =
    useState('');


  /* =======================================================
     DELETE CONFIRMATION MODAL
  ======================================================= */

  const [showDeleteConfirm, setShowDeleteConfirm] =
    useState(false);


  /* =======================================================
     LOGOUT
  ======================================================= */

  const [loggingOut, setLoggingOut] =
    useState(false);


  /* =======================================================
     CLEAR SESSION
  ======================================================= */

  const clearSession =
    () => {

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

    };


  /* =======================================================
     LOAD PROFILE FROM BACKEND
  ======================================================= */

  const loadProfile =
    async (
      token: string,
      userId: string
    ) => {

      try {

        setProfileError('');


        const response =
          await fetch(
            `${API_URL}/api/users/${userId}`,
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
          response.status === 401
        ) {

          clearSession();

          router.replace(
            '/login'
          );

          return null;
        }


        if (
          response.status === 403
        ) {

          throw new Error(
            'You are not allowed to view this profile.'
          );

        }


        let data: any =
          null;


        try {

          data =
            await response.json();

        } catch {

          throw new Error(
            'Invalid profile response from server.'
          );

        }


        if (
          !response.ok
        ) {

          throw new Error(
            data?.message ||
            'Unable to load your profile.'
          );

        }


        const backendUser =
          data?.user;


        if (
          !backendUser
        ) {

          throw new Error(
            'User profile was not returned by the server.'
          );

        }


        const normalizedUser:
          CurrentUser = {

          id:
            backendUser.id ||
            backendUser._id,

          _id:
            backendUser._id ||
            backendUser.id,

          name:
            backendUser.name ||
            '',

          email:
            backendUser.email ||
            '',

          phone:
            backendUser.phone ||
            '',

          role:
            backendUser.role ||
            'user',

          createdAt:
            backendUser.createdAt,

          address:
            normalizeAddress(
              backendUser.address
            ),

        };


        setUser(
          normalizedUser
        );


        const normalizedAddress =
          normalizeAddress(
            normalizedUser.address
          );


        setAddress(
          normalizedAddress
        );


        const saved =
          hasAddress(
            normalizedAddress
          );


        setHasSavedAddress(
          saved
        );


        if (
          !saved
        ) {

          setEditingAddress(
            false
          );

        }


        localStorage.setItem(
          'currentUser',
          JSON.stringify(
            normalizedUser
          )
        );


        return normalizedUser;

      } catch (
        error
      ) {

        console.error(
          'Profile loading error:',
          error
        );


        setProfileError(
          error instanceof Error
            ? error.message
            : 'Unable to load profile.'
        );


        return null;

      }

    };


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

    const currentUser =
      localStorage.getItem(
        'currentUser'
      );


    if (!token) {

      router.replace(
        '/login'
      );

      return;
    }


    if (
      role === 'admin'
    ) {

      router.replace(
        '/admin'
      );

      return;
    }


    let parsedUser:
      CurrentUser | null =
      null;


    if (
      currentUser
    ) {

      try {

        parsedUser =
          JSON.parse(
            currentUser
          );

      } catch (
        error
      ) {

        console.error(
          'Current user parse error:',
          error
        );

      }

    }


    const userId =
      parsedUser?.id ||
      parsedUser?._id;


    if (!userId) {

      clearSession();

      router.replace(
        '/login'
      );

      return;
    }


    const initialize =
      async () => {

        setCheckingAuth(
          true
        );

        await loadProfile(
          token,
          String(userId)
        );

        setCheckingAuth(
          false
        );

      };


    initialize();

  }, [router]);


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


        const country =
          String(
            data?.country ||
            'India'
          ).trim();


        if (
          !city ||
          !state
        ) {

          throw new Error(
            'Location details were not found for this PIN code.'
          );

        }


        setAddress(
          (prev) => ({
            ...prev,

            city,

            state,

            country,

          })
        );

      } catch (
        error
      ) {

        console.error(
          'PIN lookup error:',
          error
        );


        setAddress(
          (prev) => ({
            ...prev,

            city:
              '',

            state:
              '',
          })
        );


        setPinError(
          error instanceof Error
            ? error.message
            : 'Unable to find this PIN code.'
        );

      } finally {

        setPinLoading(
          false
        );

      }

    };


  /* =======================================================
     ADDRESS CHANGE
  ======================================================= */

  const handleAddressChange = (
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


      setAddress(
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

      setAddressError('');

      setAddressSaved(false);


      if (
        pinCode.length === 6
      ) {

        lookupPinCode(
          pinCode
        );

      }


      return;

    }


    setAddress(
      (prev) => ({
        ...prev,

        [name]:
          value,
      })
    );


    setAddressError('');

    setPinError('');

    setAddressSaved(false);

  };


  /* =======================================================
     SAVE ADDRESS
  ======================================================= */

  const handleSaveAddress =
    async () => {

      if (
        savingAddress ||
        deletingAddress
      ) {

        return;

      }


      setAddressError('');

      setAddressSaved(false);


      const token =
        localStorage.getItem(
          'authToken'
        );


      const userId =
        user?.id ||
        user?._id;


      if (!token) {

        router.replace(
          '/login'
        );

        return;
      }


      if (!userId) {

        setAddressError(
          'Unable to identify your account. Please login again.'
        );

        return;
      }


      if (
        !address.line1.trim()
      ) {

        setAddressError(
          'Please enter your house number, street or area.'
        );

        return;
      }


      if (
        address.pinCode.length !== 6
      ) {

        setAddressError(
          'Please enter a valid 6-digit PIN code.'
        );

        return;
      }


      if (
        pinLoading
      ) {

        setAddressError(
          'Please wait while the PIN code is being checked.'
        );

        return;
      }


      if (
        pinError
      ) {

        setAddressError(
          pinError
        );

        return;
      }


      if (
        !address.city.trim() ||
        !address.state.trim()
      ) {

        setAddressError(
          'Please enter a valid PIN code so city and state can be detected.'
        );

        return;
      }


      try {

        setSavingAddress(
          true
        );


        const response =
          await fetch(
            `${API_URL}/api/users/${userId}`,
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
                  address: {

                    line1:
                      address.line1.trim(),

                    line2:
                      address.line2.trim(),

                    city:
                      address.city.trim(),

                    state:
                      address.state.trim(),

                    pinCode:
                      address.pinCode.trim(),

                    country:
                      address.country.trim() ||
                      'India',

                  },
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

          clearSession();

          router.replace(
            '/login'
          );

          return;
        }


        if (
          response.status === 403
        ) {

          throw new Error(
            data?.message ||
            'You are not allowed to update this profile.'
          );

        }


        if (
          !response.ok
        ) {

          throw new Error(
            data?.message ||
            'Unable to save your address.'
          );

        }


        const updatedUser:
          CurrentUser =
          data?.user ||
          {
            ...user,

            address:
              {
                ...address,
              },

          };


        const updatedAddress =
          normalizeAddress(
            updatedUser.address
          );


        setUser(
          updatedUser
        );


        setAddress(
          updatedAddress
        );


        setHasSavedAddress(
          true
        );


        setEditingAddress(
          false
        );


        setAddressSaved(
          true
        );


        localStorage.setItem(
          'currentUser',
          JSON.stringify(
            updatedUser
          )
        );


        window.dispatchEvent(
          new Event(
            'auth-change'
          )
        );


      } catch (
        error
      ) {

        console.error(
          'Address save error:',
          error
        );


        setAddressError(
          error instanceof Error
            ? error.message
            : 'Unable to save your address.'
        );

      } finally {

        setSavingAddress(
          false
        );

      }

    };


  /* =======================================================
     EDIT ADDRESS
  ======================================================= */

  const handleEditAddress =
    () => {

      setAddressError('');

      setPinError('');

      setAddressSaved(false);

      setEditingAddress(
        true
      );

    };


  /* =======================================================
     CANCEL EDIT
  ======================================================= */

  const handleCancelEdit =
    () => {

      setAddress(
        normalizeAddress(
          user?.address
        )
      );

      setAddressError('');

      setPinError('');

      setAddressSaved(false);

      setEditingAddress(
        false
      );

    };


  /* =======================================================
     ADD ADDRESS
  ======================================================= */

  const handleAddAddress =
    () => {

      setAddress(
        normalizeAddress(
          hasSavedAddress
            ? user?.address
            : initialAddress
        )
      );

      setAddressError('');

      setPinError('');

      setAddressSaved(false);

      setEditingAddress(
        true
      );

    };


  /* =======================================================
     DELETE ADDRESS
     
     Step 1:
     Open custom confirmation modal.
  ======================================================= */

  const handleDeleteAddress = () => {

    if (
      deletingAddress ||
      savingAddress
    ) {

      return;

    }


    setAddressError('');

    setShowDeleteConfirm(
      true
    );

  };


  /* =======================================================
     DELETE ADDRESS
     
     Step 2:
     Actually delete after confirmation.
  ======================================================= */

  const confirmDeleteAddress =
    async () => {

      if (
        deletingAddress ||
        savingAddress
      ) {

        return;

      }


      const token =
        localStorage.getItem(
          'authToken'
        );


      const userId =
        user?.id ||
        user?._id;


      if (
        !token ||
        !userId
      ) {

        setShowDeleteConfirm(
          false
        );

        router.replace(
          '/login'
        );

        return;
      }


      try {

        setDeletingAddress(
          true
        );

        setAddressError('');


        const response =
          await fetch(
            `${API_URL}/api/users/${userId}`,
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
                  address: {

                    line1: '',
                    line2: '',
                    city: '',
                    state: '',
                    pinCode: '',
                    country: 'India',

                  },
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

          clearSession();

          setShowDeleteConfirm(
            false
          );

          router.replace(
            '/login'
          );

          return;
        }


        if (
          !response.ok
        ) {

          throw new Error(
            data?.message ||
            'Unable to delete saved address.'
          );

        }


        const updatedUser:
          CurrentUser =
          data?.user ||
          {
            ...user,

            address:
              {
                ...initialAddress,
              },

          };


        const updatedAddress =
          normalizeAddress(
            updatedUser.address
          );


        setUser(
          updatedUser
        );


        setAddress(
          updatedAddress
        );


        setHasSavedAddress(
          false
        );


        setEditingAddress(
          false
        );


        setAddressSaved(
          false
        );


        setPinError('');

        setAddressError('');


        localStorage.setItem(
          'currentUser',
          JSON.stringify(
            updatedUser
          )
        );


        window.dispatchEvent(
          new Event(
            'auth-change'
          )
        );


        setShowDeleteConfirm(
          false
        );

      } catch (
        error
      ) {

        console.error(
          'Delete address error:',
          error
        );


        setAddressError(
          error instanceof Error
            ? error.message
            : 'Unable to delete saved address.'
        );

      } finally {

        setDeletingAddress(
          false
        );

      }

    };


  /* =======================================================
     CLOSE DELETE MODAL
  ======================================================= */

  const closeDeleteConfirm =
    () => {

      if (
        deletingAddress
      ) {

        return;

      }


      setShowDeleteConfirm(
        false
      );

    };


  /* =======================================================
     LOGOUT
  ======================================================= */

  const handleLogout =
    () => {

      if (
        loggingOut
      ) {

        return;

      }


      setLoggingOut(
        true
      );


      clearSession();


      router.replace(
        '/login'
      );

      router.refresh();

    };


  /* =======================================================
     PROFILE DATA
  ======================================================= */

  const profileInitial =
    (
      user?.name ||
      'U'
    )
      .trim()
      .charAt(0)
      .toUpperCase();


  const profileComplete =
    Boolean(
      user?.name?.trim() &&
      user?.email?.trim() &&
      user?.phone?.trim()
    );


  const formattedMemberSince =
    user?.createdAt
      ? new Date(
          user.createdAt
        ).toLocaleDateString(
          'en-IN',
          {
            month:
              'short',

            year:
              'numeric',
          }
        )
      : '—';


  /* =======================================================
     LOADING
  ======================================================= */

  if (
    checkingAuth
  ) {

    return (

      <main className="page">

        <div className="container">

          <div
            className="premium-account-loading"
          >

            <div
              className="premium-loading-mark"
            >
              <Sparkles
                size={19}
              />
            </div>


            <p>
              Preparing your private space...
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

    <main
      className="page premium-account-page"
    >

      <div className="container">


        {/* =================================================
            PREMIUM HERO
        ================================================= */}

        <section
          className="premium-account-hero"
        >

          <div
            className="premium-account-hero-glow"
          />


          <div
            className="premium-account-hero-content"
          >

            <div
              className="premium-avatar"
            >
              {profileInitial}
            </div>


            <div
              className="premium-account-heading"
            >

              <div
                className="eyebrow"
              >
                Your private space
              </div>


              <h1>
                Welcome back,
                <br />
                <i>
                  {user?.name ||
                    'Guest'}
                </i>
              </h1>


              <p>
                Your profile, delivery details
                and shopping journey — all in
                one refined space.
              </p>

            </div>


            <div
              className="premium-member-pill"
            >

              <ShieldCheck
                size={16}
              />

              <span>
                {profileComplete
                  ? 'Verified profile'
                  : 'Complete your profile'}
              </span>

            </div>

          </div>

        </section>


        {/* =================================================
            ACCOUNT LAYOUT
        ================================================= */}

        <div
          className="account-grid premium-account-grid"
        >


          {/* =================================================
              SIDEBAR
          ================================================= */}

          <aside
            className="card side-nav premium-side-nav"
          >

            <div
              className="premium-side-label"
            >
              Account
            </div>


            <Link
              className="active"
              href="/account"
            >

              <UserRound
                size={17}
              />

              <span>
                Overview
              </span>

            </Link>


            <Link
              href="/account/orders"
            >

              <Package
                size={17}
              />

              <span>
                Orders
              </span>

              <ArrowRight
                size={14}
                className="premium-nav-arrow"
              />

            </Link>


            <Link
              href="/wishlist"
            >

              <Heart
                size={17}
              />

              <span>
                Wishlist
              </span>

              <ArrowRight
                size={14}
                className="premium-nav-arrow"
              />

            </Link>


            <div
              className="premium-side-divider"
            />


            <button
              type="button"
              onClick={
                handleLogout
              }
              disabled={
                loggingOut
              }
              className="account-logout-link premium-logout"
            >

              <LogOut
                size={17}
              />

              <span>
                {loggingOut
                  ? 'Logging out...'
                  : 'Logout'}
              </span>

            </button>

          </aside>


          {/* =================================================
              MAIN
          ================================================= */}

          <section
            className="premium-account-main"
          >


            {/* =================================================
                PROFILE
            ================================================= */}

            <div
              className="premium-profile-card"
            >

              <div
                className="premium-card-topline"
              >

                <div>

                  <span
                    className="eyebrow"
                  >
                    Personal information
                  </span>

                  <h2>
                    Your Profile
                  </h2>

                </div>


                <div
                  className="premium-profile-status"
                >

                  <span
                    className="premium-status-dot"
                  />

                  Active member

                </div>

              </div>


              {profileError && (

                <div
                  className="premium-error"
                >
                  {profileError}
                </div>

              )}


              <div
                className="premium-profile-grid"
              >

                <div
                  className="premium-profile-identity"
                >

                  <div
                    className="premium-large-avatar"
                  >
                    {profileInitial}
                  </div>


                  <div>

                    <h3>
                      {user?.name ||
                        '—'}
                    </h3>

                    <span>
                      {user?.email ||
                        '—'}
                    </span>

                  </div>

                </div>


                <div
                  className="premium-profile-details"
                >

                  <div>

                    <small>
                      Full name
                    </small>

                    <strong>
                      {user?.name ||
                        '—'}
                    </strong>

                  </div>


                  <div>

                    <small>
                      Email address
                    </small>

                    <strong>
                      {user?.email ||
                        '—'}
                    </strong>

                  </div>


                  <div>

                    <small>
                      Phone number
                    </small>

                    <strong>
                      {user?.phone ||
                        '—'}
                    </strong>

                  </div>


                  <div>

                    <small>
                      Member since
                    </small>

                    <strong>
                      {formattedMemberSince}
                    </strong>

                  </div>

                </div>

              </div>

            </div>


            {/* =================================================
                ADDRESS
            ================================================= */}

            <div
              className="premium-address-card"
            >

              <div
                className="premium-card-topline"
              >

                <div
                  className="premium-section-heading"
                >

                  <div
                    className="premium-icon-box"
                  >

                    <MapPin
                      size={19}
                    />

                  </div>


                  <div>

                    <span
                      className="eyebrow"
                    >
                      Delivery
                    </span>

                    <h2>
                      Saved Address
                    </h2>

                    <p>
                      Your preferred delivery
                      destination.
                    </p>

                  </div>

                </div>


                {hasSavedAddress &&
                  !editingAddress && (

                    <div
                      className="premium-address-actions"
                    >

                      <button
                        type="button"
                        className="premium-edit-button"
                        onClick={
                          handleEditAddress
                        }
                        disabled={
                          deletingAddress
                        }
                      >

                        <Pencil
                          size={14}
                        />

                        Edit

                      </button>


                      <button
                        type="button"
                        className="premium-delete-button"
                        onClick={
                          handleDeleteAddress
                        }
                        disabled={
                          deletingAddress
                        }
                      >

                        <Trash2
                          size={14}
                        />

                        Delete

                      </button>

                    </div>

                  )}

              </div>


              {addressSaved && (

                <div
                  className="premium-success"
                >

                  <ShieldCheck
                    size={16}
                  />

                  Address saved successfully.

                </div>

              )}


              {addressError && (

                <div
                  className="premium-error"
                >
                  {addressError}
                </div>

              )}


              {hasSavedAddress &&
              !editingAddress ? (

                <div
                  className="premium-saved-address"
                >

                  <div
                    className="premium-address-pin"
                  >

                    <MapPin
                      size={20}
                    />

                  </div>


                  <div
                    className="premium-address-text"
                  >

                    <strong>
                      {address.line1}
                    </strong>


                    {address.line2 && (

                      <span>
                        {address.line2}
                      </span>

                    )}


                    <span>
                      {address.city}

                      {address.city &&
                      address.state
                        ? ', '
                        : ''}

                      {address.state}
                    </span>


                    <span>
                      PIN {address.pinCode}
                    </span>


                    <span>
                      {address.country ||
                        'India'}
                    </span>

                  </div>


                  <div
                    className="premium-address-badge"
                  >
                    Saved
                  </div>

                </div>

              ) : !editingAddress ? (

                <div
                  className="premium-empty-address"
                >

                  <div
                    className="premium-empty-icon"
                  >

                    <MapPin
                      size={23}
                    />

                  </div>


                  <div>

                    <h3>
                      No saved address
                    </h3>

                    <p>
                      Add your delivery address
                      for a faster WhatsApp order
                      and checkout experience.
                    </p>

                  </div>


                  <button
                    type="button"
                    className="premium-add-address"
                    onClick={
                      handleAddAddress
                    }
                  >

                    <Plus
                      size={16}
                    />

                    Add Address

                  </button>

                </div>

              ) : (

                <div
                  className="premium-address-form"
                >

                  <div
                    className="premium-form-grid"
                  >

                    <div
                      className="field"
                    >

                      <label
                        htmlFor="address-line1"
                      >
                        House / Street / Area
                      </label>

                      <input
                        id="address-line1"
                        name="line1"
                        className="input"
                        value={
                          address.line1
                        }
                        onChange={
                          handleAddressChange
                        }
                        placeholder="House number, street, area"
                        autoComplete="street-address"
                        disabled={
                          savingAddress ||
                          deletingAddress
                        }
                      />

                    </div>


                    <div
                      className="field"
                    >

                      <label
                        htmlFor="address-line2"
                      >

                        Address Line 2

                        <span
                          className="muted"
                        >
                          {' '}
                          (optional)
                        </span>

                      </label>


                      <input
                        id="address-line2"
                        name="line2"
                        className="input"
                        value={
                          address.line2
                        }
                        onChange={
                          handleAddressChange
                        }
                        placeholder="Landmark, apartment, locality"
                        disabled={
                          savingAddress ||
                          deletingAddress
                        }
                      />

                    </div>


                    <div
                      className="field"
                    >

                      <label
                        htmlFor="address-pin"
                      >
                        PIN code
                      </label>


                      <div
                        className="premium-pin-wrapper"
                      >

                        <MapPin
                          size={17}
                          className="premium-pin-icon"
                        />


                        <input
                          id="address-pin"
                          name="pinCode"
                          inputMode="numeric"
                          maxLength={6}
                          className="input"
                          value={
                            address.pinCode
                          }
                          onChange={
                            handleAddressChange
                          }
                          placeholder="Enter 6-digit PIN"
                          autoComplete="postal-code"
                          disabled={
                            savingAddress ||
                            deletingAddress ||
                            pinLoading
                          }
                        />


                        {pinLoading && (

                          <LoaderCircle
                            size={18}
                            className="premium-pin-loading animate-spin"
                          />

                        )}

                      </div>


                      {pinError && (

                        <div
                          className="premium-field-error"
                        >
                          {pinError}
                        </div>

                      )}


                      {!pinLoading &&
                        address.pinCode.length === 6 &&
                        address.city &&
                        address.state &&
                        !pinError && (

                          <div
                            className="premium-pin-success"
                          >
                            ✓ {address.city},{' '}
                            {address.state}
                          </div>

                        )}

                    </div>


                    <div
                      className="field"
                    >

                      <label>
                        Country
                      </label>

                      <input
                        className="input"
                        value={
                          address.country
                        }
                        readOnly
                        disabled={
                          savingAddress ||
                          deletingAddress
                        }
                        style={{
                          background:
                            '#f7f3ee',
                        }}
                      />

                    </div>

                  </div>


                  <div
                    className="premium-detected-location"
                  >

                    <div>

                      <small>
                        City / District
                      </small>

                      <strong>
                        {address.city ||
                          'Waiting for PIN'}
                      </strong>

                    </div>


                    <div>

                      <small>
                        State
                      </small>

                      <strong>
                        {address.state ||
                          'Waiting for PIN'}
                      </strong>

                    </div>

                  </div>


                  <div
                    className="premium-form-actions"
                  >

                    <button
                      type="button"
                      className="premium-save-button"
                      onClick={
                        handleSaveAddress
                      }
                      disabled={
                        savingAddress ||
                        deletingAddress ||
                        pinLoading
                      }
                    >

                      {savingAddress ? (

                        <>
                          <LoaderCircle
                            size={17}
                            className="animate-spin"
                          />

                          Saving...
                        </>

                      ) : (

                        <>
                          <Save
                            size={17}
                          />

                          Save Address
                        </>

                      )}

                    </button>


                    {hasSavedAddress && (

                      <button
                        type="button"
                        className="premium-cancel-button"
                        onClick={
                          handleCancelEdit
                        }
                        disabled={
                          savingAddress ||
                          deletingAddress
                        }
                      >
                        Cancel
                      </button>

                    )}

                  </div>

                </div>

              )}

            </div>


            {/* =================================================
                QUICK ACCESS
            ================================================= */}

            <div
              className="premium-quick-card"
            >

              <div
                className="premium-card-topline"
              >

                <div>

                  <span
                    className="eyebrow"
                  >
                    Quick access
                  </span>

                  <h2>
                    Continue your journey
                  </h2>

                </div>

              </div>


              <div
                className="premium-quick-grid"
              >

                <Link
                  href="/account/orders"
                  className="premium-quick-item"
                >

                  <div
                    className="premium-quick-icon"
                  >
                    <Package
                      size={19}
                    />
                  </div>


                  <div>

                    <strong>
                      My Orders
                    </strong>

                    <span>
                      View and track your orders
                    </span>

                  </div>


                  <ArrowRight
                    size={16}
                  />

                </Link>


                <Link
                  href="/wishlist"
                  className="premium-quick-item"
                >

                  <div
                    className="premium-quick-icon"
                  >
                    <Heart
                      size={19}
                    />
                  </div>


                  <div>

                    <strong>
                      Wishlist
                    </strong>

                    <span>
                      Revisit your saved pieces
                    </span>

                  </div>


                  <ArrowRight
                    size={16}
                  />

                </Link>

              </div>

            </div>


          </section>

        </div>


        {/* =================================================
            DELETE ADDRESS CONFIRMATION MODAL
        ================================================= */}

        {showDeleteConfirm && (

          <div
            className="premium-modal-overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-address-title"
            onMouseDown={(event) => {

              if (
                event.target ===
                event.currentTarget
              ) {

                closeDeleteConfirm();

              }

            }}
          >

            <div
              className="premium-confirm-modal"
              onMouseDown={(event) => {
                event.stopPropagation();
              }}
            >

              <div
                className="premium-confirm-icon"
              >

                <Trash2
                  size={22}
                />

              </div>


              <span
                className="eyebrow"
              >
                Confirm action
              </span>


              <h2
                id="delete-address-title"
              >
                Delete saved address?
              </h2>


              <p>
                Are you sure you want to remove
                your saved delivery address?
                You can add a new address anytime.
              </p>


              <div
                className="premium-confirm-actions"
              >

                <button
                  type="button"
                  className="premium-confirm-cancel"
                  onClick={
                    closeDeleteConfirm
                  }
                  disabled={
                    deletingAddress
                  }
                >
                  Cancel
                </button>


                <button
                  type="button"
                  className="premium-confirm-delete"
                  onClick={
                    confirmDeleteAddress
                  }
                  disabled={
                    deletingAddress
                  }
                >

                  {deletingAddress ? (

                    <>
                      <LoaderCircle
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

                      Delete Address
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