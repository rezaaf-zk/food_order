import React, { createContext, useState, useCallback, useEffect } from 'react';

export const CartContext = createContext();

// Helper to generate a consistent unique key for matching identical product variations
export const getCartItemKey = (id, level = null, note = '') => {
  const cleanNote = (note || '').trim().toLowerCase();
  return `${id}__lvl_${level || 'none'}__note_${cleanNote}`;
};

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('foodorder_cart');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure every item has a unique cartItemId and normalized note
        return parsed.map((item) => ({
          ...item,
          note: item.note || item.notes || '',
          cartItemId: item.cartItemId || getCartItemKey(item.id, item.level, item.note || item.notes)
        }));
      }
      return [];
    } catch {
      return [];
    }
  });

  const [cartBranchId, setCartBranchId] = useState(() => {
    return localStorage.getItem('foodorder_cart_branch_id') || null;
  });

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('foodorder_cart', JSON.stringify(cart));
      if (cart.length > 0 && cartBranchId) {
        localStorage.setItem('foodorder_cart_branch_id', cartBranchId);
      } else if (cart.length === 0) {
        localStorage.removeItem('foodorder_cart_branch_id');
      }
    } catch (e) {}
  }, [cart, cartBranchId]);

  const addToCart = useCallback(
    (item, quantity = 1, level = null, category, branchId = null, note = '') => {
      const cleanNote = (note || '').trim();
      const targetKey = getCartItemKey(item.id, level, cleanNote);

      setCart((prevCart) => {
        const existingIndex = prevCart.findIndex((cartItem) => {
          const itemKey = cartItem.cartItemId || getCartItemKey(cartItem.id, cartItem.level, cartItem.note);
          return itemKey === targetKey;
        });

        if (existingIndex > -1) {
          const updatedCart = [...prevCart];
          updatedCart[existingIndex].quantity += quantity;
          return updatedCart;
        }

        return [
          ...prevCart,
          {
            ...item,
            cartItemId: targetKey,
            quantity,
            level,
            category,
            note: cleanNote
          }
        ];
      });

      if (branchId) {
        setCartBranchId(branchId);
      }
    },
    []
  );

  const removeFromCart = useCallback((cartItemIdOrId, level = null, note = null) => {
    setCart((prevCart) =>
      prevCart.filter((item) => {
        // If single argument passed is cartItemId
        if (level === null && note === null && typeof cartItemIdOrId === 'string' && cartItemIdOrId.includes('__')) {
          return item.cartItemId !== cartItemIdOrId;
        }
        // If separate arguments passed (backward compatibility)
        if (note !== null) {
          const targetKey = getCartItemKey(cartItemIdOrId, level, note);
          return (item.cartItemId || getCartItemKey(item.id, item.level, item.note)) !== targetKey;
        }
        // Fallback match by id and level
        return !(item.id === cartItemIdOrId && item.level === level);
      })
    );
  }, []);

  const updateCartItemQuantity = useCallback(
    (cartItemIdOrId, levelOrQty, quantityOrNote, maybeQty) => {
      let targetCartItemId = null;
      let newQty = 0;

      // Polymorphic argument handling:
      // Form A: updateCartItemQuantity(cartItemId, newQty)
      // Form B: updateCartItemQuantity(id, level, newQty)
      // Form C: updateCartItemQuantity(id, level, note, newQty)
      if (typeof cartItemIdOrId === 'string' && cartItemIdOrId.includes('__')) {
        targetCartItemId = cartItemIdOrId;
        newQty = levelOrQty;
      } else if (maybeQty !== undefined) {
        targetCartItemId = getCartItemKey(cartItemIdOrId, levelOrQty, quantityOrNote);
        newQty = maybeQty;
      } else {
        // Legacy (id, level, quantity)
        targetCartItemId = getCartItemKey(cartItemIdOrId, levelOrQty, '');
        newQty = quantityOrNote;
      }

      if (newQty <= 0) {
        removeFromCart(targetCartItemId);
        return;
      }

      setCart((prevCart) =>
        prevCart.map((item) => {
          const itemKey = item.cartItemId || getCartItemKey(item.id, item.level, item.note);
          if (itemKey === targetCartItemId || (item.id === cartItemIdOrId && item.level === levelOrQty && maybeQty === undefined && !targetCartItemId.includes('__note_'))) {
            return { ...item, quantity: newQty };
          }
          return item;
        })
      );
    },
    [removeFromCart]
  );

  const updateCartItemNote = useCallback((cartItemId, newNote) => {
    const cleanNote = (newNote || '').trim();
    setCart((prevCart) => {
      return prevCart.map((item) => {
        if (item.cartItemId === cartItemId) {
          const newKey = getCartItemKey(item.id, item.level, cleanNote);
          return {
            ...item,
            note: cleanNote,
            cartItemId: newKey
          };
        }
        return item;
      });
    });
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setCartBranchId(null);
    localStorage.removeItem('foodorder_cart');
    localStorage.removeItem('foodorder_cart_branch_id');
  }, []);

  const getTotalPrice = useCallback(() => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  }, [cart]);

  return (
    <CartContext.Provider
      value={{
        cart,
        cartBranchId,
        addToCart,
        removeFromCart,
        updateCartItemQuantity,
        updateCartItemNote,
        clearCart,
        getTotalPrice
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
