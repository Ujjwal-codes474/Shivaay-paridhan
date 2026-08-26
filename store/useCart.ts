'use client';

import {
  create,
} from 'zustand';

import {
  persist,
} from 'zustand/middleware';


/* =========================================================
   CART PRODUCT
   Backend / frontend compatible
========================================================= */

export type CartProduct = {
  id: string;

  slug: string;

  name: string;

  price: number;

  oldPrice?: number;

  category?: string;

  fabric?: string;

  color?: string;

  occasion?: string;

  description?: string;

  image?: string;

  images?: string[];

  rating?: number;

  stock?: number;

  featured?: boolean;
};


/* =========================================================
   CART ITEM
========================================================= */

export type CartItem = {
  product: CartProduct;

  qty: number;
};


/* =========================================================
   CART STATE
========================================================= */

type CartState = {
  items: CartItem[];

  add: (
    product: CartProduct
  ) => void;

  remove: (
    id: string
  ) => void;

  inc: (
    id: string
  ) => void;

  dec: (
    id: string
  ) => void;

  clear: () => void;
};


/* =========================================================
   SAFE STOCK
========================================================= */

function getStock(
  product: CartProduct
): number {

  const stock =
    Number(
      product.stock ?? 0
    );


  if (
    !Number.isFinite(
      stock
    )
  ) {
    return 0;
  }


  return Math.max(
    0,
    Math.floor(
      stock
    )
  );
}


/* =========================================================
   SAFE PRICE
========================================================= */

function getPrice(
  product: CartProduct
): number {

  const price =
    Number(
      product.price ?? 0
    );


  if (
    !Number.isFinite(
      price
    )
  ) {
    return 0;
  }


  return Math.max(
    0,
    Math.round(
      price
    )
  );
}


/* =========================================================
   CART STORE
========================================================= */

export const useCart =
  create<CartState>()(
    persist(
      (set) => ({

        /* =================================================
           INITIAL STATE
        ================================================= */

        items: [],


        /* =================================================
           ADD PRODUCT
        ================================================= */

        add: (
          product
        ) =>
          set(
            (
              state
            ) => {

              const stock =
                getStock(
                  product
                );


              /* Product unavailable */

              if (
                stock <= 0
              ) {
                return state;
              }


              const existing =
                state.items.find(
                  (
                    item
                  ) =>
                    item.product.id ===
                    product.id
                );


              /* =================================================
                 EXISTING PRODUCT
              ================================================= */

              if (
                existing
              ) {

                /* Already at stock limit */

                if (
                  existing.qty >=
                  stock
                ) {
                  return state;
                }


                return {
                  items:
                    state.items.map(
                      (
                        item
                      ) =>
                        item.product.id ===
                          product.id
                          ? {
                              ...item,

                              /*
                                Keep latest backend
                                product data.
                              */
                              product,

                              qty:
                                Math.min(
                                  item.qty + 1,
                                  stock
                                ),
                            }
                          : item
                    ),
                };
              }


              /* =================================================
                 NEW PRODUCT
              ================================================= */

              return {
                items: [
                  ...state.items,

                  {
                    product: {
                      ...product,

                      price:
                        getPrice(
                          product
                        ),
                    },

                    qty: 1,
                  },
                ],
              };
            }
          ),


        /* =================================================
           REMOVE
        ================================================= */

        remove: (
          id
        ) =>
          set(
            (
              state
            ) => ({
              items:
                state.items.filter(
                  (
                    item
                  ) =>
                    item.product.id !==
                    id
                ),
            })
          ),


        /* =================================================
           INCREASE
        ================================================= */

        inc: (
          id
        ) =>
          set(
            (
              state
            ) => ({
              items:
                state.items.map(
                  (
                    item
                  ) => {

                    if (
                      item.product.id !==
                      id
                    ) {
                      return item;
                    }


                    const stock =
                      getStock(
                        item.product
                      );


                    if (
                      stock <= 0
                    ) {
                      return item;
                    }


                    return {
                      ...item,

                      qty:
                        Math.min(
                          item.qty + 1,
                          stock
                        ),
                    };
                  }
                ),
            })
          ),


        /* =================================================
           DECREASE
        ================================================= */

        dec: (
          id
        ) =>
          set(
            (
              state
            ) => ({
              items:
                state.items.map(
                  (
                    item
                  ) =>
                    item.product.id ===
                    id
                      ? {
                          ...item,

                          qty:
                            Math.max(
                              1,
                              item.qty - 1
                            ),
                        }
                      : item
                ),
            })
          ),


        /* =================================================
           CLEAR
        ================================================= */

        clear: () =>
          set({
            items: [],
          }),

      }),


      /* =====================================================
         PERSIST
      ===================================================== */

      {
        name:
          'shivaay-v2-cart',

        version:
          2,

        partialize:
          (
            state
          ) => ({
            items:
              state.items,
          }),

        /*
          Clean old cart data from previous
          Product type when Zustand rehydrates.
        */

        migrate:
          async (
            persistedState,
            version
          ) => {

            if (
              version === 1
            ) {

              const oldState =
                persistedState as {
                  items?: CartItem[];
                };


              return {
                items:
                  Array.isArray(
                    oldState?.items
                  )
                    ? oldState.items
                    : [],
              };
            }


            return persistedState;
          },
      }
    )
  );