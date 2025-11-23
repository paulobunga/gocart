'use client'
import Counter from "@/components/Counter";
import OrderSummary from "@/components/OrderSummary";
import PageTitle from "@/components/PageTitle";
import { deleteItemFromCart } from "@/lib/features/cart/cartSlice";
import { Trash2Icon } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useCurrency } from "@/lib/contexts/CurrencyContext";

export default function Cart() {

    const { formatPrice } = useCurrency();
    
    const { cartItems } = useSelector(state => state.cart);
    const products = useSelector(state => state.product.list);

    const dispatch = useDispatch();

    const [cartArray, setCartArray] = useState([]);
    const [totalPrice, setTotalPrice] = useState(0);

    const createCartArray = () => {
        setTotalPrice(0);
        const cartArray = [];
        for (const [key, value] of Object.entries(cartItems)) {
            // Parse cart key: could be "productId" or "productId:variantId"
            const [productId, variantId] = key.split(':');
            const product = products.find(product => product.id === productId);
            if (product) {
                let variant = null;
                let itemPrice = product.price;
                let itemImages = product.images || [];
                
                // If variantId exists, find the variant
                if (variantId && product.variants) {
                    variant = product.variants.find(v => v.id === variantId);
                    if (variant) {
                        itemPrice = variant.price;
                        itemImages = variant.images?.length > 0 ? variant.images : product.images || [];
                    }
                }
                
                cartArray.push({
                    ...product,
                    variantId: variantId || null,
                    variant: variant,
                    quantity: value,
                    price: itemPrice,
                    displayImages: itemImages,
                });
                setTotalPrice(prev => prev + itemPrice * value);
            }
        }
        setCartArray(cartArray);
    }

    const handleDeleteItemFromCart = (productId, variantId) => {
        dispatch(deleteItemFromCart({ productId, variantId }))
    }

    useEffect(() => {
        if (products.length > 0) {
            createCartArray();
        }
    }, [cartItems, products]);

    return cartArray.length > 0 ? (
        <div className="min-h-screen mx-6 text-slate-800">

            <div className="max-w-7xl mx-auto ">
                {/* Title */}
                <PageTitle heading="My Cart" text="items in your cart" linkText="Add more" />

                <div className="flex items-start justify-between gap-5 max-lg:flex-col">

                    <table className="w-full max-w-4xl text-slate-600 table-auto">
                        <thead>
                            <tr className="max-sm:text-sm">
                                <th className="text-left">Product</th>
                                <th>Quantity</th>
                                <th>Total Price</th>
                                <th className="max-md:hidden">Remove</th>
                            </tr>
                        </thead>
                        <tbody>
                            {
                                cartArray.map((item, index) => (
                                    <tr key={index} className="space-x-2">
                                        <td className="flex gap-3 my-4">
                                            <div className="flex gap-3 items-center justify-center bg-slate-100 size-18 rounded-md">
                                                <Image src={item.displayImages?.[0] || item.images?.[0] || ''} className="h-14 w-auto" alt="" width={45} height={45} />
                                            </div>
                                            <div>
                                                <p className="max-sm:text-sm">{item.name}</p>
                                                {item.variant && (
                                                    <p className="text-xs text-slate-600 font-medium mt-1">
                                                        {item.variant.attributes?.map((attr, idx) => (
                                                            <span key={idx}>
                                                                {attr.value.attribute.displayName}: {attr.value.displayValue || attr.value.value}
                                                                {idx < item.variant.attributes.length - 1 && ', '}
                                                            </span>
                                                        ))}
                                                    </p>
                                                )}
                                                <p className="text-xs text-slate-500">{item.category}</p>
                                                <p>{formatPrice(item.price)}</p>
                                            </div>
                                        </td>
                                        <td className="text-center">
                                            <Counter productId={item.id} variantId={item.variantId} />
                                        </td>
                                        <td className="text-center">{formatPrice(item.price * item.quantity)}</td>
                                        <td className="text-center max-md:hidden">
                                            <button onClick={() => handleDeleteItemFromCart(item.id, item.variantId)} className=" text-red-500 hover:bg-red-50 p-2.5 rounded-full active:scale-95 transition-all">
                                                <Trash2Icon size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            }
                        </tbody>
                    </table>
                    <OrderSummary totalPrice={totalPrice} items={cartArray} />
                </div>
            </div>
        </div>
    ) : (
        <div className="min-h-[80vh] mx-6 flex items-center justify-center text-slate-400">
            <h1 className="text-2xl sm:text-4xl font-semibold">Your cart is empty</h1>
        </div>
    )
}