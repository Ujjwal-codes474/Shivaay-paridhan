'use client';

import { create } from 'zustand';

type WishlistState = {
  ids: string[];
  toggle: (id: string) => void;
  clear: () => void;
  sync: () => void;
};

const STORAGE_PREFIX =
  'shivaay-v2-wishlist';

function getUserKey() {
  if (typeof window === 'undefined') {
    return 'guest';
  }

  const savedUser =
    localStorage.getItem('currentUser');

  if (!savedUser) {
    return 'guest';
  }

  try {
    const user =
      JSON.parse(savedUser);

    const userId =
      user?.id ||
      user?._id;

    if (userId) {
      return String(userId);
    }

    if (user?.email) {
      return user.email
        .trim()
        .toLowerCase();
    }
  } catch {
    return 'guest';
  }

  return 'guest';
}

function getStorageKey() {
  return `${STORAGE_PREFIX}:${getUserKey()}`;
}

function readWishlist() {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const saved =
      localStorage.getItem(
        getStorageKey()
      );

    if (!saved) {
      return [];
    }

    const parsed =
      JSON.parse(saved);

    return Array.isArray(parsed)
      ? parsed.filter(
          (id): id is string =>
            typeof id === 'string'
        )
      : [];
  } catch {
    return [];
  }
}

function saveWishlist(
  ids: string[]
) {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.setItem(
    getStorageKey(),
    JSON.stringify(ids)
  );
}

export const useWishlist =
  create<WishlistState>((set) => ({
    ids: [],

    sync: () => {
      localStorage.removeItem(
        'shivaay-v2-wishlist'
      );

      set({
        ids: readWishlist(),
      });
    },

    toggle: (id) => {
      if (!id) {
        return;
      }

      set((state) => {
        const exists =
          state.ids.includes(id);

        const nextIds = exists
          ? state.ids.filter(
              (item) => item !== id
            )
          : [...state.ids, id];

        saveWishlist(nextIds);

        return {
          ids: nextIds,
        };
      });
    },

    clear: () => {
      saveWishlist([]);

      set({
        ids: [],
      });
    },
  }));

if (typeof window !== 'undefined') {
  queueMicrotask(() => {
    useWishlist
      .getState()
      .sync();
  });

  window.addEventListener(
    'auth-change',
    () => {
      useWishlist
        .getState()
        .sync();
    }
  );
}