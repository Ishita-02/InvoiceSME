'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import HumanVerification from '@/components/HumanVerification'; // ADDED
import BusinessVerification from '@/components/BusinessVerification'; // ADDED
import Marketplace from '@/components/Marketplace';
import CreateInvoiceForm from '@/components/CreateInvoiceForm';
import { useWeb3 } from "../context/Web3Provider";

// Simple Tabs component
const Tabs = ({ activeTab, setActiveTab }) => (
    <div className="border-b border-gray-300 mb-8 bg-white sticky top-0 z-20">
        <nav className="-mb-px flex space-x-8 justify-center" aria-label="Tabs">
            <button
                onClick={() => setActiveTab('marketplace')}
                className={`${
                    activeTab === 'marketplace'
                        ? 'border-[#1E4D43] text-[#1E4D43]'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-3 border-b-2 font-bold font-sans text-sm transition-all`}
            >
                Marketplace
            </button>
            <button
                onClick={() => setActiveTab('create')}
                className={`${
                    activeTab === 'create'
                        ? 'border-[#1E4D43] text-[#1E4D43]'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-3 border-b-2 font-bold font-sans text-sm transition-all`}
            >
                Create Invoice
            </button>
        </nav>
    </div>
);


export default function DashboardPage() {
    const { account, connectWallet, isLoading } = useWeb3();
    const [isHumanVerified, setIsHumanVerified] = useState(false);
    const [isBusinessVerified, setIsBusinessVerified] = useState(false);
    const [activeTab, setActiveTab] = useState('marketplace');

    if (isLoading) {
        return (
        <div className="flex items-center justify-center h-screen font-sans text-gray-800 bg-[#F9F9F7]">
            Loading App...
        </div>
        );
    }

    return (
    <div className="min-h-screen bg-[#F9F9F7] text-gray-800 overflow-x-hidden">
      <Header />
      <main className="container mx-auto p-6 mt-6">
        {!account ? (
          <div className="text-center mt-24">
            <h1 className="text-3xl font-bold font-sans text-[#1E4D43]">
              Welcome to the Marketplace
            </h1>
            <p className="text-gray-600 mt-2">
              Please connect your wallet to get started.
            </p>
            <button
              onClick={connectWallet}
              className="mt-6 bg-[#1E4D43] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#163C34] transition-all"
            >
              Connect Wallet
            </button>
          </div>
        ) : (
          <div>
            {!isHumanVerified ? (
              <div className="mt-10">
                <HumanVerification onVerificationComplete={() => setIsHumanVerified(true)} />
              </div>
            )
            // : !isBusinessVerified ? (
            //     <BusinessVerification onVerificationComplete={() => setIsBusinessVerified(true)} />
            // )
            : (
              <div className="mt-10">
                <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />
                <div className="mt-8">
                  {activeTab === 'marketplace' && <Marketplace />}
                  {activeTab === 'create' && <CreateInvoiceForm />}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
