'use client';

import { useWeb3 } from "../app/context/Web3Provider";

export default function Header() {
  const { account, connectWallet, disconnectWallet, isLoading } = useWeb3();

  return (
    <header 
      className="backdrop-blur-md sticky top-0 border-b z-50"
      style={{ 
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.03)'
      }}
    >
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        {/* Logo / Title */}
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ 
              backgroundColor: '#1E4D43',
              boxShadow: '0 4px 12px rgba(30, 77, 67, 0.2)'
            }}
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h1 
              className="text-xl font-bold font-sans"
              style={{ color: '#0F172A' }}
            >
              InvoiceSME
            </h1>
            <p className="text-xs font-medium" style={{ color: '#64748B' }}>Finance Platform</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <a 
            href="/dashboard" 
            className="hover:text-[#1E4D43] transition-all font-medium relative group"
            style={{ color: '#475569' }}
          >
            <span className="relative">
              Dashboard
              <span 
                className="absolute bottom-0 left-0 w-0 h-0.5 transition-all group-hover:w-full"
                style={{ backgroundColor: '#1E4D43' }}
              ></span>
            </span>
          </a>
          <a 
            href="/portfolio" 
            className="hover:text-[#1E4D43] transition-all font-medium relative group"
            style={{ color: '#475569' }}
          >
            <span className="relative">
              Portfolio
              <span 
                className="absolute bottom-0 left-0 w-0 h-0.5 transition-all group-hover:w-full"
                style={{ backgroundColor: '#1E4D43' }}
              ></span>
            </span>
          </a>
        </nav>

        {/* Wallet Connect Section */}
        <div>
          {isLoading ? (
            <button
              disabled
              className="border rounded-xl font-semibold py-2.5 px-6 font-sans text-sm cursor-not-allowed flex items-center gap-2"
              style={{ 
                color: '#94A3B8', 
                borderColor: '#E2E8F0', 
                backgroundColor: 'rgba(248, 250, 252, 0.8)',
                backdropFilter: 'blur(10px)'
              }}
            >
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-400"></div>
              Loading
            </button>
          ) : account ? (
            <div className="flex items-center space-x-4">
              <div 
                className="hidden sm:flex items-center gap-2.5 px-4 py-2.5 rounded-xl border"
                style={{ 
                  backgroundColor: 'rgba(248, 250, 252, 0.9)',
                  backdropFilter: 'blur(10px)',
                  borderColor: '#E2E8F0'
                }}
              >
                <div 
                  className="w-2 h-2 rounded-full"
                  style={{ 
                    backgroundColor: '#10B981',
                    boxShadow: '0 0 8px rgba(16, 185, 129, 0.4)',
                    animation: 'pulse 2s ease-in-out infinite'
                  }}
                ></div>
                <span className="text-sm font-semibold" style={{ color: '#1E293B' }}>
                  {account.slice(0, 6)}...{account.slice(-4)}
                </span>
              </div>
              <button
                onClick={disconnectWallet}
                className="border rounded-xl font-semibold py-2.5 px-6 transition-all font-sans text-sm hover:shadow-md"
                style={{ 
                  color: '#475569', 
                  borderColor: '#E2E8F0', 
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(10px)'
                }}
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={connectWallet}
              className="font-semibold py-2.5 px-6 rounded-xl transition-all font-sans text-sm hover:shadow-lg"
              style={{ 
                backgroundColor: '#1E4D43',
                color: 'white',
                boxShadow: '0 4px 15px rgba(30, 77, 67, 0.25)'
              }}
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.6;
          }
        }
      `}</style>
    </header>
  );
}