"use client";
import { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Provider';
import web3Service from '../components/services/Web3Service';

const AdminPage = () => {
    const { account, isLoading: isWeb3Loading } = useWeb3();
    const [invoices, setInvoices] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [isOwner, setIsOwner] = useState(false);

    useEffect(() => {
        const checkOwner = async () => {
            if (account && web3Service.isInitialized()) {
                try {
                    const owner = await web3Service.getOwner();
                    setIsOwner(account.toLowerCase() === owner.toLowerCase());
                } catch (err) {
                    console.error("Could not verify owner:", err);
                    setIsOwner(false);
                }
            }
        };
        checkOwner();
    }, [account]);

    useEffect(() => {
        const fetchInvoices = async () => {
            if (isOwner) {
                setIsLoading(true);
                try {
                    const reviewInvoices = await web3Service.getInvoicesForManualReview();
                    setInvoices(reviewInvoices);
                } catch (err) {
                    setError('Failed to fetch invoices for review.');
                    console.error(err);
                } finally {
                    setIsLoading(false);
                }
            }
        };
        fetchInvoices();
    }, [isOwner]);

    const handleApprove = async (tokenId) => {
        const confirmation = confirm(`Are you sure you want to approve and list Invoice #${tokenId}?`);
        if (confirmation) {
            try {
                await web3Service.approveForListing(tokenId);
                alert(`Invoice #${tokenId} has been successfully listed!`);
                setInvoices(prevInvoices => prevInvoices.filter(inv => inv.id !== tokenId));
            } catch (err) {
                alert(`Failed to approve invoice: ${err.message}`);
            }
        }
    };

    if (isWeb3Loading) {
        return (
            <div className="min-h-screen bg-white text-black flex items-center justify-center">
                <p className="text-lg text-gray-600">Connecting to wallet...</p>
            </div>
        );
    }

    if (!isOwner) {
        return (
            <div className="min-h-screen bg-white text-black flex items-center justify-center p-10">
                <div className="text-center p-10 bg-amber-50 border border-amber-200 rounded-lg">
                    <h1 className="text-2xl font-bold font-sans text-amber-800">Access Denied</h1>
                    <p className="mt-2 text-gray-700">You are not authorized to view this page. Please connect with the admin wallet.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white text-black">
            <div className="container mx-auto p-6">
                <h1 className="text-3xl font-bold font-sans text-[#1E4D43] mb-4">Admin Review Panel</h1>
                <p className="text-gray-600 mb-8 font-sans">The following invoices have high risk scores and require manual approval before being listed.</p>

                {isLoading ? (
                    <p className="font-sans text-gray-600">Loading invoices...</p>
                ) : error ? (
                    <p className="font-sans text-red-500">{error}</p>
                ) : invoices.length === 0 ? (
                    <p className="text-center font-sans text-gray-500 p-8 bg-gray-50 rounded-lg">No invoices are currently awaiting manual review.</p>
                ) : (
                    <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold font-sans text-gray-600 uppercase tracking-wider">Invoice ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold font-sans text-gray-600 uppercase tracking-wider">Title</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold font-sans text-gray-600 uppercase tracking-wider">Seller</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold font-sans text-gray-600 uppercase tracking-wider">Risk Score</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold font-sans text-gray-600 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {invoices.map(invoice => (
                                    <tr key={invoice.id}>
                                        <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-gray-700">{invoice.id}</td>
                                        <td className="px-6 py-4 whitespace-nowrap font-sans text-sm text-gray-900">{invoice.title}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono" title={invoice.seller}>{`${invoice.seller.substring(0, 10)}...`}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-amber-100 text-amber-800">
                                                {invoice.riskScore}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <button
                                                onClick={() => handleApprove(invoice.id)}
                                                className="px-4 py-2 font-bold font-sans text-sm text-white bg-[#1E4D43] rounded-md hover:bg-opacity-90 transition-all focus:outline-none focus:ring-2 focus:ring-[#1E4D43] focus:ring-offset-2"
                                            >
                                                Approve
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminPage;