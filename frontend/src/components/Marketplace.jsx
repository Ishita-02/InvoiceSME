'use client';

// Mock data for invoices. In a real app, this would be fetched from the smart contract.
const mockInvoices = [
    { id: 1, seller: '0xabc...def', faceValue: 50000, discountValue: 48000, dueDate: '2025-12-01', riskScore: 25, status: 'Listed' },
    { id: 2, seller: '0x123...456', faceValue: 120000, discountValue: 115000, dueDate: '2026-01-15', riskScore: 15, status: 'Listed' },
    { id: 3, seller: '0x789...ghi', faceValue: 75000, discountValue: 72000, dueDate: '2025-11-20', riskScore: 38, status: 'Listed' },
];

const InvoiceCard = ({ invoice }) => {
    const fundingProgress = (Math.random() * 80 + 10).toFixed(2); // Mock funding progress

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="font-bold text-lg font-sans text-[#1E4D43]">Invoice #{invoice.id}</h3>
                    <p className="text-xs text-gray-500 mt-1">Seller: {invoice.seller.slice(0, 10)}...</p>
                </div>
                <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">{invoice.status}</span>
            </div>

            <div className="mt-6 space-y-4">
                <div className="flex justify-between">
                    <span className="text-gray-600">Funding Goal</span>
                    <span className="font-bold font-sans">₹{invoice.discountValue.toLocaleString()}</span>
                </div>
                 <div className="flex justify-between">
                    <span className="text-gray-600">Repayment Amount</span>
                    <span className="font-bold font-sans">₹{invoice.faceValue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-600">Due Date</span>
                    <span className="font-sans">{new Date(invoice.dueDate).toLocaleDateString()}</span>
                </div>
            </div>

            <div className="mt-6">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-[#E59A3B] h-2.5 rounded-full" style={{ width: `${fundingProgress}%` }}></div>
                </div>
                <p className="text-xs text-center mt-2 text-gray-500">{fundingProgress}% Funded</p>
            </div>

            <button className="w-full mt-6 bg-[#1E4D43] text-white font-bold py-2 px-4 rounded-lg hover:bg-opacity-90 transition-all font-sans">
                Invest Now
            </button>
        </div>
    );
};


export default function Marketplace() {
    return (
        <div>
            <h2 className="text-3xl font-bold font-sans">Marketplace</h2>
            <p className="text-gray-600 mt-2">Invest in verified invoices and earn a stable yield.</p>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                {mockInvoices.map(invoice => (
                    <InvoiceCard key={invoice.id} invoice={invoice} />
                ))}
            </div>
        </div>
    );
}
