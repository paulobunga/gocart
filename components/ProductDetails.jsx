'use client'

import { addToCart } from "@/lib/features/cart/cartSlice";
import { StarIcon, TagIcon, EarthIcon, CreditCardIcon, UserIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";
import Counter from "./Counter";
import { useDispatch, useSelector } from "react-redux";
import { useCurrency } from "@/lib/contexts/CurrencyContext";

const ProductDetails = ({ product }) => {

    const productId = product.id;
    const { formatPrice } = useCurrency();

    const cart = useSelector(state => state.cart.cartItems);
    const dispatch = useDispatch();

    const router = useRouter()

    const [mainImage, setMainImage] = useState(product.images?.[0] || '');
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [selectedAttributeValues, setSelectedAttributeValues] = useState({});

    // Initialize variant selection for complex products
    useEffect(() => {
        if (product.productType === 'COMPLEX' && product.variants && product.variants.length > 0) {
            // Set first variant as default if available
            const firstVariant = product.variants.find(v => v.inStock) || product.variants[0];
            if (firstVariant) {
                setSelectedVariant(firstVariant);
                // Set main image from variant if available
                if (firstVariant.images && firstVariant.images.length > 0) {
                    setMainImage(firstVariant.images[0]);
                } else if (product.images && product.images.length > 0) {
                    setMainImage(product.images[0]);
                }
            }
        } else if (product.images && product.images.length > 0) {
            setMainImage(product.images[0]);
        }
    }, [product]);

    // Update selected variant when attribute values change
    useEffect(() => {
        if (product.productType === 'COMPLEX' && product.variants) {
            const selectedValueIds = Object.values(selectedAttributeValues);
            if (selectedValueIds.length === product.attributes?.length && selectedValueIds.length > 0) {
                // Find variant that matches all selected attribute values
                const matchingVariant = product.variants.find(variant => {
                    const variantValueIds = variant.attributes?.map(a => a.value.id).sort() || [];
                    const selectedIds = selectedValueIds.sort();
                    return JSON.stringify(variantValueIds) === JSON.stringify(selectedIds);
                });
                if (matchingVariant) {
                    setSelectedVariant(matchingVariant);
                    if (matchingVariant.images && matchingVariant.images.length > 0) {
                        setMainImage(matchingVariant.images[0]);
                    }
                }
            }
        }
    }, [selectedAttributeValues, product]);

    const handleAttributeValueSelect = (attributeId, valueId) => {
        setSelectedAttributeValues(prev => ({
            ...prev,
            [attributeId]: valueId
        }));
    }

    const addToCartHandler = () => {
        if (product.productType === 'COMPLEX' && selectedVariant) {
            dispatch(addToCart({ productId, variantId: selectedVariant.id }))
        } else {
            dispatch(addToCart({ productId }))
        }
    }

    const getCartKey = () => {
        if (product.productType === 'COMPLEX' && selectedVariant) {
            return `${productId}:${selectedVariant.id}`;
        }
        return productId;
    }

    const handleButtonClick = () => {
        const cartKey = getCartKey();
        if (!cart[cartKey]) {
            addToCartHandler();
        } else {
            router.push('/cart');
        }
    }

    // Get current price and stock info
    const currentPrice = selectedVariant ? selectedVariant.price : product.price;
    const currentMrp = selectedVariant ? selectedVariant.mrp : product.mrp;
    const currentStock = selectedVariant ? selectedVariant.stock : (product.inStock ? 'In Stock' : 'Out of Stock');
    const isInStock = selectedVariant ? selectedVariant.inStock : product.inStock;

    const averageRating = product.rating?.length > 0 
        ? product.rating.reduce((acc, item) => acc + item.rating, 0) / product.rating.length 
        : 0;
    
    // Get images to display (variant images or product images)
    const displayImages = selectedVariant?.images?.length > 0 
        ? selectedVariant.images 
        : (product.images || []);
    
    return (
        <div className="flex max-lg:flex-col gap-12">
            <div className="flex max-sm:flex-col-reverse gap-3">
                <div className="flex sm:flex-col gap-3">
                    {displayImages.map((image, index) => (
                        <div key={index} onClick={() => setMainImage(displayImages[index])} className="bg-slate-100 flex items-center justify-center size-26 rounded-lg group cursor-pointer">
                            <Image src={image} className="group-hover:scale-103 group-active:scale-95 transition" alt="" width={45} height={45} />
                        </div>
                    ))}
                </div>
                <div className="flex justify-center items-center h-100 sm:size-113 bg-slate-100 rounded-lg ">
                    {mainImage && <Image src={mainImage} alt="" width={250} height={250} />}
                </div>
            </div>
            <div className="flex-1">
                <h1 className="text-3xl font-semibold text-slate-800">{product.name}</h1>
                {selectedVariant && (
                    <div className="mt-2 text-sm text-slate-600">
                        {selectedVariant.attributes?.map((attr, idx) => (
                            <span key={idx}>
                                {attr.value.attribute.displayName}: {attr.value.displayValue || attr.value.value}
                                {idx < selectedVariant.attributes.length - 1 && ', '}
                            </span>
                        ))}
                    </div>
                )}
                <div className='flex items-center mt-2'>
                    {Array(5).fill('').map((_, index) => (
                        <StarIcon key={index} size={14} className='text-transparent mt-0.5' fill={averageRating >= index + 1 ? "#00C950" : "#D1D5DB"} />
                    ))}
                    <p className="text-sm ml-3 text-slate-500">{product.rating?.length || 0} Reviews</p>
                </div>
                <div className="flex items-start my-6 gap-3 text-2xl font-semibold text-slate-800">
                    <p> {formatPrice(currentPrice)} </p>
                    <p className="text-xl text-slate-500 line-through">{formatPrice(currentMrp)}</p>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                    <TagIcon size={14} />
                    <p>Save {((currentMrp - currentPrice) / currentMrp * 100).toFixed(0)}% right now</p>
                </div>

                {/* Variant Selection for Complex Products */}
                {product.productType === 'COMPLEX' && product.attributes && product.attributes.length > 0 && (
                    <div className="my-6 space-y-4">
                        {product.attributes.map((mapping) => {
                            const attribute = mapping.attribute;
                            return (
                                <div key={attribute.id}>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        {attribute.displayName}
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {attribute.values?.map((value) => {
                                            const isSelected = selectedAttributeValues[attribute.id] === value.id;
                                            const isAvailable = product.variants?.some(v => 
                                                v.inStock && v.attributes?.some(a => a.value.id === value.id)
                                            );
                                            return (
                                                <button
                                                    key={value.id}
                                                    type="button"
                                                    onClick={() => handleAttributeValueSelect(attribute.id, value.id)}
                                                    disabled={!isAvailable}
                                                    className={`px-4 py-2 rounded-lg border-2 text-sm transition ${
                                                        isSelected
                                                            ? 'border-slate-800 bg-slate-800 text-white'
                                                            : isAvailable
                                                            ? 'border-slate-300 hover:border-slate-400 text-slate-700'
                                                            : 'border-slate-200 text-slate-400 cursor-not-allowed opacity-50'
                                                    }`}
                                                >
                                                    {value.displayValue || value.value}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                        {selectedVariant && (
                            <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                                <p className="text-sm text-slate-600">
                                    <span className="font-medium">Stock:</span> {selectedVariant.stock} units
                                    {!selectedVariant.inStock && (
                                        <span className="text-red-600 ml-2">(Out of Stock)</span>
                                    )}
                                </p>
                                {selectedVariant.sku && (
                                    <p className="text-xs text-slate-500 mt-1">SKU: {selectedVariant.sku}</p>
                                )}
                            </div>
                        )}
                    </div>
                )}

                <div className="flex items-end gap-5 mt-10">
                    {
                        cart[getCartKey()] && (
                            <div className="flex flex-col gap-3">
                                <p className="text-lg text-slate-800 font-semibold">Quantity</p>
                                <Counter productId={productId} variantId={selectedVariant?.id} />
                            </div>
                        )
                    }
                    <button 
                        onClick={handleButtonClick} 
                        disabled={product.productType === 'COMPLEX' && !selectedVariant}
                        className={`bg-slate-800 text-white px-10 py-3 text-sm font-medium rounded hover:bg-slate-900 active:scale-95 transition ${
                            (product.productType === 'COMPLEX' && !selectedVariant) || !isInStock
                                ? 'opacity-50 cursor-not-allowed' 
                                : ''
                        }`}
                    >
                        {!isInStock 
                            ? 'Out of Stock' 
                            : !cart[getCartKey()] 
                            ? 'Add to Cart' 
                            : 'View Cart'}
                    </button>
                </div>
                <hr className="border-gray-300 my-5" />
                <div className="flex flex-col gap-4 text-slate-500">
                    <p className="flex gap-3"> <EarthIcon className="text-slate-400" /> Free shipping worldwide </p>
                    <p className="flex gap-3"> <CreditCardIcon className="text-slate-400" /> 100% Secured Payment </p>
                    <p className="flex gap-3"> <UserIcon className="text-slate-400" /> Trusted by top brands </p>
                </div>

            </div>
        </div>
    )
}

export default ProductDetails