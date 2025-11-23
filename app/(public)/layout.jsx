'use client'
import Banner from "@/components/Banner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductsLoader from "@/components/ProductsLoader";

export default function PublicLayout({ children }) {

    return (
        <>
            <ProductsLoader />
            <Banner />
            <Navbar />
            {children}
            <Footer />
        </>
    );
}
