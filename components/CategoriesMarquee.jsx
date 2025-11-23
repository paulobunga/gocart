'use client'
import { useEffect, useState } from "react";

// Helper function to flatten category tree and extract names
const flattenCategoryNames = (categories) => {
    if (!categories || !Array.isArray(categories)) {
        return [];
    }
    const names = [];
    const traverse = (cats) => {
        cats.forEach(cat => {
            if (cat && cat.name) {
                names.push(cat.name);
                if (cat.children && Array.isArray(cat.children) && cat.children.length > 0) {
                    traverse(cat.children);
                }
            }
        });
    };
    traverse(categories);
    return names;
};

const CategoriesMarquee = () => {
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await fetch('/api/categories');
                const result = await response.json();
                if (result.success && result.data) {
                    // Extract category names from the tree structure
                    const categoryNames = flattenCategoryNames(result.data);
                    setCategories(categoryNames);
                }
            } catch (error) {
                console.error('Error fetching categories:', error);
            }
        };
        fetchCategories();
    }, []);

    if (categories.length === 0) return null;

    return (
        <div className="overflow-hidden w-full relative max-w-7xl mx-auto select-none group sm:my-20">
            <div className="absolute left-0 top-0 h-full w-20 z-10 pointer-events-none bg-gradient-to-r from-white to-transparent" />
            <div className="flex min-w-[200%] animate-[marqueeScroll_10s_linear_infinite] sm:animate-[marqueeScroll_40s_linear_infinite] group-hover:[animation-play-state:paused] gap-4" >
                {[...categories, ...categories, ...categories, ...categories].map((categoryName, index) => (
                    <button key={index} className="px-5 py-2 bg-slate-100 rounded-lg text-slate-500 text-xs sm:text-sm hover:bg-slate-600 hover:text-white active:scale-95 transition-all duration-300">
                        {categoryName}
                    </button>
                ))}
            </div>
            <div className="absolute right-0 top-0 h-full w-20 md:w-40 z-10 pointer-events-none bg-gradient-to-l from-white to-transparent" />
        </div>
    );
};

export default CategoriesMarquee;