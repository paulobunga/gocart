'use client'
import { Search, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useUser } from "@clerk/nextjs";
import CurrencySwitcher from "./CurrencySwitcher";
import LanguageSwitcher from "./LanguageSwitcher";
import UserMenu from "./UserMenu";
import CurrentAddress from "./CurrentAddress";

const Navbar = () => {

    const router = useRouter();
    const { isSignedIn, user } = useUser();

    const [search, setSearch] = useState('')
    const [mounted, setMounted] = useState(false)
    const [cartCount, setCartCount] = useState(0)
    const reduxCartCount = useSelector(state => state.cart.total)

    // Prevent hydration mismatch by only rendering client-only content after mount
    useEffect(() => {
        setMounted(true)
        setCartCount(reduxCartCount)
    }, [reduxCartCount])

    const handleSearch = (e) => {
        e.preventDefault()
        router.push(`/shop?search=${search}`)
    }

    return (
        <nav className="relative bg-white">
            {/* Top Header - Small header with address on left, currency and language switchers on right */}
            <div className="border-b border-slate-200">
                <div className="mx-6">
                        <div className="flex items-center justify-between max-w-7xl mx-auto py-2">
                        {/* Left Section - Current Address */}
                        <div className="flex items-center">
                            {mounted && <CurrentAddress />}
                        </div>
                        {/* Right Section - Language and Currency Switchers */}
                        <div className="flex items-center gap-2">
                            {mounted && <LanguageSwitcher />}
                            {mounted && <CurrencySwitcher />}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Header - 3 sections: logo left, search center, actions right */}
            <div className="mx-6">
                <div className="flex items-center justify-between max-w-7xl mx-auto py-4 transition-all">
                    {/* Left Section - Logo */}
                    <Link href="/" className="relative text-4xl font-semibold text-slate-700">
                        <span className="text-green-600">go</span>cart<span className="text-green-600 text-5xl leading-0">.</span>
                        <p className="absolute text-xs font-semibold -top-1 -right-8 px-3 p-0.5 rounded-full flex items-center gap-2 text-white bg-green-500">
                            plus
                        </p>
                    </Link>

                    {/* Center Section - Search Input */}
                    <form onSubmit={handleSearch} className="hidden md:flex items-center flex-1 max-w-lg mx-8 text-sm gap-2 bg-slate-100 px-4 py-3 rounded-full">
                        <Search size={18} className="text-slate-600" />
                        <input className="w-full bg-transparent outline-none placeholder-slate-600" type="text" placeholder="Search products" value={search} onChange={(e) => setSearch(e.target.value)} required />
                    </form>

                    {/* Right Section - Actions */}
                    <div className="hidden sm:flex items-center gap-4 lg:gap-6 text-slate-600">
                        <Link href="/cart" className="relative flex items-center gap-2 text-slate-600 hover:text-slate-800 transition">
                            <div className="relative">
                                <ShoppingCart size={18} />
                                {mounted && cartCount > 0 && (
                                    <span className="absolute -top-2 -right-2 text-[10px] font-medium text-white bg-red-500 min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1">{cartCount}</span>
                                )}
                            </div>
                            <span className="hidden lg:inline">Cart</span>
                        </Link>

                        {mounted && isSignedIn ? (
                            <UserMenu size="md" showLabel={true} />
                        ) : (
                            <Link href="/sign-in">
                                <button className="px-8 py-2 bg-indigo-500 hover:bg-indigo-600 transition text-white rounded-full hover:scale-105 active:scale-95">
                                    Sign In / Sign Up
                                </button>
                            </Link>
                        )}
                    </div>

                    {/* Mobile Menu */}
                    <div className="sm:hidden flex items-center gap-2">
                        <form onSubmit={handleSearch} className="flex items-center text-sm gap-2 bg-slate-100 px-3 py-2 rounded-full mr-2">
                            <Search size={16} className="text-slate-600" />
                            <input className="w-24 bg-transparent outline-none placeholder-slate-600 text-xs" type="text" placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} required />
                        </form>
                        <Link href="/cart" className="relative">
                            <ShoppingCart size={20} className="text-slate-600" />
                            {mounted && cartCount > 0 && (
                                <span className="absolute -top-1 -right-1 text-[10px] font-medium text-white bg-red-500 min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1">{cartCount}</span>
                            )}
                        </Link>
                        {mounted && isSignedIn ? (
                            <UserMenu size="sm" />
                        ) : (
                            <Link href="/sign-in">
                                <button className="px-7 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-sm transition text-white rounded-full hover:scale-105 active:scale-95">
                                    Login
                                </button>
                            </Link>
                        )}
                    </div>
                </div>
            </div>
            <hr className="border-gray-300" />
        </nav>
    )
}

export default Navbar