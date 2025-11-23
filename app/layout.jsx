import { Outfit } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { ClerkProvider } from '@clerk/nextjs';
import StoreProvider from "@/app/StoreProvider";
import { CurrencyProvider } from "@/lib/contexts/CurrencyContext";
import { LanguageProvider } from "@/lib/contexts/LanguageContext";
import UserSync from "@/components/UserSync";
import CartSync from "@/components/CartSync";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"], weight: ["400", "500", "600"] });

export const metadata = {
    title: "GoCart. - Shop smarter",
    description: "GoCart. - Shop smarter",
};

export default function RootLayout({ children }) {
    return (
        <ClerkProvider>
            <html lang="en" dir="ltr">
                <body className={`${outfit.className} antialiased`}>
                    <StoreProvider>
                        <LanguageProvider>
                            <CurrencyProvider>
                                <UserSync />
                                <CartSync />
                                <Toaster />
                                {children}
                            </CurrencyProvider>
                        </LanguageProvider>
                    </StoreProvider>
                </body>
            </html>
        </ClerkProvider>
    );
}
