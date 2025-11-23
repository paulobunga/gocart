'use client'
import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { setProduct } from '@/lib/features/product/productSlice'

export default function ProductsLoader() {
    const dispatch = useDispatch()

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await fetch('/api/products')
                const result = await response.json()
                if (result.success) {
                    dispatch(setProduct(result.data))
                }
            } catch (error) {
                console.error('Error fetching products:', error)
            }
        }
        fetchProducts()
    }, [dispatch])

    return null
}

