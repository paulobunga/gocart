'use client'
import ProductDescription from "@/components/ProductDescription";
import ProductDetails from "@/components/ProductDetails";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

export default function Product() {

    const { productId } = useParams();
    const [product, setProduct] = useState();
    const products = useSelector(state => state.product.list);

    const fetchProduct = async () => {
        // First try to find in Redux store
        let product = products.find((product) => product.id === productId);
        
        // If not found, fetch directly from API
        if (!product) {
            try {
                const response = await fetch(`/api/products`);
                const result = await response.json();
                if (result.success) {
                    product = result.data.find((p) => p.id === productId);
                }
            } catch (error) {
                console.error('Error fetching product:', error);
            }
        }
        
        setProduct(product);
    }

    useEffect(() => {
        fetchProduct();
        scrollTo(0, 0);
    }, [productId, products]);

    return (
        <div className="mx-6">
            <div className="max-w-7xl mx-auto">

                {/* Breadcrums */}
                <div className="  text-gray-600 text-sm mt-8 mb-5">
                    Home / Products / {product?.category}
                </div>

                {/* Product Details */}
                {product && (<ProductDetails product={product} />)}

                {/* Description & Reviews */}
                {product && (<ProductDescription product={product} />)}
            </div>
        </div>
    );
}