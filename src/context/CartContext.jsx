import React, { createContext, useContext, useState, useMemo, useCallback } from "react";

// State and actions live in separate contexts so components that only add items
// (every ProductCard) do not re-render when the cart contents change.
const CartStateContext = createContext(null);
const CartActionsContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const addItem = useCallback((product, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
  }, []);

  const removeItem = useCallback((productId) => {
    setItems((prev) => prev.filter((item) => item.product.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId, delta) => {
    setItems((prev) =>
      prev
        .map((item) => {
          if (item.product.id !== productId) return item;
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        })
        .filter(Boolean)
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);
  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);

  const actions = useMemo(
    () => ({ addItem, removeItem, updateQuantity, clearCart, openCart, closeCart, setIsCartOpen }),
    [addItem, removeItem, updateQuantity, clearCart, openCart, closeCart]
  );

  const state = useMemo(() => {
    let totalCount = 0;
    let totalPrice = 0;
    for (const item of items) {
      totalCount += item.quantity;
      totalPrice += item.product.price * item.quantity;
    }
    return { items, totalCount, totalPrice, isCartOpen };
  }, [items, isCartOpen]);

  return (
    <CartActionsContext.Provider value={actions}>
      <CartStateContext.Provider value={state}>{children}</CartStateContext.Provider>
    </CartActionsContext.Provider>
  );
}

export function useCartActions() {
  const context = useContext(CartActionsContext);
  if (!context) throw new Error("useCartActions must be used within a CartProvider");
  return context;
}

export function useCartState() {
  const context = useContext(CartStateContext);
  if (!context) throw new Error("useCartState must be used within a CartProvider");
  return context;
}
