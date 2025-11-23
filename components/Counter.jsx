'use client'
import { addToCart, removeFromCart } from "@/lib/features/cart/cartSlice";
import { useDispatch, useSelector } from "react-redux";

const Counter = ({ productId, variantId }) => {

    const { cartItems } = useSelector(state => state.cart);

    const dispatch = useDispatch();

    const cartKey = variantId ? `${productId}:${variantId}` : productId;

    const addToCartHandler = () => {
        dispatch(addToCart({ productId, variantId }))
    }

    const removeFromCartHandler = () => {
        dispatch(removeFromCart({ productId, variantId }))
    }

    return (
        <div className="inline-flex items-center gap-1 sm:gap-3 px-3 py-1 rounded border border-slate-200 max-sm:text-sm text-slate-600">
            <button onClick={removeFromCartHandler} className="p-1 select-none">-</button>
            <p className="p-1">{cartItems[cartKey] || 0}</p>
            <button onClick={addToCartHandler} className="p-1 select-none">+</button>
        </div>
    )
}

export default Counter