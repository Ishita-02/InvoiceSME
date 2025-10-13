'use client';

// Mock hook - replace with actual usePrivy()
const useMockAuth = () => ({
    ready: true,
    authenticated: true, // Set to true to see the logout button
    user: { wallet: '0x123...abc' },
    login: () => console.log('login'),
    logout: () => console.log('logout'),
});

export default function Header() {
    // Replace with actual Privy hook: const { ready, authenticated, user, login, logout } = usePrivy();
    const { ready, authenticated, user, login, logout } = useMockAuth();

    return (
        <header className="bg-white/80 backdrop-blur-md sticky top-0 border-b border-gray-200 z-50">
            <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                <h1 className="text-2xl font-bold text-[#1E4D43] font-sans">InvoiceSME</h1>
                <nav className="hidden md:flex items-center space-x-8">
                    <a href="#" className="hover:text-[#E59A3B] transition-colors">Marketplace</a>
                    <a href="#" className="hover:text-[#E59A3B] transition-colors">My Portfolio</a>
                    <a href="#" className="hover:text-[#E59A3B] transition-colors">My Invoices</a>
                </nav>
                <div>
                    {ready && (
                        authenticated ? (
                             <div className="flex items-center space-x-4">
                                <span className="text-sm text-gray-500 hidden sm:block">{user.wallet}</span>
                                <button
                                    onClick={logout}
                                    className="border border-gray-300 text-gray-700 font-bold py-2 px-5 rounded-lg hover:bg-gray-100 transition-all font-sans text-sm"
                                >
                                    Logout
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={login}
                                className="bg-[#1E4D43] text-white font-bold py-2 px-5 rounded-lg hover:bg-opacity-90 transition-all font-sans"
                            >
                                Connect Wallet
                            </button>
                        )
                    )}
                </div>
            </div>
        </header>
    );
}
