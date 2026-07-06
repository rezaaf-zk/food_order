import React, { createContext, useState, useCallback } from 'react';

export const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);

  const addToCart = useCallback((item, quantity, level = null, category) => {
    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex(
        (cartItem) =>
          cartItem.id === item.id &&
          cartItem.level === level
      );

      if (existingIndex > -1) {
        const updatedCart = [...prevCart];
        updatedCart[existingIndex].quantity += quantity;
        return updatedCart;
      }

      return [
        ...prevCart,
        {
          ...item,
          quantity,
          level,
          category,
        },
      ];
    });
  }, []);

  const removeFromCart = useCallback((id, level = null) => {
    setCart((prevCart) =>
      prevCart.filter((item) => !(item.id === id && item.level === level))
    );
  }, []);

  const updateCartItemQuantity = useCallback((id, level, quantity) => {
    if (quantity <= 0) {
      removeFromCart(id, level);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === id && item.level === level
          ? { ...item, quantity }
          : item
      )
    );
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const getTotalPrice = useCallback(() => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  }, [cart]);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateCartItemQuantity,
        clearCart,
        getTotalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
