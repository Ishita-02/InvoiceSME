'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import HumanVerification from '@/components/HumanVerification'; // ADDED
import BusinessVerification from '@/components/BusinessVerification'; // ADDED
import Marketplace from '@/components/Marketplace';
import CreateInvoiceForm from '@/components/CreateInvoiceForm';

// Mock hook to simulate Privy authentication state
const useMockAuth = () => {
    const [user, setUser] = useState({ wallet: null, verified: false });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setTimeout(() => {
            const mockUser = { wallet: "0x123...456", verified: false };
            if (mockUser) {
                setUser(mockUser);
            }
            setLoading(false);
        }, 1000);
    }, []);
    
    const login = () => { setLoading(true); setTimeout(() => { setUser({ wallet: "0x123...456", verified: false }); setLoading(false); }, 500); };
    const logout = () => setUser({ wallet: null, verified: false });

    return { ready: !loading, authenticated: !!user.wallet, user, login, logout };
};

// Simple Tabs component
const Tabs = ({ activeTab, setActiveTab }) => (
    <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
                onClick={() => setActiveTab('marketplace')}
                className={`${
                    activeTab === 'marketplace'
                        ? 'border-[#1E4D43] text-[#1E4D43]'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-bold font-sans text-sm`}
            >
                Marketplace
            </button>
            <button
                onClick={() => setActiveTab('create')}
                className={`${
                    activeTab === 'create'
                        ? 'border-[#1E4D43] text-[#1E4D43]'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-bold font-sans text-sm`}
            >
                Create Invoice
            </button>
        </nav>
    </div>
);


export default function DashboardPage() {
    const { ready, authenticated, user } = useMockAuth();
    // ADDED: State for multi-step verification
    const [isHumanVerified, setIsHumanVerified] = useState(false);
    const [isBusinessVerified, setIsBusinessVerified] = useState(false);
    const [activeTab, setActiveTab] = useState('marketplace');

    if (!ready) {
        return <div className="flex items-center justify-center h-screen font-sans">Loading App...</div>;
    }

    return (
        <div className="min-h-screen bg-[#F9F9F7]">
            <Header />
            <main className="container mx-auto p-6">
                {!authenticated ? (
                    <div className="text-center mt-20">
                        <h1 className="text-3xl font-bold font-sans">Welcome to the Marketplace</h1>
                        <p className="text-gray-600 mt-2">Please connect your wallet to get started.</p>
                    </div>
                ) : (
                    <div>
                        {!isHumanVerified ? (
                             <HumanVerification onVerificationComplete={() => setIsHumanVerified(true)} />
                        ) 
                        // : !isBusinessVerified ? (
                        //     <BusinessVerification onVerificationComplete={() => setIsBusinessVerified(true)} />
                        // ) 
                        : (
                            <div>
                                <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />
                                {activeTab === 'marketplace' && <Marketplace />}
                                {activeTab === 'create' && <CreateInvoiceForm />}
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}

