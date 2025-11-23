'use client'
import { useUser } from "@clerk/nextjs";
import { UserProfile } from "@clerk/nextjs";
import PageTitle from "@/components/PageTitle";
import Loading from "@/components/Loading";

export default function ProfilePage() {
    const { isLoaded, user } = useUser();

    if (!isLoaded) {
        return <Loading />;
    }

    if (!user) {
        return (
            <div className="min-h-[70vh] mx-6 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-semibold text-slate-800 mb-2">Please sign in</h1>
                    <p className="text-slate-600">You need to be signed in to view your profile.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[70vh] mx-6 my-8">
            <div className="max-w-4xl mx-auto">
                <PageTitle 
                    heading="My Profile" 
                    text="Manage your account settings and profile information" 
                    linkText="Go to home" 
                />
                <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <UserProfile 
                        appearance={{
                            elements: {
                                rootBox: "w-full",
                                card: "shadow-none border-0",
                            },
                        }}
                    />
                </div>
            </div>
        </div>
    );
}

