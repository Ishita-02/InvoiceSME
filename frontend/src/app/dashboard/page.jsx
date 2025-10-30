'use client';

import { useState, useEffect } from 'react';
import HumanVerification from '@/components/HumanVerification';
import BusinessVerification from '@/components/BusinessVerification';
import Marketplace from '@/components/Marketplace';
import { useWeb3 } from "../context/Web3Provider";

export default function DashboardPage() {
    const { account, connectWallet, isLoading } = useWeb3();
    const [isHumanVerified, setIsHumanVerified] = useState(false);
    const [isBusinessVerified, setIsBusinessVerified] = useState(false);

    useEffect(() => {
        const humanVerified = localStorage.getItem('isHumanVerified');
        const businessVerified = localStorage.getItem('isBusinessVerified');
        if (humanVerified === 'true') {
            setIsHumanVerified(true);
        }
        if (businessVerified === 'true') {
            setIsBusinessVerified(true);
        }
    }, []);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen font-sans text-gray-800 bg-gradient-to-br from-slate-900 via-slate-800 to-[#1E4D43]"
                 style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #1E4D43 100%)' }}>
                <div className="backdrop-blur-md bg-white/70 px-8 py-6 rounded-2xl shadow-2xl"
                     style={{ backgroundColor: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(10px)' }}>
                    <div className="flex items-center gap-3">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#1E4D43]"></div>
                        <span className="text-lg font-semibold text-gray-800">Loading</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-[#1E4D43] relative overflow-hidden"
             style={{ 
                 background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #1E4D43 100%)',
                 minHeight: '100vh'
             }}>
            
            {/* Floating background elements */}
            <div className="absolute top-20 right-20 w-96 h-96 rounded-full blur-3xl opacity-20"
                 style={{ 
                     animation: 'float 6s ease-in-out infinite',
                     background: 'radial-gradient(circle, rgba(30, 77, 67, 0.4) 0%, transparent 70%)',
                     filter: 'blur(80px)'
                 }}></div>
            <div className="absolute bottom-20 left-20 w-96 h-96 rounded-full blur-3xl opacity-20"
                 style={{ 
                     animation: 'float 8s ease-in-out infinite 1s',
                     background: 'radial-gradient(circle, rgba(100, 116, 139, 0.4) 0%, transparent 70%)',
                     filter: 'blur(80px)'
                 }}></div>
            <div className="absolute top-1/2 left-1/2 w-96 h-96 rounded-full blur-3xl opacity-10"
                 style={{ 
                     animation: 'float 10s ease-in-out infinite 2s',
                     background: 'radial-gradient(circle, rgba(148, 163, 184, 0.3) 0%, transparent 70%)',
                     filter: 'blur(80px)',
                     transform: 'translate(-50%, -50%)'
                 }}></div>
            
            <style jsx>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-30px); }
                }
            `}</style>

            <div className="container mx-auto p-6 mt-6 relative z-10">
                {!account ? (
                    <div className="text-center mt-24">
                        <div className="backdrop-blur-md bg-white/90 rounded-3xl p-12 max-w-2xl mx-auto shadow-2xl border border-white/20"
                             style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(10px)' }}>
                            <div className="mb-8">
                                <div className="w-16 h-16 bg-[#1E4D43] rounded-2xl flex items-center justify-center mx-auto mb-4"
                                     style={{ 
                                         backgroundColor: '#1E4D43',
                                         boxShadow: '0 8px 24px rgba(30, 77, 67, 0.3)'
                                     }}>
                                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <h1 className="text-4xl font-bold font-sans text-slate-900 mb-3"
                                    style={{ color: '#0F172A' }}>
                                    Invoice Financing Platform
                                </h1>
                                <p className="text-slate-600 text-lg" style={{ color: '#64748B' }}>
                                    Automated verification and instant liquidity
                                </p>
                            </div>
                            
                            {/* Feature highlights */}
                            <div className="grid grid-cols-3 gap-6 mb-8">
                                <div className="text-center p-4 rounded-xl bg-slate-50" style={{ backgroundColor: '#F8FAFC' }}>
                                    <div className="w-12 h-12 bg-[#1E4D43] rounded-lg flex items-center justify-center mx-auto mb-3"
                                         style={{ backgroundColor: '#1E4D43' }}>
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                    </div>
                                    <p className="text-sm font-semibold text-slate-700" style={{ color: '#334155' }}>Instant Verification</p>
                                </div>
                                <div className="text-center p-4 rounded-xl bg-slate-50" style={{ backgroundColor: '#F8FAFC' }}>
                                    <div className="w-12 h-12 bg-slate-700 rounded-lg flex items-center justify-center mx-auto mb-3"
                                         style={{ backgroundColor: '#334155' }}>
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                                        </svg>
                                    </div>
                                    <p className="text-sm font-semibold text-slate-700" style={{ color: '#334155' }}>Smart Contracts</p>
                                </div>
                                <div className="text-center p-4 rounded-xl bg-slate-50" style={{ backgroundColor: '#F8FAFC' }}>
                                    <div className="w-12 h-12 bg-slate-700 rounded-lg flex items-center justify-center mx-auto mb-3"
                                         style={{ backgroundColor: '#334155' }}>
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                    </div>
                                    <p className="text-sm font-semibold text-slate-700" style={{ color: '#334155' }}>Secure & Safe</p>
                                </div>
                            </div>
                            
                            <button
                                onClick={connectWallet}
                                className="bg-[#1E4D43] text-white px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-2xl transition-all transform hover:scale-105"
                                style={{ 
                                    backgroundColor: '#1E4D43',
                                    color: 'white',
                                    boxShadow: '0 10px 30px rgba(30, 77, 67, 0.3)'
                                }}
                            >
                                Connect Wallet
                            </button>
                        </div>
                    </div>
                ) : (
                    <div>
                        {!isHumanVerified ? (
                            <div className="mt-10">
                                <div className="backdrop-blur-md bg-white/90 rounded-3xl p-8 max-w-4xl mx-auto shadow-2xl border border-white/20"
                                     style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(10px)' }}>
                                    <HumanVerification onVerificationComplete={() => setIsHumanVerified(true)} />
                                </div>
                            </div>
                        // ) : !isBusinessVerified ? (
                        //     <div className="mt-10">
                        //         <div className="backdrop-blur-md bg-white/90 rounded-3xl p-8 max-w-4xl mx-auto shadow-2xl border border-white/20"
                        //              style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(10px)' }}>
                        //             <BusinessVerification onVerificationComplete={() => setIsBusinessVerified(true)} />
                        //         </div>
                        //     </div>
                        ) : (
                            <div className="mt-10">
                                {/* Welcome Header with Stats */}
                                <div className="backdrop-blur-md bg-white/80 rounded-3xl p-8 mb-8 shadow-xl border border-white/20"
                                     style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(10px)' }}>
                                    <div className="flex justify-between items-start mb-8">
                                        <div>
                                            <h2 className="text-3xl font-bold text-slate-900 mb-2" style={{ color: '#0F172A' }}>
                                                Marketplace
                                            </h2>
                                            <p className="text-slate-600" style={{ color: '#64748B' }}>
                                                Browse and invest in verified invoices
                                            </p>
                                        </div>
                                        <a 
                                            href="/create-invoice"
                                            className="bg-[#1E4D43] text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2"
                                            style={{ 
                                                backgroundColor: '#1E4D43',
                                                color: 'white'
                                            }}>
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                            </svg>
                                            Create Invoice
                                        </a>
                                    </div>
                                    
                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-4 gap-6">
                                        <div className="backdrop-blur-md bg-white/60 rounded-2xl p-6 hover:bg-white/80 transition-all transform hover:-translate-y-2 cursor-pointer border border-white/30"
                                             style={{ backgroundColor: 'rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(10px)' }}>
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-12 h-12 bg-[#1E4D43] rounded-xl flex items-center justify-center"
                                                     style={{ backgroundColor: '#1E4D43' }}>
                                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                </div>
                                                <span className="text-sm text-slate-600 font-medium" style={{ color: '#64748B' }}>Total Value</span>
                                            </div>
                                            <p className="text-3xl font-bold text-slate-900 mb-1" style={{ color: '#0F172A' }}>$847K</p>
                                            <p className="text-sm text-emerald-600 font-semibold" style={{ color: '#10B981' }}>Available now</p>
                                        </div>
                                        
                                        <div className="backdrop-blur-md bg-white/60 rounded-2xl p-6 hover:bg-white/80 transition-all transform hover:-translate-y-2 cursor-pointer border border-white/30"
                                             style={{ backgroundColor: 'rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(10px)' }}>
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-12 h-12 bg-slate-700 rounded-xl flex items-center justify-center"
                                                     style={{ backgroundColor: '#334155' }}>
                                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                                    </svg>
                                                </div>
                                                <span className="text-sm text-slate-600 font-medium" style={{ color: '#64748B' }}>Active Invoices</span>
                                            </div>
                                            <p className="text-3xl font-bold text-slate-900 mb-1" style={{ color: '#0F172A' }}>24</p>
                                            <p className="text-sm text-blue-600 font-semibold" style={{ color: '#3B82F6' }}>Live now</p>
                                        </div>
                                        
                                        <div className="backdrop-blur-md bg-white/60 rounded-2xl p-6 hover:bg-white/80 transition-all transform hover:-translate-y-2 cursor-pointer border border-white/30"
                                             style={{ backgroundColor: 'rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(10px)' }}>
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center"
                                                     style={{ backgroundColor: '#10B981' }}>
                                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                                    </svg>
                                                </div>
                                                <span className="text-sm text-slate-600 font-medium" style={{ color: '#64748B' }}>Avg Return</span>
                                            </div>
                                            <p className="text-3xl font-bold text-slate-900 mb-1" style={{ color: '#0F172A' }}>8.4%</p>
                                            <p className="text-sm text-slate-500 font-semibold" style={{ color: '#64748B' }}>Annual yield</p>
                                        </div>
                                        
                                        <div className="backdrop-blur-md bg-white/60 rounded-2xl p-6 hover:bg-white/80 transition-all transform hover:-translate-y-2 cursor-pointer border border-white/30"
                                             style={{ backgroundColor: 'rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(10px)' }}>
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-12 h-12 bg-slate-700 rounded-xl flex items-center justify-center"
                                                     style={{ backgroundColor: '#334155' }}>
                                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                </div>
                                                <span className="text-sm text-slate-600 font-medium" style={{ color: '#64748B' }}>Verified</span>
                                            </div>
                                            <p className="text-3xl font-bold text-slate-900 mb-1" style={{ color: '#0F172A' }}>94%</p>
                                            <p className="text-sm text-slate-600 font-semibold" style={{ color: '#64748B' }}>Auto-processed</p>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Marketplace Component */}
                                <Marketplace />
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}