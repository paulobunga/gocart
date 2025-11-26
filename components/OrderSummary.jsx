import { PlusIcon, SquarePenIcon, XIcon, Check } from 'lucide-react';
import React, { useState, useEffect } from 'react'
import AddressModal from './AddressModal';
import { useSelector, useDispatch } from 'react-redux';
import { setAddresses } from '@/lib/features/address/addressSlice';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { useCurrency } from '@/lib/contexts/CurrencyContext';
import { useUser } from '@clerk/nextjs';

const OrderSummary = ({ totalPrice, items: rawItems = [] }) => {
    // Normalize items IMMEDIATELY before any other code runs
    // This prevents any iteration errors from happening
    // Even if default parameter is set, we still need to validate in case a non-array is explicitly passed
    const items = (() => {
        try {
            if (Array.isArray(rawItems)) {
                return rawItems;
            }
            // If items is not an array, log and return empty array
            console.error('[OrderSummary] CRITICAL: items prop is not an array!', {
                type: typeof rawItems,
                value: rawItems,
                constructor: rawItems?.constructor?.name,
                rawItems,
                stack: new Error().stack
            });
            return [];
        } catch (error) {
            console.error('[OrderSummary] Error normalizing items:', error);
            return [];
        }
    })();
    
    // Log when component receives props
    console.log('[OrderSummary] Component rendered with props:', {
        totalPrice,
        rawItemsType: typeof rawItems,
        rawItemsValue: rawItems,
        itemsType: typeof items,
        itemsIsArray: Array.isArray(items),
        itemsValue: items,
        itemsLength: Array.isArray(items) ? items.length : 'N/A'
    });

    const { formatPrice, currency } = useCurrency();

    const router = useRouter();
    const dispatch = useDispatch();
    const { user, isLoaded } = useUser();

    const addressList = useSelector(state => state.address.list);

    // Use normalized items array
    const itemsArray = items;

    const [paymentMethod, setPaymentMethod] = useState('COD');
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [showAddressModal, setShowAddressModal] = useState(false);

    // Fetch addresses on mount
    useEffect(() => {
        if (isLoaded && user) {
            fetchAddresses();
        }
    }, [isLoaded, user]);

    // Auto-select first address if none is selected and addresses exist
    useEffect(() => {
        if (addressList && addressList.length > 0 && !selectedAddress) {
            setSelectedAddress(addressList[0]);
        }
    }, [addressList]);

    const fetchAddresses = async () => {
        try {
            const response = await fetch('/api/addresses');
            const data = await response.json();
            
            if (data.success) {
                dispatch(setAddresses(data.data));
            }
        } catch (error) {
            console.error('Error fetching addresses:', error);
        }
    };

    const handleAddressAdded = async (newAddress, isFirstAddress) => {
        // Refresh addresses from server to ensure consistency
        await fetchAddresses();
        // Auto-select the newly added address if it's the first one (no default exists)
        if (isFirstAddress) {
            setSelectedAddress(newAddress);
        }
    };
    const [couponCodeInput, setCouponCodeInput] = useState('');
    const [coupon, setCoupon] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [processingPayment, setProcessingPayment] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState('idle');
    const [paymentMessage, setPaymentMessage] = useState('');

    const handleCouponCode = async (event) => {
        event.preventDefault();
        
    }

    const handlePlaceOrder = async (e) => {
        e.preventDefault();

        // Validate address
        if (!selectedAddress) {
            toast.error('Please select a shipping address');
            return;
        }

        // Validate phone number for mobile money payments
        if ((paymentMethod === 'IOTEC_MTN' || paymentMethod === 'IOTEC_AIRTEL') && !phoneNumber) {
            toast.error('Please enter your phone number for mobile money payment');
            return;
        }

        // Calculate final total with coupon
        const finalTotal = coupon ? (totalPrice - (coupon.discount / 100 * totalPrice)) : totalPrice;

        // For COD, create order directly
        if (paymentMethod === 'COD') {
            try {
                const response = await fetch('/api/checkout/create-order', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        items: itemsArray.map(item => ({
                            productId: item.id,
                            variantId: item.variantId || null,
                            quantity: item.quantity,
                            price: item.price,
                            storeId: item.storeId
                        })),
                        total: finalTotal,
                        addressId: selectedAddress.id,
                        paymentMethod: 'COD',
                        coupon: coupon || null,
                        storeId: itemsArray[0]?.storeId
                    })
                });

                const data = await response.json();
                if (!data.success) {
                    toast.error(data.error || 'Failed to create order');
                    return;
                }

                toast.success('Order placed successfully!');
                router.push('/orders');
            } catch (error) {
                console.error('Error creating order:', error);
                toast.error('Failed to place order. Please try again.');
            }
            return;
        }

        // For mobile money payments (MTN/Airtel), process payment first
        if (paymentMethod === 'IOTEC_MTN' || paymentMethod === 'IOTEC_AIRTEL') {
            setProcessingPayment(true);
            setPaymentStatus('processing');
            setPaymentMessage('Initiating mobile money payment...');

            try {
                // Step 1: Initiate payment collection request
                const paymentResponse = await fetch('/api/checkout/process-payment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        paymentProvider: paymentMethod,
                        amount: finalTotal,
                        phoneNumber: phoneNumber,
                        currency: currency?.code === 'UGX' ? 'UGX' : 'ITX',
                    })
                });

                const paymentData = await paymentResponse.json();
                if (!paymentData.success) {
                    setPaymentStatus('error');
                    setPaymentMessage(paymentData.error || 'Payment processing failed');
                    toast.error(paymentData.error || 'Payment processing failed');
                    setProcessingPayment(false);
                    return;
                }

                // Step 2: If payment is pending, poll for status until confirmed
                if (paymentData.pending || paymentData.status === 'Pending' || paymentData.status === 'SentToVendor' || paymentData.status === 'AwaitingApproval') {
                    setPaymentMessage('Payment request sent. Please approve the prompt on your phone...');
                    
                    // Poll payment status until confirmed or failed
                    let paymentConfirmed = false;
                    let pollAttempts = 0;
                    const maxPollAttempts = 60; // 2 minutes max (60 * 2 seconds)
                    
                    while (!paymentConfirmed && pollAttempts < maxPollAttempts) {
                        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds between polls
                        
                        const statusResponse = await fetch('/api/checkout/check-payment-status', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                transactionId: paymentData.transactionId,
                                paymentProvider: paymentMethod
                            })
                        });

                        const statusData = await statusResponse.json();
                        
                        if (statusData.verified && statusData.status === 'Success') {
                            paymentConfirmed = true;
                            setPaymentMessage('Payment confirmed! Creating order...');
                            break;
                        } else if (statusData.status === 'Failed' || statusData.status === 'RolledBack') {
                            setPaymentStatus('error');
                            setPaymentMessage(statusData.error || 'Payment was declined or failed. Please try again.');
                            toast.error(statusData.error || 'Payment was declined or failed');
                            setProcessingPayment(false);
                            return;
                        }
                        
                        pollAttempts++;
                        
                        // Update message periodically to show we're still waiting
                        if (pollAttempts % 10 === 0) {
                            setPaymentMessage(`Waiting for payment confirmation... (${pollAttempts * 2}s)`);
                        }
                    }

                    if (!paymentConfirmed) {
                        setPaymentStatus('error');
                        setPaymentMessage('Payment confirmation timeout. Please check your phone and try again.');
                        toast.error('Payment confirmation timeout. Please check your phone and try again.');
                        setProcessingPayment(false);
                        return;
                    }
                } else if (paymentData.status !== 'Success') {
                    // Payment failed immediately
                    setPaymentStatus('error');
                    setPaymentMessage(paymentData.error || 'Payment failed');
                    toast.error(paymentData.error || 'Payment failed');
                    setProcessingPayment(false);
                    return;
                }

                // Step 3: Payment confirmed, create order
                setPaymentMessage('Payment confirmed! Creating order...');
                
                const orderResponse = await fetch('/api/checkout/create-order', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        items: itemsArray.map(item => ({
                            productId: item.id,
                            variantId: item.variantId || null,
                            quantity: item.quantity,
                            price: item.price,
                            storeId: item.storeId
                        })),
                        total: finalTotal,
                        addressId: selectedAddress.id,
                        paymentMethod: paymentMethod,
                        paymentTransactionId: paymentData.transactionId,
                        coupon: coupon || null,
                        storeId: itemsArray[0]?.storeId
                    })
                });

                const orderData = await orderResponse.json();
                if (!orderData.success) {
                    setPaymentStatus('error');
                    setPaymentMessage(orderData.error || 'Failed to create order');
                    toast.error(orderData.error || 'Failed to create order');
                    setProcessingPayment(false);
                    return;
                }

                setPaymentStatus('success');
                setPaymentMessage('Order placed successfully!');
                toast.success('Order placed successfully!');
                setProcessingPayment(false);
                
                // Redirect to orders page
                setTimeout(() => {
                    router.push('/orders');
                }, 1500);
            } catch (error) {
                console.error('Error processing payment:', error);
                setPaymentStatus('error');
                setPaymentMessage(error.message || 'Payment processing failed');
                toast.error(error.message || 'Payment processing failed');
                setProcessingPayment(false);
            }
            return;
        }

        // For PayPal payments, redirect to PayPal for payment
        if (paymentMethod === 'PAYPAL') {
            setProcessingPayment(true);
            setPaymentStatus('processing');
            setPaymentMessage('Initiating PayPal payment...');

            try {
                // Step 1: Initiate PayPal payment
                const paymentResponse = await fetch('/api/checkout/process-payment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        paymentProvider: 'PAYPAL',
                        amount: finalTotal,
                        currency: currency?.code || 'USD',
                        // Store order data for callback
                        orderData: {
                            items: itemsArray.map(item => ({
                                productId: item.id,
                                quantity: item.quantity,
                                price: item.price,
                                storeId: item.storeId
                            })),
                            total: finalTotal,
                            addressId: selectedAddress.id,
                            coupon: coupon || null,
                            storeId: itemsArray[0]?.storeId
                        }
                    })
                });

                const paymentData = await paymentResponse.json();
                if (!paymentData.success) {
                    setPaymentStatus('error');
                    setPaymentMessage(paymentData.error || 'Payment processing failed');
                    toast.error(paymentData.error || 'Payment processing failed');
                    setProcessingPayment(false);
                    return;
                }

                // Step 2: Redirect to PayPal
                if (paymentData.redirectUrl) {
                    setPaymentMessage('Redirecting to PayPal...');
                    // Store order data in sessionStorage for callback
                    sessionStorage.setItem('pendingOrder', JSON.stringify({
                        items: itemsArray.map(item => ({
                            productId: item.id,
                            quantity: item.quantity,
                            price: item.price,
                            storeId: item.storeId
                        })),
                        total: finalTotal,
                        addressId: selectedAddress.id,
                        coupon: coupon || null,
                        storeId: itemsArray[0]?.storeId
                    }));
                    
                    setTimeout(() => {
                        window.location.href = paymentData.redirectUrl;
                    }, 1000);
                } else {
                    setPaymentStatus('error');
                    setPaymentMessage('No redirect URL received from PayPal');
                    toast.error('No redirect URL received from PayPal');
                    setProcessingPayment(false);
                }
            } catch (error) {
                console.error('Error processing PayPal payment:', error);
                setPaymentStatus('error');
                setPaymentMessage(error.message || 'Payment processing failed');
                toast.error(error.message || 'Payment processing failed');
                setProcessingPayment(false);
            }
            return;
        }

        // For other payment methods, handle as needed
        toast.error('Payment method not yet implemented');
    }

    return (
        <div className='w-full max-w-lg lg:max-w-[340px] bg-slate-50/30 border border-slate-200 text-slate-500 text-sm rounded-xl p-7'>
            <h2 className='text-xl font-medium text-slate-600'>Payment Summary</h2>
            <p className='text-slate-400 text-xs my-4'>Payment Method</p>
            <div className='flex gap-2 items-center'>
                <input type="radio" id="COD" onChange={() => setPaymentMethod('COD')} checked={paymentMethod === 'COD'} className='accent-gray-500' />
                <label htmlFor="COD" className='cursor-pointer'>COD</label>
            </div>
            <div className='flex gap-2 items-center mt-1'>
                <input type="radio" id="PAYPAL" name='payment' onChange={() => setPaymentMethod('PAYPAL')} checked={paymentMethod === 'PAYPAL'} className='accent-gray-500' />
                <label htmlFor="PAYPAL" className='cursor-pointer'>PayPal</label>
            </div>
            <div className='flex gap-2 items-center mt-1'>
                <input type="radio" id="IOTEC_MTN" name='payment' onChange={() => setPaymentMethod('IOTEC_MTN')} checked={paymentMethod === 'IOTEC_MTN'} className='accent-gray-500' />
                <label htmlFor="IOTEC_MTN" className='cursor-pointer'>MTN Mobile Money</label>
            </div>
            <div className='flex gap-2 items-center mt-1'>
                <input type="radio" id="IOTEC_AIRTEL" name='payment' onChange={() => setPaymentMethod('IOTEC_AIRTEL')} checked={paymentMethod === 'IOTEC_AIRTEL'} className='accent-gray-500' />
                <label htmlFor="IOTEC_AIRTEL" className='cursor-pointer'>Airtel Mobile Money</label>
            </div>
            
            {/* Phone number input for mobile money payments */}
            {(paymentMethod === 'IOTEC_MTN' || paymentMethod === 'IOTEC_AIRTEL') && (
                <div className='mt-3'>
                    <label htmlFor="phoneNumber" className='text-slate-400 text-xs block mb-1'>
                        Phone Number (MTN/Airtel)
                    </label>
                    <input
                        type="tel"
                        id="phoneNumber"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="e.g., 256XXXXXXXXX or 0XXXXXXXXX"
                        className='border border-slate-400 p-2 w-full outline-none rounded text-sm'
                        disabled={processingPayment}
                    />
                    <p className='text-xs text-slate-400 mt-1'>
                        You'll receive a payment prompt on your phone
                    </p>
                </div>
            )}

            {/* Payment processing status */}
            {processingPayment && (
                <div className='mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg'>
                    <p className='text-sm text-blue-800 font-medium'>{paymentMessage}</p>
                    {paymentStatus === 'processing' && (
                        <div className='mt-2 flex items-center gap-2'>
                            <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600'></div>
                            <p className='text-xs text-blue-600'>Processing...</p>
                        </div>
                    )}
                </div>
            )}
            <div className='my-4 py-4 border-y border-slate-200 text-slate-400'>
                <p>Address</p>
                {
                    selectedAddress ? (
                        <div className='flex gap-2 items-center'>
                            <p>{selectedAddress.name}, {selectedAddress.city}, {selectedAddress.state}, {selectedAddress.zip}</p>
                            <SquarePenIcon onClick={() => setSelectedAddress(null)} className='cursor-pointer' size={18} />
                        </div>
                    ) : (
                        <div>
                            {
                                    Array.isArray(addressList) && addressList.length > 0 && (
                                    <select className='border border-slate-400 p-2 w-full my-3 outline-none rounded' onChange={(e) => setSelectedAddress(addressList[e.target.value])} >
                                        <option value="">Select Address</option>
                                        {
                                            addressList.map((address, index) => (
                                                <option key={index} value={index}>{address.name}, {address.city}, {address.state}, {address.zip}</option>
                                            ))
                                        }
                                    </select>
                                )
                            }
                            <button className='flex items-center gap-1 text-slate-600 mt-1' onClick={() => setShowAddressModal(true)} >Add Address <PlusIcon size={18} /></button>
                        </div>
                    )
                }
            </div>
            <div className='pb-4 border-b border-slate-200'>
                <div className='flex justify-between'>
                    <div className='flex flex-col gap-1 text-slate-400'>
                        <p>Subtotal:</p>
                        <p>Shipping:</p>
                        {coupon && <p>Coupon:</p>}
                    </div>
                    <div className='flex flex-col gap-1 font-medium text-right'>
                        <p>{formatPrice(totalPrice)}</p>
                        <p>Free</p>
                        {coupon && <p>-{formatPrice(coupon.discount / 100 * totalPrice)}</p>}
                    </div>
                </div>
                {
                    !coupon ? (
                        <form onSubmit={e => toast.promise(handleCouponCode(e), { loading: 'Checking Coupon...' })} className='flex justify-center gap-3 mt-3'>
                            <input onChange={(e) => setCouponCodeInput(e.target.value)} value={couponCodeInput} type="text" placeholder='Coupon Code' className='border border-slate-400 p-1.5 rounded w-full outline-none' />
                            <button className='bg-slate-600 text-white px-3 rounded hover:bg-slate-800 active:scale-95 transition-all'>Apply</button>
                        </form>
                    ) : (
                        <div className='w-full flex items-center justify-center gap-2 text-xs mt-2'>
                            <p>Code: <span className='font-semibold ml-1'>{coupon.code.toUpperCase()}</span></p>
                            <p>{coupon.description}</p>
                            <XIcon size={18} onClick={() => setCoupon('')} className='hover:text-red-700 transition cursor-pointer' />
                        </div>
                    )
                }
            </div>
            <div className='flex justify-between py-4'>
                <p>Total:</p>
                <p className='font-medium text-right'>{formatPrice(coupon ? (totalPrice - (coupon.discount / 100 * totalPrice)) : totalPrice)}</p>
            </div>
            <button 
                onClick={handlePlaceOrder} 
                disabled={processingPayment}
                className={`w-full bg-slate-700 text-white py-2.5 rounded hover:bg-slate-900 active:scale-95 transition-all ${
                    processingPayment ? 'opacity-50 cursor-not-allowed' : ''
                }`}
            >
                {processingPayment ? 'Processing Payment...' : 'Place Order'}
            </button>

            {showAddressModal && <AddressModal setShowAddressModal={setShowAddressModal} onAddressAdded={handleAddressAdded} />}

        </div>
    )
}

export default OrderSummary