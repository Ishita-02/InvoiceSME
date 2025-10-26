'use client';

import { IDKitWidget, VerificationLevel, ISuccessResult } from '@worldcoin/idkit';
import { useState } from 'react';

export default function HumanVerification({ onVerificationComplete }) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleProof = async (proof) => {
        setIsLoading(true);
        setError('');
        
        console.log("=== World ID Proof Received ===");
        console.log("Proof:", proof);
        console.log("Merkle Root:", proof.merkle_root);
        console.log("Nullifier Hash:", proof.nullifier_hash);
        console.log("Proof:", proof.proof);
        console.log("Verification Level:", proof.verification_level);
        console.log("==============================");

        try {
            const response = await fetch('/api/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(proof)
            });

            const data = await response.json();
            console.log("data", data)
            
            if (response.ok && data.success) {
                console.log("✅ Backend verification successful");
                onVerificationComplete();
            } else if(data.detail == "This person has already verified for this action.") {
                console.log("✅ Backend verification successful");
                onVerificationComplete();
            }
            else {
                console.error("❌ Backend verification failed:", data);
                setError(data.detail || 'Verification failed. Please try again.');
            }
        } catch (error) {
            console.error("❌ Network error during verification:", error);
            setError('A network error occurred. Please check your connection.');
        } finally {
            setIsLoading(false);
        }
    };

    const onError = (error) => {
        console.error("❌ IDKit error:", error);
        setError(`Verification error: ${error.message}`);
        setIsLoading(false);
    };

    return (
        <div className="max-w-xl mx-auto mt-10 p-8 border border-gray-200 rounded-lg bg-white shadow-sm">
            <h2 className="text-2xl font-bold font-sans text-center">Step 1: Prove Unique Humanness</h2>
            <p className="text-center text-gray-500 mt-2">
                To prevent fraud and ensure platform integrity, we require the highest level of verification through World ID (Orb-verified).
            </p>
            
            <div className="mt-8 flex justify-center">
                <IDKitWidget
                    app_id={process.env.NEXT_PUBLIC_WLD_APP_ID}
                    action="verifysmeowner"
                    signal="verifysmeowner"
                    onSuccess={handleProof}
                    handleVerify={handleProof}
                    onError={onError}
                    verification_level={VerificationLevel.Orb}
                >
                    {({ open }) => (
                        <button
                            onClick={open}
                            disabled={isLoading}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-[#1E4D43] hover:bg-opacity-90 disabled:bg-gray-400 font-sans transition-opacity"
                        >
                            {isLoading ? 'Verifying...' : 'Verify with World ID Orb'}
                        </button>
                    )}
                </IDKitWidget>
            </div>
            
            {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-600 text-center">{error}</p>
                </div>
            )}
            
            <p className="text-xs text-center text-gray-400 mt-4">
                This one-time check guarantees every business is operated by a unique human.
            </p>
            
            {/* Debug info in development */}
            {/* {process.env.NODE_ENV === 'development' && (
                <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded text-xs">
                    <p className="font-semibold mb-1">Debug Info:</p>
                    <p>App ID: {process.env.NEXT_PUBLIC_WLD_APP_ID?.slice(0, 20)}...</p>
                    <p>Action: verifySmeOwner</p>
                    <p>Level: Orb</p>
                </div>
            )} */}
        </div>
    );
}