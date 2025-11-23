'use client'
import { Search, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSelector } from "react-redux";
import { useUser, UserButton } from "@clerk/nextjs";
import CurrencySwitcher from "./CurrencySwitcher";
import LanguageSwitcher from "./LanguageSwitcher";

const Navbar = () => {

    const router = useRouter();
    const { isSignedIn, user } = useUser();

    const [search, setSearch] = useState('')
    const cartCount = useSelector(state => state.cart.total)

    const handleSearch = (e) => {
        e.preventDefault()
        router.push(`/shop?search=${search}`)
    }

    return (
        <nav className="relative bg-white">
            <div className="mx-6">
                <div className="flex items-center justify-between max-w-7xl mx-auto py-4  transition-all">

                    <Link href="/" className="relative text-4xl font-semibold text-slate-700">
                        <span className="text-green-600">go</span>cart<span className="text-green-600 text-5xl leading-0">.</span>
                        <p className="absolute text-xs font-semibold -top-1 -right-8 px-3 p-0.5 rounded-full flex items-center gap-2 text-white bg-green-500">
                            plus
                        </p>
                    </Link>

                    {/* Desktop Menu */}
                    <div className="hidden sm:flex items-center gap-4 lg:gap-8 text-slate-600">
                        <Link href="/">Home</Link>
                        <Link href="/onboarding" className="text-green-600 font-medium">Become A Vendor</Link>

                        <form onSubmit={handleSearch} className="hidden xl:flex items-center w-xs text-sm gap-2 bg-slate-100 px-4 py-3 rounded-full">
                            <Search size={18} className="text-slate-600" />
                            <input className="w-full bg-transparent outline-none placeholder-slate-600" type="text" placeholder="Search products" value={search} onChange={(e) => setSearch(e.target.value)} required />
                        </form>

                        <LanguageSwitcher />
                        <CurrencySwitcher />

                        <Link href="/cart" className="relative flex items-center gap-2 text-slate-600">
                            <ShoppingCart size={18} />
                            Cart
                            <button className="absolute -top-1 left-3 text-[8px] text-white bg-slate-600 size-3.5 rounded-full">{cartCount}</button>
                        </Link>

                        {isSignedIn ? (
                            <>
                                <Link href="/orders" className="text-slate-600 hover:text-slate-800 transition">
                                    Orders
                                </Link>
                                <Link href="/profile" className="text-slate-600 hover:text-slate-800 transition">
                                    Profile
                                </Link>
                                <UserButton 
                                    appearance={{
                                        elements: {
                                            avatarBox: "w-10 h-10",
                                            userButtonPopoverCard: "shadow-lg border border-slate-200",
                                            userButtonPopoverActionButton: "text-slate-700 hover:bg-slate-50",
                                            userButtonPopoverActionButtonText: "text-slate-700",
                                            userButtonPopoverFooter: "hidden",
                                        },
                                        variables: {
                                            colorPrimary: "#6366f1",
                                        },
                                    }}
                                    afterSignOutUrl="/"
                                />
                            </>
                        ) : (
                            <Link href="/sign-in">
                                <button className="px-8 py-2 bg-indigo-500 hover:bg-indigo-600 transition text-white rounded-full hover:scale-105 active:scale-95">
                                    Login
                                </button>
                            </Link>
                        )}

                    </div>

                    {/* Mobile Menu */}
                    <div className="sm:hidden flex items-center gap-2">
                        <Link href="/cart" className="relative">
                            <ShoppingCart size={20} className="text-slate-600" />
                            {cartCount > 0 && (
                                <span className="absolute -top-1 -right-1 text-[8px] text-white bg-slate-600 size-3.5 rounded-full flex items-center justify-center">{cartCount}</span>
                            )}
                        </Link>
                        {isSignedIn ? (
                            <UserButton 
                                appearance={{
                                    elements: {
                                        avatarBox: "w-8 h-8",
                                        userButtonPopoverCard: "shadow-lg border border-slate-200",
                                        userButtonPopoverActionButton: "text-slate-700 hover:bg-slate-50",
                                        userButtonPopoverActionButtonText: "text-slate-700",
                                        userButtonPopoverFooter: "hidden",
                                    },
                                    variables: {
                                        colorPrimary: "#6366f1",
                                    },
                                }}
                                afterSignOutUrl="/"
                            />
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