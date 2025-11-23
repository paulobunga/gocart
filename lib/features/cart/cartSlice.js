import { createSlice } from '@reduxjs/toolkit'

// Helper function to calculate total from cartItems
const calculateTotal = (cartItems) => {
    return Object.values(cartItems).reduce((sum, quantity) => sum + quantity, 0)
}

// Load cart from localStorage
const loadCartFromStorage = () => {
    if (typeof window === 'undefined') {
        return { total: 0, cartItems: {} }
    }
    try {
        const stored = localStorage.getItem('cart')
        if (stored) {
            const parsed = JSON.parse(stored)
            return {
                cartItems: parsed.cartItems || {},
                total: calculateTotal(parsed.cartItems || {})
            }
        }
    } catch (error) {
        console.error('Error loading cart from localStorage:', error)
    }
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
            const { productId, variantId } = action.payload
            // Create cart key: productId for simple products, productId:variantId for variants
            const cartKey = variantId ? `${productId}:${variantId}` : productId
            if (state.cartItems[cartKey]) {
                state.cartItems[cartKey]++
            } else {
                state.cartItems[cartKey] = 1
            }
            state.total = calculateTotal(state.cartItems)
            saveCartToStorage(state.cartItems)
        },
        removeFromCart: (state, action) => {
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
            state.cartItems = cartItems || {}
            state.total = calculateTotal(state.cartItems)
            saveCartToStorage(state.cartItems)
        },
        mergeCart: (state, action) => {
            const { cartItems: dbCartItems } = action.payload
            // Merge local cart with database cart
            // If same product exists in both, use the higher quantity
            const merged = { ...state.cartItems }
            for (const [productId, quantity] of Object.entries(dbCartItems || {})) {
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
