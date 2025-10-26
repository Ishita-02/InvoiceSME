'use client';

import { useWeb3 } from "../app/context/Web3Provider";

export default function Header() {
  const { account, connectWallet, disconnectWallet, isLoading } = useWeb3();

  return (
    <header className="bg-white/80 backdrop-blur-md sticky top-0 border-b border-gray-200 z-50">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        {/* Logo / Title */}
        <h1 className="text-2xl font-bold text-[#1E4D43] font-sans">InvoiceSME</h1>

        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <a href="#" className="hover:text-[#E59A3B] transition-colors">Marketplace</a>
          <a href="#" className="hover:text-[#E59A3B] transition-colors">My Portfolio</a>
          <a href="#" className="hover:text-[#E59A3B] transition-colors">My Invoices</a>
        </nav>

        {/* Wallet Connect Section */}
        <div>
          {isLoading ? (
            <button
              disabled
              className="border border-gray-300 text-gray-400 font-bold py-2 px-5 rounded-lg font-sans text-sm cursor-not-allowed"
            >
              Loading...
            </button>
          ) : account ? (
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500 hidden sm:block">
                {account.slice(0, 6)}...{account.slice(-4)}
              </span>
              <button
                onClick={disconnectWallet}
                className="border border-gray-300 text-gray-700 font-bold py-2 px-5 rounded-lg hover:bg-gray-100 transition-all font-sans text-sm"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={connectWallet}
              className="bg-[#1E4D43] text-white font-bold py-2 px-5 rounded-lg hover:bg-opacity-90 transition-all font-sans text-sm"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
