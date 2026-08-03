import { useCallback, useEffect, useRef, useState } from "react";

import { isMedusaCommerceEnabled } from "../api/medusa/client";

import {

  addCartLineItem,

  addCartPromotions,
  addCartGiftCard,
  removeCartGiftCard,

  getCachedCartCount,

  getCachedCartLineItems,

  getCachedCartMoneySummary,

  mapPromotionErrorMessage,
  mapGiftCardErrorMessage,

  refreshCartLineItems,

  removeCartLineItem,

  removeCartPromotions,

  updateCartLineItemQuantity,

} from "../api/medusa/cart";

import {

  addCartLine as addLocalCartLine,

  getCartCount,

  readCart,

  removeLine as removeLocalLine,

  updateLineQuantity as updateLocalLineQuantity,

} from "../utils/cartStorage";



/**

 * Subscribe to cart changes for header badge and cart page.

 * When Medusa commerce is on, line items sync from Store Cart API.

 * @returns {{

 *   items: import('../types').CartLineItem[],

 *   count: number,

 *   countIncreased: boolean,

 *   loading: boolean,

 *   error: string | null,

 *   moneySummary: ReturnType<typeof getCachedCartMoneySummary>,

 *   refresh: () => Promise<void>,

 *   addItem: (item: import('../types').CartLineItem) => Promise<void>,

 *   updateQuantity: (line: import('../types').CartLineItem, quantity: number) => Promise<{ capped: boolean }>,

 *   removeItem: (line: import('../types').CartLineItem) => Promise<void>,

 *   applyPromoCode: (code: string) => Promise<void>,

 *   removePromoCode: (code: string) => Promise<void>

 * }}

 */

export function useCart() {

  const medusaEnabled = isMedusaCommerceEnabled();

  const [items, setItems] = useState(() =>

    medusaEnabled ? getCachedCartLineItems() : readCart()

  );

  const [count, setCount] = useState(() =>

    medusaEnabled ? getCachedCartCount() : getCartCount()

  );

  const [moneySummary, setMoneySummary] = useState(() =>

    medusaEnabled

      ? getCachedCartMoneySummary()

      : {

          itemSubtotal: 0,

          discountTotal: 0,

          shippingTotal: 0,

          taxTotal: 0,

          giftCardTotal: 0,

          total: 0,

          promotions: [],
          giftCards: [],

        }

  );

  const [loading, setLoading] = useState(medusaEnabled);

  const [error, setError] = useState(null);

  const [countIncreased, setCountIncreased] = useState(false);

  const prevCountRef = useRef(medusaEnabled ? getCachedCartCount() : getCartCount());

  const initialFetchDone = useRef(false);



  const applyLocalSnapshot = useCallback(() => {

    const next = readCart();

    const nextCount = getCartCount();

    setItems(next);

    setCount(nextCount);

    const itemSubtotal = next.reduce(

      (sum, line) => sum + (Number(line.price) || 0) * (Number(line.quantity) || 0),

      0

    );

    setMoneySummary({

      itemSubtotal,

      discountTotal: 0,

      shippingTotal: 0,

      taxTotal: 0,

      giftCardTotal: 0,

      total: itemSubtotal,

      promotions: [],
          giftCards: [],

    });

    if (nextCount > prevCountRef.current) {

      setCountIncreased(true);

    }

    prevCountRef.current = nextCount;

  }, []);



  const applyMedusaSnapshot = useCallback(() => {

    const next = getCachedCartLineItems();

    const nextCount = getCachedCartCount();

    setItems(next);

    setCount(nextCount);

    setMoneySummary(getCachedCartMoneySummary());

    if (nextCount > prevCountRef.current) {

      setCountIncreased(true);

    }

    prevCountRef.current = nextCount;

  }, []);



  const refresh = useCallback(async () => {

    if (!medusaEnabled) {

      applyLocalSnapshot();

      return;

    }



    setError(null);

    try {

      await refreshCartLineItems();

      applyMedusaSnapshot();

    } catch (err) {

      setError(err?.message || "Could not load cart");

      applyMedusaSnapshot();

    }

  }, [medusaEnabled, applyLocalSnapshot, applyMedusaSnapshot]);



  const addItem = useCallback(

    async (item) => {

      setError(null);

      if (!medusaEnabled) {

        addLocalCartLine(item);

        applyLocalSnapshot();

        return;

      }



      if (!item?.variantId) {

        throw new Error("Selected variant is missing variant_id");

      }



      await addCartLineItem({

        variantId: item.variantId,

        quantity: item.quantity ?? 1,

      });

      applyMedusaSnapshot();

    },

    [medusaEnabled, applyLocalSnapshot, applyMedusaSnapshot]

  );



  const updateQuantity = useCallback(

    async (line, quantity) => {

      setError(null);

      if (!medusaEnabled) {

        const { capped } = updateLocalLineQuantity(

          line.productId,

          line.selectedSize,

          line.selectedColor,

          quantity

        );

        applyLocalSnapshot();

        return { capped };

      }



      if (!line?.lineItemId) {

        throw new Error("Cart line is missing lineItemId");

      }



      const result = await updateCartLineItemQuantity(line.lineItemId, quantity);

      applyMedusaSnapshot();

      return { capped: Boolean(result.capped) };

    },

    [medusaEnabled, applyLocalSnapshot, applyMedusaSnapshot]

  );



  const removeItem = useCallback(

    async (line) => {

      setError(null);

      if (!medusaEnabled) {

        removeLocalLine(line.productId, line.selectedSize, line.selectedColor);

        applyLocalSnapshot();

        return;

      }



      if (!line?.lineItemId) {

        throw new Error("Cart line is missing lineItemId");

      }



      await removeCartLineItem(line.lineItemId);

      applyMedusaSnapshot();

    },

    [medusaEnabled, applyLocalSnapshot, applyMedusaSnapshot]

  );



  const applyPromoCode = useCallback(

    async (code) => {

      setError(null);

      if (!medusaEnabled) {

        throw new Error("کد تخفیف فقط با Medusa فعال است");

      }

      try {

        await addCartPromotions(code);

        applyMedusaSnapshot();

      } catch (err) {

        throw new Error(mapPromotionErrorMessage(err));

      }

    },

    [medusaEnabled, applyMedusaSnapshot]

  );



  const removePromoCode = useCallback(

    async (code) => {

      setError(null);

      if (!medusaEnabled) {

        return;

      }

      try {

        await removeCartPromotions(code);

        applyMedusaSnapshot();

      } catch (err) {

        throw new Error(mapPromotionErrorMessage(err));

      }

    },

    [medusaEnabled, applyMedusaSnapshot]

  );

  const applyGiftCode = useCallback(
    async (code) => {
      setError(null);
      if (!medusaEnabled) {
        throw new Error("کارت هدیه فقط با Medusa فعال است");
      }
      try {
        await addCartGiftCard(code);
        applyMedusaSnapshot();
      } catch (err) {
        throw new Error(mapGiftCardErrorMessage(err));
      }
    },
    [medusaEnabled, applyMedusaSnapshot]
  );

  const removeGiftCode = useCallback(
    async (code) => {
      setError(null);
      if (!medusaEnabled) {
        return;
      }
      try {
        await removeCartGiftCard(code);
        applyMedusaSnapshot();
      } catch (err) {
        throw new Error(mapGiftCardErrorMessage(err));
      }
    },
    [medusaEnabled, applyMedusaSnapshot]
  );



  useEffect(() => {

    if (!countIncreased) {

      return undefined;

    }



    const timer = window.setTimeout(() => setCountIncreased(false), 400);

    return () => window.clearTimeout(timer);

  }, [countIncreased]);



  useEffect(() => {

    const handleChange = () => {

      if (medusaEnabled) {

        applyMedusaSnapshot();

      } else {

        applyLocalSnapshot();

      }

    };



    window.addEventListener("mashood-cart-changed", handleChange);

    window.addEventListener("storage", handleChange);

    return () => {

      window.removeEventListener("mashood-cart-changed", handleChange);

      window.removeEventListener("storage", handleChange);

    };

  }, [medusaEnabled, applyLocalSnapshot, applyMedusaSnapshot]);



  useEffect(() => {

    if (!medusaEnabled || initialFetchDone.current) {

      return undefined;

    }

    initialFetchDone.current = true;



    let cancelled = false;

    (async () => {

      setLoading(true);

      try {

        await refreshCartLineItems();

        if (!cancelled) {

          applyMedusaSnapshot();

        }

      } catch (err) {

        if (!cancelled) {

          setError(err?.message || "Could not load cart");

        }

      } finally {

        if (!cancelled) {

          setLoading(false);

        }

      }

    })();



    return () => {

      cancelled = true;

    };

  }, [medusaEnabled, applyMedusaSnapshot]);



  return {

    items,

    count,

    countIncreased,

    loading,

    error,

    moneySummary,

    refresh,

    addItem,

    updateQuantity,

    removeItem,

    applyPromoCode,

    removePromoCode,

    applyGiftCode,

    removeGiftCode,

  };

}


