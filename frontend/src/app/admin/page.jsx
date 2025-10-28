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

    // Effect to check if the connected user is the contract owner
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

    // Effect to fetch invoices needing manual review
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
    }, [isOwner]); // Refetch when owner status is confirmed

    const handleApprove = async (tokenId) => {
        const confirmation = confirm(`Are you sure you want to approve and list Invoice #${tokenId}?`);
        if (confirmation) {
            try {
                await web3Service.approveForListing(tokenId);
                alert(`Invoice #${tokenId} has been successfully listed!`);
                // Refresh the list by filtering out the approved invoice
                setInvoices(prevInvoices => prevInvoices.filter(inv => inv.id !== tokenId));
            } catch (err) {
                alert(`Failed to approve invoice: ${err.message}`);
            }
        }
    };

    if (isWeb3Loading) {
        return <div className="text-center p-10">Connecting to wallet...</div>;
    }

    if (!isOwner) {
        return (
            <div className="text-center p-10">
                <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
                <p className="mt-2">You are not authorized to view this page. Please connect with the admin wallet.</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">Admin Review Panel</h1>
            <p className="text-gray-600 mb-8">The following invoices have high risk scores and require manual approval before being listed on the marketplace.</p>

            {isLoading ? (
                <p>Loading invoices...</p>
            ) : error ? (
                <p className="text-red-500">{error}</p>
            ) : invoices.length === 0 ? (
                <p className="text-center text-gray-500 p-8 bg-gray-50 rounded-lg">No invoices are currently awaiting manual review.</p>
            ) : (
                <div className="bg-white shadow-md rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seller</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Score</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {invoices.map(invoice => (
                                <tr key={invoice.id}>
                                    <td className="px-6 py-4 whitespace-nowrap font-mono">{invoice.id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{invoice.title}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono" title={invoice.seller}>{`${invoice.seller.substring(0, 10)}...`}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                            {invoice.riskScore}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <button
                                            onClick={() => handleApprove(invoice.id)}
                                            className="px-4 py-2 font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
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
    );
};

export default AdminPage;