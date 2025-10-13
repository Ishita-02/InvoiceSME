'use client';

import { useState } from 'react';

export default function BusinessVerification({ onVerificationComplete }) {
    const [gstNumber, setGstNumber] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccessMessage('');

        try {
            // Call our new backend API route
            const response = await fetch('/api/verify-gst', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ gstNo: gstNumber }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // The legal name is nested in the `taxpayerInfo` object
                const businessName = data.taxpayerInfo?.lgnm;

                if (businessName) {
                    setSuccessMessage(`Successfully verified: ${businessName}`);
                    // Call the parent component's function after a short delay
                    setTimeout(() => {
                        onVerificationComplete();
                    }, 2000);
                } else {
                    // Handle cases where the name might be missing in the response
                    setError('Verification successful, but business name not found.');
                }
            } else {
                setError(data.error || 'Verification failed. Please check the GST number and try again.');
            }

        } catch (err) {
            console.error(err);
            setError('A network error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-xl mx-auto mt-10 p-8 border border-gray-200 rounded-lg bg-white shadow-sm">
            <h2 className="text-2xl font-bold font-sans text-center">Step 2: Verify Your Business</h2>
            <p className="text-center text-gray-500 mt-2">
                Please enter your company's GST Identification Number to continue.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                <div>
                    <label htmlFor="gstNumber" className="block text-sm font-medium text-gray-700 font-sans">
                        GST Number
                    </label>
                    <input
                        type="text"
                        id="gstNumber"
                        value={gstNumber}
                        onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                        placeholder="e.g., 22AAAAA0000A1Z5"
                        required
                        minLength="15"
                        maxLength="15"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#1E4D43] focus:border-[#1E4D43]"
                    />
                </div>

                {error && <p className="text-sm text-red-600 text-center">{error}</p>}
                {successMessage && <p className="text-sm text-green-600 text-center">{successMessage}</p>}

                <div>
                    <button
                        type="submit"
                        disabled={isLoading || successMessage}
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-[#1E4D43] hover:bg-opacity-90 disabled:bg-gray-400 font-sans"
                    >
                        {isLoading ? 'Verifying...' : (successMessage ? 'Verified!' : 'Verify Business')}
                    </button>
                </div>
            </form>
        </div>
    );
}

