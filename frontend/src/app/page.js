"use client";

import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();

  const handleLaunch = () => {
    router.push("/dashboard");
  };

  return (
    <main className="flex min-h-screen flex-col items-center bg-gradient-to-br from-slate-900 via-slate-800 to-[#1E4D43] text-white px-6 relative overflow-hidden"
          style={{ 
              background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #1E4D43 100%)',
              minHeight: '100vh'
          }}>
      
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

      <section className="relative z-8 container mx-auto px-6 py-32 text-center">
        <div className="w-20 h-20 bg-[#1E4D43] rounded-2xl flex items-center justify-center mx-auto mb-8"
             style={{ 
                 backgroundColor: '#1E4D43',
                 boxShadow: '0 8px 24px rgba(30, 77, 67, 0.4)'
             }}>
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h1 className="text-5xl font-bold mb-4" style={{ color: '#FFFFFF' }}>
          InvoiceSME
        </h1>
        <p className="text-xl text-slate-200 mb-8" style={{ color: '#E2E8F0' }}>
          Automated invoice financing powered by blockchain
        </p>
        
        <button
          onClick={handleLaunch}
          className="px-8 py-4 bg-[#1E4D43] text-white font-semibold rounded-xl shadow-lg transition-all transform hover:scale-105 hover:shadow-2xl"
          style={{ 
              backgroundColor: '#1E4D43',
              color: 'white',
              boxShadow: '0 10px 30px rgba(30, 77, 67, 0.4)'
          }}
        >
          Launch App
        </button>
      </section>

      <section className="mt-12 max-w-5xl text-center relative z-10">
        <div className="backdrop-blur-md bg-white/10 rounded-3xl p-8 border border-white/20 shadow-2xl"
             style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)' }}>
          <h2 className="text-3xl font-bold mb-8" style={{ color: '#FFFFFF' }}>
            Why Choose InvoiceSME
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="backdrop-blur-md bg-white/80 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-2 border border-white/30"
                 style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(10px)' }}>
              <div className="w-14 h-14 bg-[#1E4D43] rounded-xl flex items-center justify-center mx-auto mb-4"
                   style={{ backgroundColor: '#1E4D43' }}>
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-2" style={{ color: '#0F172A' }}>
                Instant Liquidity
              </h3>
              <p className="text-sm text-slate-600" style={{ color: '#475569' }}>
                Get immediate cash flow by tokenizing and selling your invoices on the blockchain
              </p>
            </div>
            
            <div className="backdrop-blur-md bg-white/80 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-2 border border-white/30"
                 style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(10px)' }}>
              <div className="w-14 h-14 bg-slate-700 rounded-xl flex items-center justify-center mx-auto mb-4"
                   style={{ backgroundColor: '#334155' }}>
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-2" style={{ color: '#0F172A' }}>
                Smart Verification
              </h3>
              <p className="text-sm text-slate-600" style={{ color: '#475569' }}>
                AI-powered risk assessment ensures secure and reliable transactions
              </p>
            </div>
            
            <div className="backdrop-blur-md bg-white/80 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-2 border border-white/30"
                 style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(10px)' }}>
              <div className="w-14 h-14 bg-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-4"
                   style={{ backgroundColor: '#10B981' }}>
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-2" style={{ color: '#0F172A' }}>
                High Returns
              </h3>
              <p className="text-sm text-slate-600" style={{ color: '#475569' }}>
                Investors earn competitive returns while supporting small businesses
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-12 max-w-4xl relative z-10">
        <div className="backdrop-blur-md bg-white/10 rounded-3xl p-8 border border-white/20 shadow-2xl"
             style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)' }}>
          <div className="grid grid-cols-3 gap-8">
            <div className="text-center">
              <p className="text-4xl font-bold mb-2" style={{ color: '#FFFFFF' }}>$2M+</p>
              <p className="text-sm text-slate-300" style={{ color: '#CBD5E1' }}>Total Funded</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold mb-2" style={{ color: '#FFFFFF' }}>500+</p>
              <p className="text-sm text-slate-300" style={{ color: '#CBD5E1' }}>Invoices Processed</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold mb-2" style={{ color: '#FFFFFF' }}>8.4%</p>
              <p className="text-sm text-slate-300" style={{ color: '#CBD5E1' }}>Avg Annual Return</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-12 max-w-5xl relative z-10">
        <div className="backdrop-blur-md bg-white/10 rounded-3xl p-8 border border-white/20 shadow-2xl"
             style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)' }}>
          <h2 className="text-3xl font-bold mb-8 text-center" style={{ color: '#FFFFFF' }}>
            How It Works
          </h2>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="backdrop-blur-md bg-white/20 p-6 rounded-2xl border border-white/20"
                 style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', backdropFilter: 'blur(10px)' }}>
              <div className="flex items-start gap-4">
                <span className="flex-shrink-0 w-10 h-10 bg-[#1E4D43] rounded-xl flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: '#1E4D43' }}>1</span>
                <div>
                  <h4 className="font-bold text-white mb-2" style={{ color: '#FFFFFF' }}>For Sellers</h4>
                  <p className="text-sm text-slate-200" style={{ color: '#E2E8F0' }}>
                    Upload your invoice, get instant verification, and receive funding within hours
                  </p>
                </div>
              </div>
            </div>
            
            <div className="backdrop-blur-md bg-white/20 p-6 rounded-2xl border border-white/20"
                 style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', backdropFilter: 'blur(10px)' }}>
              <div className="flex items-start gap-4">
                <span className="flex-shrink-0 w-10 h-10 bg-[#1E4D43] rounded-xl flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: '#1E4D43' }}>2</span>
                <div>
                  <h4 className="font-bold text-white mb-2" style={{ color: '#FFFFFF' }}>For Investors</h4>
                  <p className="text-sm text-slate-200" style={{ color: '#E2E8F0' }}>
                    Browse verified invoices, invest in opportunities, and earn attractive returns
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="mt-16 mb-16 text-sm text-slate-400 relative z-10" style={{ color: '#94A3B8' }}>
        © {new Date().getFullYear()} InvoiceSME. All rights reserved.
      </footer>
    </main>
  );
}

