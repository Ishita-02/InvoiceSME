"use client";

import { useState, useEffect } from "react";
import { useWeb3 } from '../app/context/Web3Provider'
import web3Service from '../app/components/services/Web3Service.jsx';
import InvestmentModal from "@/components/InvestmentModal"; // Import the new modal

const InvoiceCard = ({ invoice, onInvestClick }) => {
    const fundingGoal = parseFloat(invoice.discountValue);
    const amountFunded = parseFloat(invoice.fundedAmount) || 0;

    const fundingProgress = fundingGoal > 0 ? ((amountFunded / fundingGoal) * 100).toFixed(2) : 0;

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start gap-4">
                <div className="flex-grow">
                    <h3 className="font-bold text-lg font-sans text-[#1E4D43]">Invoice #{invoice.id}</h3>
                    {/* Full seller address with word break */}
                    <p className="text-xs text-gray-500 mt-1 break-all">Seller: {invoice.seller}</p>
                </div>
                {/* Status badge that won't shrink */}
                <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full flex-shrink-0">{invoice.status}</span>
            </div>

            <div className="mt-6s space-y-4">
                <div className="flex justify-between">
                    <span className="text-gray-600">Funding Goal</span>
                    <span className="font-bold font-sans">{invoice.discountValue} PYUSD</span>
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

            <button 
                onClick={() => onInvestClick(invoice)} // Call the handler on click
                className="w-full mt-6 bg-[#1E4D43] text-white font-bold py-2 px-4 rounded-lg hover:bg-opacity-90 transition-all font-sans"
            >
                Invest Now
            </button>
        </div>
    );
};


const Marketplace = () => {
  const { account, isLoading } = useWeb3();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  useEffect(() => {
    const fetchInvoices = async () => {
      if (account) {
        try {
          const allInvoices = await web3Service.getAllInvoices(); 
          console.log("invoices", allInvoices);
          setInvoices(allInvoices);
        } catch (error) {
          console.error("Error fetching invoices:", error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, [account]);

  const handleInvestClick = (invoice) => {
    setSelectedInvoice(invoice);
  };

  const handleCloseModal = () => {
    setSelectedInvoice(null);
  };

  if (isLoading || loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Marketplace</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {invoices.map((invoice) => (
          <InvoiceCard key={invoice.id} invoice={invoice} onInvestClick={handleInvestClick}/>
        ))}
      </div>
      {selectedInvoice && (
        <InvestmentModal 
          invoice={selectedInvoice} 
          onClose={handleCloseModal} 
        />
      )}
    </div>
  );
};

export default Marketplace;