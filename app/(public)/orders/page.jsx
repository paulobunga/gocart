'use client'
import PageTitle from "@/components/PageTitle"
import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import OrderItem from "@/components/OrderItem";
import Loading from "@/components/Loading";

export default function Orders() {
    const { isLoaded, isSignedIn } = useUser();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isLoaded) return;

        if (!isSignedIn) {
            setLoading(false);
            return;
        }

        const fetchOrders = async () => {
            try {
                const response = await fetch('/api/orders');
                const result = await response.json();
                if (result.success) {
                    setOrders(result.data);
                }
            } catch (error) {
                console.error('Error fetching orders:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, [isLoaded, isSignedIn]);

    if (!isLoaded || loading) {
        return <Loading />;
    }

    if (!isSignedIn) {
        return (
            <div className="min-h-[80vh] mx-6 flex items-center justify-center text-slate-400">
                <div className="text-center">
                    <h1 className="text-2xl sm:text-4xl font-semibold mb-2">Please sign in</h1>
                    <p className="text-slate-600">You need to be signed in to view your orders.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[70vh] mx-6">
            {orders.length > 0 ? (
                <div className="my-20 max-w-7xl mx-auto">
                    <PageTitle heading="My Orders" text={`Showing total ${orders.length} orders`} linkText={'Go to home'} />

                    <table className="w-full max-w-5xl text-slate-500 table-auto border-separate border-spacing-y-12 border-spacing-x-4">
                        <thead>
                            <tr className="max-sm:text-sm text-slate-600 max-md:hidden">
                                <th className="text-left">Product</th>
                                <th className="text-center">Total Price</th>
                                <th className="text-left">Address</th>
                                <th className="text-left">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map((order) => (
                                <OrderItem order={order} key={order.id} />
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="min-h-[80vh] mx-6 flex items-center justify-center text-slate-400">
                    <h1 className="text-2xl sm:text-4xl font-semibold">You have no orders</h1>
                </div>
            )}
        </div>
    )
}