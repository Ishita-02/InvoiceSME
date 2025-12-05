"use client";
import { useState, useEffect } from "react";
import { useWeb3 } from '../context/Web3Provider';
import web3Service from '../components/services/Web3Service';
import StatusBadge from "@/components/StatusBadge";

const InvoiceCard = ({ invoice }) => {
    const fundingGoal = parseFloat(invoice.discountValue);
    const amountFunded = parseFloat(invoice.fundedAmount) || 0;

    const fundingProgress = fundingGoal > 0 ? ((amountFunded / fundingGoal) * 100).toFixed(2) : 0;
    const isFullyFunded = fundingProgress >= 100;

    const handleRepay = async () => {
        const confirmation = confirm(`You are about to repay Invoice #${invoice.id} with ${invoice.faceValue} PYUSD. This will transfer funds from your wallet to the contract for investors to claim. Continue?`);
        
        if (confirmation) {
            try {
               
                await web3Service.repayInvoice(invoice.id, invoice.faceValue);
                alert("Invoice successfully marked as repaid!");
            } catch (error) {
                console.error("Repayment failed:", error);
                alert(`Repayment failed: ${error.message}`);
            }
        }
    };

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <div>
                <div className="flex justify-between items-start gap-4">
                    <div className="flex-grow">
                        <h3 className="font-bold text-lg font-sans text-[#1E4D43]">Invoice #{invoice.id}</h3>
                        <p className="text-xs text-gray-500 mt-1 break-all">Seller: {invoice.seller}</p>
                    </div>
                    <StatusBadge status={invoice.status} />
                </div>

                <div className="mt-6 space-y-4">
                    <div className="flex justify-between">
                        <span className="text-gray-600">Funding Goal</span>
                        <span className="font-bold font-sans">{invoice.discountValue} PYUSD</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">Amount Funded</span>
                        <span className="font-bold font-sans">{invoice.fundedAmount} PYUSD</span>
                    </div>
                     <div className="flex justify-between">
                        <span className="text-gray-600">Repayment Amount</span>
                        <span className="font-bold font-sans">{invoice.faceValue} PYUSD</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">Due Date</span>
                        <span className="font-sans">{new Date(Number(invoice.dueDate) * 1000).toLocaleDateString()}</span>
                    </div>
                </div>

                <div className="mt-6">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-[#E59A3B] h-2.5 rounded-full" style={{ width: `${fundingProgress}%` }}></div>
                    </div>
                    <p className="text-xs text-center mt-2 text-gray-500">{fundingProgress}% Funded</p>
                </div>
            </div>
            {invoice.status === 'Repaid' ? (
                <button
                    onClick={async () => {
                        try {
                            await web3Service.claimRepayment(invoice.id);
                            alert('Repayment claimed successfully!');
                            window.location.reload(); 
                        } catch (error) {
                            console.error("Claim failed:", error);
                            alert(`Claim failed: ${error.message}`);
                        }
                    }}
                    className="w-full mt-6 bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-all font-sans"
                >
                    Claim Repayment
                </button>
            ) : isFullyFunded && invoice.status === 'Funded' ? (
                <button 
                    onClick={handleRepay}
                    className="w-full mt-6 bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-all font-sans"
                >
                    Repay Invoice
                </button>
            ) : (
                <button 
                    onClick={() =>  window.open(invoice.tokenURI, "_blank")}
                    className="w-full mt-6 bg-[#1E4D43] text-white font-bold py-2 px-4 rounded-lg hover:bg-opacity-90 transition-all font-sans"
                >
                    View Details
                </button>
            )}
        </div>
    );
};


const MyPortfolio = () => {
    const { account, isLoading } = useWeb3();
    const [activeTab, setActiveTab] = useState('myInvoices');
    const [myInvoices, setMyInvoices] = useState([]);
    const [investedInvoices, setInvestedInvoices] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInvoices = async () => {
            if (account) {
                setLoading(true);
                try {
                    if (activeTab === 'myInvoices') {
                        const userInvoices = await web3Service.getUsersInvoices(account);
                        setMyInvoices(userInvoices);
                    } else {
                        const userInvestedInvoices = await web3Service.getUserInvestedInvoices(account);
                        setInvestedInvoices(userInvestedInvoices);
                    }
                } catch (error) {
                    console.error(`Error fetching ${activeTab}:`, error);
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchInvoices();
    }, [account, activeTab]);

    const invoicesToShow = activeTab === 'myInvoices' ? myInvoices : investedInvoices;
    console.log("invoices", invoicesToShow)

    if (isLoading) {
        return <div>Loading Web3 data...</div>;
    }

    return (
        <div className="min-h-screen bg-white text-black">
            <div className="container mx-auto p-4">
                <h1 className="text-3xl font-bold text-[#1E4D43] mb-6">My Portfolio</h1>

                {/* Tab Navigation */}
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                        <button
                            onClick={() => setActiveTab('myInvoices')}
                            className={`${
                                activeTab === 'myInvoices'
                                    ? 'border-[#E59A3B] text-[#1E4D43]'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                        >
                            My Invoices
                        </button>
                        <button
                            onClick={() => setActiveTab('investedInvoices')}
                            className={`${
                                activeTab === 'investedInvoices'
                                    ? 'border-[#E59A3B] text-[#1E4D43]'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                        >
                            My Investments
                        </button>
                    </nav>
                </div>

                <div className="mt-8">
                    {loading ? (
                        <p>Loading invoices...</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {invoicesToShow.length > 0 ? (
                                invoicesToShow.map((invoice) => (
                                    <InvoiceCard key={invoice.id} invoice={invoice} />
                                ))
                            ) : (
                                <p className="col-span-full text-center text-gray-500">
                                    No invoices to display in this category.
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MyPortfolio;