import { createSlice } from '@reduxjs/toolkit'

// Helper function to calculate total from cartItems
const calculateTotal = (cartItems) => {
    if (!cartItems || typeof cartItems !== 'object' || Array.isArray(cartItems)) {
        return 0
    }
    return Object.values(cartItems).reduce((sum, quantity) => {
        const qty = typeof quantity === 'number' ? quantity : 0
        return sum + qty
    }, 0)
}

// Load cart from localStorage
const loadCartFromStorage = () => {
    if (typeof window === 'undefined') {
        console.log('[cartSlice] loadCartFromStorage: window undefined, returning default');
        return { total: 0, cartItems: {} }
    }
    try {
        const stored = localStorage.getItem('cart')
        console.log('[cartSlice] loadCartFromStorage: raw stored value:', stored);
        
        if (stored) {
            const parsed = JSON.parse(stored)
            console.log('[cartSlice] loadCartFromStorage: parsed value:', {
                parsed,
                cartItems: parsed.cartItems,
                cartItemsType: typeof parsed.cartItems,
                cartItemsIsArray: Array.isArray(parsed.cartItems)
            });
            
            // Ensure cartItems is always an object, not a number or other type
            const cartItems = (parsed.cartItems && typeof parsed.cartItems === 'object' && !Array.isArray(parsed.cartItems))
                ? parsed.cartItems
                : {}
            
            console.log('[cartSlice] loadCartFromStorage: final cartItems:', {
                cartItems,
                type: typeof cartItems,
                isArray: Array.isArray(cartItems)
            });
            
            return {
                cartItems,
                total: calculateTotal(cartItems)
            }
        }
    } catch (error) {
        console.error('[cartSlice] Error loading cart from localStorage:', error)
    }
    console.log('[cartSlice] loadCartFromStorage: returning default empty cart');
    return { total: 0, cartItems: {} }
}

// Save cart to localStorage
const saveCartToStorage = (cartItems) => {
    if (typeof window === 'undefined') return
    try {
        localStorage.setItem('cart', JSON.stringify({ cartItems }))
    } catch (error) {
        console.error('Error saving cart to localStorage:', error)
    }
}

const initialState = loadCartFromStorage()

const cartSlice = createSlice({
    name: 'cart',
    initialState,
    reducers: {
        addToCart: (state, action) => {
            console.log('[cartSlice] addToCart called with:', {
                payload: action.payload,
                currentState: state,
                currentCartItems: state.cartItems,
                cartItemsType: typeof state.cartItems,
                cartItemsIsArray: Array.isArray(state.cartItems)
            });
            
            // Ensure state.cartItems is an object
            if (!state.cartItems || typeof state.cartItems !== 'object' || Array.isArray(state.cartItems)) {
                console.warn('[cartSlice] addToCart: cartItems was invalid, resetting to {}', {
                    oldValue: state.cartItems,
                    oldType: typeof state.cartItems
                });
                state.cartItems = {}
            }
            const { productId, variantId } = action.payload
            // Create cart key: productId for simple products, productId:variantId for variants
            const cartKey = variantId ? `${productId}:${variantId}` : productId
            if (state.cartItems[cartKey]) {
                state.cartItems[cartKey]++
            } else {
                state.cartItems[cartKey] = 1
            }
            state.total = calculateTotal(state.cartItems)
            
            console.log('[cartSlice] addToCart: after update', {
                cartKey,
                newQuantity: state.cartItems[cartKey],
                cartItems: state.cartItems,
                total: state.total
            });
            
            saveCartToStorage(state.cartItems)
        },
        removeFromCart: (state, action) => {
            // Ensure state.cartItems is an object
            if (!state.cartItems || typeof state.cartItems !== 'object' || Array.isArray(state.cartItems)) {
                state.cartItems = {}
            }
            const { productId, variantId } = action.payload
            const cartKey = variantId ? `${productId}:${variantId}` : productId
            if (state.cartItems[cartKey]) {
                state.cartItems[cartKey]--
                if (state.cartItems[cartKey] === 0) {
                    delete state.cartItems[cartKey]
                }
            }
            state.total = calculateTotal(state.cartItems)
            saveCartToStorage(state.cartItems)
        },
        deleteItemFromCart: (state, action) => {
            // Ensure state.cartItems is an object
            if (!state.cartItems || typeof state.cartItems !== 'object' || Array.isArray(state.cartItems)) {
                state.cartItems = {}
            }
            const { productId, variantId } = action.payload
            const cartKey = variantId ? `${productId}:${variantId}` : productId
            delete state.cartItems[cartKey]
            state.total = calculateTotal(state.cartItems)
            saveCartToStorage(state.cartItems)
        },
        clearCart: (state) => {
            state.cartItems = {}
            state.total = 0
            saveCartToStorage(state.cartItems)
        },
        loadCart: (state, action) => {
            const { cartItems } = action.payload
            // Ensure cartItems is always an object, not a number or other type
            state.cartItems = (cartItems && typeof cartItems === 'object' && !Array.isArray(cartItems))
                ? cartItems
                : {}
            state.total = calculateTotal(state.cartItems)
            saveCartToStorage(state.cartItems)
        },
        mergeCart: (state, action) => {
            const { cartItems: dbCartItems } = action.payload
            // Ensure dbCartItems is an object before merging
            if (!dbCartItems || typeof dbCartItems !== 'object' || Array.isArray(dbCartItems)) {
                return // Skip merge if dbCartItems is invalid
            }
            // Ensure state.cartItems is an object
            if (!state.cartItems || typeof state.cartItems !== 'object' || Array.isArray(state.cartItems)) {
                state.cartItems = {}
            }
            // Merge local cart with database cart
            // If same product exists in both, use the higher quantity
            const merged = { ...state.cartItems }
            for (const [productId, quantity] of Object.entries(dbCartItems)) {
                if (merged[productId]) {
                    merged[productId] = Math.max(merged[productId], quantity)
                } else {
                    merged[productId] = quantity
                }
            }
            state.cartItems = merged
            state.total = calculateTotal(state.cartItems)
            saveCartToStorage(state.cartItems)
        },
    }
})

export const { addToCart, removeFromCart, clearCart, deleteItemFromCart, loadCart, mergeCart } = cartSlice.actions

export default cartSlice.reducer
