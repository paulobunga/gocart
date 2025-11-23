'use client'
import { assets } from '@/assets/assets'
import { ArrowRightIcon, ChevronRightIcon, FolderIcon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import React, { useEffect, useState, useRef } from 'react'
import CategoriesMarquee from './CategoriesMarquee'

const Hero = () => {
    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '$'
    const [categories, setCategories] = useState([])
    const [allCategories, setAllCategories] = useState([]) // Store all categories for finding children
    const [loading, setLoading] = useState(true)
    const [hoveredCategory, setHoveredCategory] = useState(null)
    const [isOverlayVisible, setIsOverlayVisible] = useState(false)
    const hoverTimeoutRef = useRef(null)

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                // Fetch flat list for display
                const flatResponse = await fetch('/api/categories?flat=true')
                const flatResult = await flatResponse.json()
                
                // Fetch tree structure for getting children
                const treeResponse = await fetch('/api/categories')
                const treeResult = await treeResponse.json()
                
                if (flatResult.success && treeResult.success) {
                    // Store all categories for finding children
                    setAllCategories(flatResult.data)
                    
                    // Get only top-level categories (no parent) and limit to 8-10 for display
                    const topLevelCategories = flatResult.data
                        .filter(cat => !cat.parentId && cat.isActive)
                        .slice(0, 10)
                    setCategories(topLevelCategories)
                }
            } catch (error) {
                console.error('Error fetching categories:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchCategories()
    }, [])

    // Get children of hovered category
    const getCategoryChildren = (categoryId) => {
        return allCategories.filter(cat => cat.parentId === categoryId && cat.isActive)
    }

    const categoryChildren = hoveredCategory ? getCategoryChildren(hoveredCategory.id) : []

    // Handle mouse enter on category item
    const handleCategoryEnter = (category) => {
        // Clear any existing timeout
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current)
            hoverTimeoutRef.current = null
        }
        // Immediately show overlay
        setHoveredCategory(category)
        setIsOverlayVisible(true)
    }

    // Handle mouse leave from category item or overlay
    const handleCategoryLeave = () => {
        // Set a delay before hiding (300ms)
        hoverTimeoutRef.current = setTimeout(() => {
            setIsOverlayVisible(false)
            // Clear category after fadeout animation completes
            setTimeout(() => {
                setHoveredCategory(null)
            }, 200) // Match the fadeout duration
        }, 300)
    }

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current)
            }
        }
    }, [])

    return (
        <div className='mx-6'>
            <div className='flex max-xl:flex-col gap-8 max-w-7xl mx-auto my-10 relative'>
                {/* Category List - Left Side */}
                <div className='xl:max-w-xs w-full xl:min-h-100 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm relative z-10'>
                    <h3 className='text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2'>
                        <FolderIcon size={20} className='text-green-600' />
                        Categories
                    </h3>
                    {loading ? (
                        <div className='space-y-2'>
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className='h-10 bg-slate-100 rounded-lg animate-pulse' />
                            ))}
                        </div>
                    ) : categories.length > 0 ? (
                        <div className='space-y-1'>
                            {categories.map((category) => (
                                <div
                                    key={category.id}
                                    onMouseEnter={() => handleCategoryEnter(category)}
                                    onMouseLeave={handleCategoryLeave}
                                    className='relative'
                                >
                                    <Link
                                        href={`/shop?category=${encodeURIComponent(category.name)}`}
                                        className='flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors group'
                                    >
                                        <div className='flex items-center gap-3 flex-1 min-w-0'>
                                            {category.thumbnail && (
                                                <Image
                                                    src={category.thumbnail}
                                                    alt={category.name}
                                                    width={32}
                                                    height={32}
                                                    className='rounded object-cover flex-shrink-0'
                                                />
                                            )}
                                            {!category.thumbnail && (
                                                <div className='w-8 h-8 bg-slate-200 rounded flex items-center justify-center flex-shrink-0'>
                                                    <FolderIcon size={16} className='text-slate-400' />
                                                </div>
                                            )}
                                            <span className='text-sm text-slate-700 font-medium truncate group-hover:text-green-600 transition-colors'>
                                                {category.name}
                                            </span>
                                        </div>
                                        <ChevronRightIcon size={16} className='text-slate-400 group-hover:text-green-600 group-hover:translate-x-1 transition-all flex-shrink-0' />
                                    </Link>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className='text-sm text-slate-500'>No categories available</p>
                    )}
                </div>

                {/* Center and Right Sections Container - for hover overlay */}
                <div className='flex-1 flex gap-8 xl:min-h-100 relative'>
                    {/* Main Hero Section - Center */}
                    <div className='relative flex-1 flex flex-col bg-green-200 rounded-3xl group'>
                        <div className='p-5 sm:p-16'>
                            <div className='inline-flex items-center gap-3 bg-green-300 text-green-600 pr-4 p-1 rounded-full text-xs sm:text-sm'>
                                <span className='bg-green-600 px-3 py-1 max-sm:ml-1 rounded-full text-white text-xs'>NEWS</span> Free Shipping on Orders Above $50! <ChevronRightIcon className='group-hover:ml-2 transition-all' size={16} />
                            </div>
                            <h2 className='text-3xl sm:text-5xl leading-[1.2] my-3 font-medium bg-gradient-to-r from-slate-600 to-[#A0FF74] bg-clip-text text-transparent max-w-xs  sm:max-w-md'>
                                Gadgets you'll love. Prices you'll trust.
                            </h2>
                            <div className='text-slate-800 text-sm font-medium mt-4 sm:mt-8'>
                                <p>Starts from</p>
                                <p className='text-3xl'>{currency}4.90</p>
                            </div>
                            <button className='bg-slate-800 text-white text-sm py-2.5 px-7 sm:py-5 sm:px-12 mt-4 sm:mt-10 rounded-md hover:bg-slate-900 hover:scale-103 active:scale-95 transition'>LEARN MORE</button>
                        </div>
                        <Image className='sm:absolute bottom-0 right-0 md:right-10 w-full sm:max-w-sm' src={assets.hero_model_img} alt="" />
                    </div>

                    {/* Product Cards - Right Side */}
                    <div className='flex flex-col md:flex-row xl:flex-col gap-5 w-full xl:max-w-sm text-sm text-slate-600'>
                        <div className='flex-1 flex items-center justify-between w-full bg-orange-200 rounded-3xl p-6 px-8 group'>
                            <div>
                                <p className='text-3xl font-medium bg-gradient-to-r from-slate-800 to-[#FFAD51] bg-clip-text text-transparent max-w-40'>Best products</p>
                                <p className='flex items-center gap-1 mt-4'>View more <ArrowRightIcon className='group-hover:ml-2 transition-all' size={18} /> </p>
                            </div>
                            <Image className='w-35' src={assets.hero_product_img1} alt="" />
                        </div>
                        <div className='flex-1 flex items-center justify-between w-full bg-blue-200 rounded-3xl p-6 px-8 group'>
                            <div>
                                <p className='text-3xl font-medium bg-gradient-to-r from-slate-800 to-[#78B2FF] bg-clip-text text-transparent max-w-40'>20% discounts</p>
                                <p className='flex items-center gap-1 mt-4'>View more <ArrowRightIcon className='group-hover:ml-2 transition-all' size={18} /> </p>
                            </div>
                            <Image className='w-35' src={assets.hero_product_img2} alt="" />
                        </div>
                    </div>

                    {/* Hover Overlay - Shows subcategories */}
                    {hoveredCategory && categoryChildren.length > 0 && (
                        <div 
                            className={`absolute inset-0 bg-white rounded-3xl p-6 border border-slate-200 shadow-lg z-20 flex flex-col transition-opacity duration-200 ${
                                isOverlayVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
                            }`}
                            onMouseEnter={handleCategoryEnter.bind(null, hoveredCategory)}
                            onMouseLeave={handleCategoryLeave}
                        >
                            <div className='flex items-center gap-3 mb-4 pb-4 border-b border-slate-200'>
                                {hoveredCategory.thumbnail && (
                                    <Image
                                        src={hoveredCategory.thumbnail}
                                        alt={hoveredCategory.name}
                                        width={40}
                                        height={40}
                                        className='rounded object-cover'
                                    />
                                )}
                                <div>
                                    <h3 className='text-lg font-semibold text-slate-800'>{hoveredCategory.name}</h3>
                                    {hoveredCategory.description && (
                                        <p className='text-sm text-slate-500'>{hoveredCategory.description}</p>
                                    )}
                                </div>
                            </div>
                            <div className='flex-1 overflow-y-auto'>
                                <h4 className='text-sm font-medium text-slate-600 mb-3'>Subcategories</h4>
                                <div className='grid grid-cols-2 gap-3'>
                                    {categoryChildren.map((child) => (
                                        <Link
                                            key={child.id}
                                            href={`/shop?category=${encodeURIComponent(child.name)}`}
                                            className='flex items-center gap-2 p-3 rounded-lg hover:bg-slate-50 transition-colors group'
                                            onClick={() => setHoveredCategory(null)}
                                        >
                                            {child.thumbnail && (
                                                <Image
                                                    src={child.thumbnail}
                                                    alt={child.name}
                                                    width={32}
                                                    height={32}
                                                    className='rounded object-cover flex-shrink-0'
                                                />
                                            )}
                                            {!child.thumbnail && (
                                                <div className='w-8 h-8 bg-slate-200 rounded flex items-center justify-center flex-shrink-0'>
                                                    <FolderIcon size={14} className='text-slate-400' />
                                                </div>
                                            )}
                                            <span className='text-sm text-slate-700 font-medium truncate group-hover:text-green-600 transition-colors'>
                                                {child.name}
                                            </span>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                            <Link
                                href={`/shop?category=${encodeURIComponent(hoveredCategory.name)}`}
                                className='mt-4 pt-4 border-t border-slate-200 text-center text-sm font-medium text-green-600 hover:text-green-700 transition-colors'
                                onClick={() => setHoveredCategory(null)}
                            >
                                View all {hoveredCategory.name} products →
                            </Link>
                        </div>
                    )}
                </div>
            </div>
            <CategoriesMarquee />
        </div>

    )
}

export default Hero