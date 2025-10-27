'use client';

import { useState, useEffect } from 'react';
import web3Service from '../app/components/services/Web3Service.jsx';


const industryOptions = [
  "Technology",
  "Healthcare",
  "Finance",
  "Insurance",
  "Manufacturing",
  "Retail",
  "E-commerce",
  "Government",
  "Education",
  "Telecommunications",
  "Real Estate",
  "Construction",
  "Hospitality",
  "Transportation",
  "Energy",
  "Agriculture",
  "Entertainment",
  "Fashion"
];

export default function CreateInvoiceForm() {
    const [faceValue, setFaceValue] = useState('');
    const [discountValue, setDiscountValue] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [invoiceFile, setInvoiceFile] = useState(null); 
    const [industry, setIndustry] = useState(''); 
    const [country, setCountry] = useState('India'); 
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [countries, setCountries] = useState([]);
    const [walletAddress, setWalletAddress] = useState('');
    const [currentStep, setCurrentStep] = useState('');
    const [success, setSuccess] = useState(false);
    const [title, setTitle] = useState('');

    useEffect(() => {
        const fetchCountries = async () => {
        try {
            const res = await fetch("https://api.first.org/data/v1/countries");
            const json = await res.json();

            const countryList = Object.entries(json.data).map(([code, info]) => ({
            code,
            name: info.country,
            region: info.region,
            }));

            countryList.sort((a, b) => a.name.localeCompare(b.name));

            setCountries(countryList);
        } catch (error) {
            console.error("Failed to fetch countries:", error);
        }
        };

        fetchCountries();
        checkWalletConnection();
    }, []);

    const checkWalletConnection = async () => {
        try {
            const isConnected = await web3Service.isConnected();
            if (isConnected) {
                const account = web3Service.getAccount();
                setWalletAddress(account);
            }
        } catch (error) {
            console.error("Error checking wallet connection:", error);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file && file.type === "application/pdf") {
            setInvoiceFile(file);
            setError('');
        } else {
            setInvoiceFile(null);
            setError('Please upload a valid PDF file.');
        }
    };

    const uploadToPinata = async (file) => {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
        });

        const result = await res.json();
        console.log("result", result)
        if (!result) throw new Error('Upload failed');

        return `https://ipfs.io/ipfs://${result}`;
    };


    const calculateRiskScore = async () => {
        try {
            setCurrentStep('Calculating risk score...');
                        
            const response = await fetch('/api/risk-check', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    wallet: walletAddress,
                    country: country,
                    amount: parseFloat(faceValue),
                    industry: industry,
                    date: dueDate
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to calculate risk score');
            }

            const data = await response.json();
            console.log('Risk score calculated:', data);
            
            return {
                riskScore: data.risk_score,
                riskLevel: data.risk_level,
                message: data.details
            };
        } catch (error) {
            console.error('Risk calculation error:', error);
            throw new Error(`Failed to calculate risk score: ${error.message}`);
        }
    };

    const createInvoiceOnChain = async (tokenURI, riskScore) => {
        try {
            setCurrentStep('Creating invoice on blockchain...');
            
            // Convert date to Unix timestamp
            const dueDateTimestamp = web3Service.dateToTimestamp(dueDate);
            
            // Create invoice on smart contract
            const result = await web3Service.createInvoice(
                faceValue,
                discountValue,
                dueDateTimestamp,
                title,
                tokenURI
            );
            
            console.log('Invoice created on-chain:', result);
            
            // Process verification result (submit risk score)
            if (result.tokenId) {
                setCurrentStep('Submitting risk score...');
                await web3Service.processVerificationResult(
                    result.tokenId,
                    Math.round(riskScore)
                );
            }
            
            return result;
        } catch (error) {
            console.error('Blockchain error:', error);
            throw new Error(`Failed to create invoice on blockchain: ${error.message}`);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsLoading(true);
        setCurrentStep('');

        try {
            // Validation
            if (!walletAddress) {
                throw new Error('Please connect your wallet first');
            }

            if (!invoiceFile) {
                throw new Error('Please upload an invoice PDF');
            }

            if (parseFloat(discountValue) >= parseFloat(faceValue)) {
                throw new Error('Funding amount must be less than face value');
            }

            // Check if wallet is initialized
            const isConnected = await web3Service.isConnected();
            if (!isConnected) {
                await web3Service.connectWallet();
                const account = web3Service.getAccount();
                setWalletAddress(account);
            }

            // Check if seller is verified
            setCurrentStep('Checking seller verification...');
            const isVerified = await web3Service.isVerifiedSeller();
            if (!isVerified) {
                throw new Error('Your wallet is not verified as a seller. Please contact admin.');
            }

            // Step 1: Calculate Risk Score
            const riskData = await calculateRiskScore();
            
            // Step 2: Upload to Pinata
            const tokenURI = await uploadToPinata(invoiceFile);
            console.log("tokenuri", tokenURI)
            
            // Step 3: Create Invoice on Blockchain
            const invoiceResult = await createInvoiceOnChain(tokenURI, riskData.riskScore);
            console.log("result", invoiceResult)
            
            // Success!
            setSuccess(
                `✅ Invoice created successfully!\nTransaction: ${invoiceResult.transactionHash}\nToken ID: ${invoiceResult.tokenId}\nRisk Score: ${riskData.riskScore} (${riskData.riskLevel})\n${riskData.riskScore <= 40 ? 'Your invoice has been automatically listed!' : 'Your invoice needs manual review.'}`
            );
            
            // Reset form
            setFaceValue('');
            setDiscountValue('');
            setDueDate('');
            setInvoiceFile(null);
            setIndustry('');
            setCountry('India');
            setTitle('');
            
            // Clear file input
            const fileInput = document.getElementById('invoiceFile');
            if (fileInput) fileInput.value = '';

        } catch (err) {
            console.error('Error in form submission:', err);
            setError(err.message || 'An error occurred while creating the invoice');
        } finally {
            setIsLoading(false);
            setCurrentStep('');
        }
    };

   return (
        <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold font-sans text-gray-900">Create a New Invoice</h2>
            <p className="text-gray-600 mt-2">Fill out the details below to tokenize your invoice and list it for funding.</p>

            {!walletAddress && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-sm text-yellow-800">
                        ⚠️ Please connect your wallet to create an invoice
                    </p>
                </div>
            )}

            <form 
                onSubmit={handleSubmit}
                className={`mt-8 p-8 border border-gray-200 rounded-lg bg-white shadow-sm space-y-6 `}
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700 font-sans">
                            Invoice Title
                        </label>
                        <input
                            type="text"
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g., Q4 Services for Acme Corp"
                            required
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-400"
                        />
                        <p className="text-xs text-gray-500 mt-1">A short, descriptive title for your invoice.</p>
                    </div>
                    <div>
                        <label htmlFor="faceValue" className="block text-sm font-medium text-gray-700 font-sans">
                            Invoice Face Value (USD)
                        </label>
                        <input
                            type="number"
                            id="faceValue"
                            value={faceValue}
                            onChange={(e) => setFaceValue(e.target.value)}
                            placeholder="e.g., 50000"
                            required
                            step="0.01"
                            min="0"
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-400"
                        />
                        <p className="text-xs text-gray-500 mt-1">The total amount the debtor owes</p>
                    </div>
                    <div>
                        <label htmlFor="discountValue" className="block text-sm font-medium text-gray-700 font-sans">
                            Funding Amount (USD)
                        </label>
                        <input
                            type="number"
                            id="discountValue"
                            value={discountValue}
                            onChange={(e) => setDiscountValue(e.target.value)}
                            placeholder="e.g., 48000"
                            required
                            step="0.01"
                            min="0"
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-400"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Amount you'll receive now (discount: {faceValue && discountValue ? ((1 - discountValue / faceValue) * 100).toFixed(2) : 0}%)
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="country" className="block text-sm font-medium text-gray-700 font-sans">
                            Country
                        </label>
                        <select
                            id="country"
                            value={country}
                            onChange={(e) => setCountry(e.target.value)}
                            required
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                        >
                            <option value="">Select a country</option>
                            {countries.map((c) => (
                                <option key={c.code} value={c.name}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="industry" className="block text-sm font-medium text-gray-700 font-sans">
                            Industry
                        </label>
                        <select
                            id="industry"
                            value={industry}
                            onChange={(e) => setIndustry(e.target.value)}
                            required
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                        >
                            <option value="" disabled>Select an industry</option>
                            {industryOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </div>
                </div>

                <div>
                    <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 font-sans">
                        Invoice Due Date
                    </label>
                    <input
                        type="date"
                        id="dueDate"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        required
                        min={new Date().toISOString().split('T')[0]}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    />
                    <p className="text-xs text-gray-500 mt-1">When the debtor is expected to pay</p>
                </div>

                <div>
                    <label htmlFor="invoiceFile" className="block text-sm font-medium text-gray-700 font-sans">
                        Upload Invoice PDF
                    </label>
                    <input
                        type="file"
                        id="invoiceFile"
                        onChange={handleFileChange}
                        accept="application/pdf"
                        required
                        className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        {invoiceFile ? `✓ ${invoiceFile.name}` : 'Upload the invoice document. This will be encrypted and stored securely on IPFS.'}
                    </p>
                </div>

                {isLoading && currentStep && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                        <div className="flex items-center">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
                            <p className="text-sm text-blue-800">{currentStep}</p>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-sm text-red-800">{error}</p>
                    </div>
                )}

                {success && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                        <p className="text-sm text-green-800 whitespace-pre-line">{success}</p>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isLoading }
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    {isLoading ? currentStep || 'Processing...' : 
                     'Create Invoice'}
                </button>
            </form>

            <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-md">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">How it works:</h3>
                <ol className="text-xs text-gray-600 space-y-1 list-decimal list-inside">
                    <li>Your wallet and invoice details are verified</li>
                    <li>Risk score is calculated based on your profile and invoice</li>
                    <li>Invoice document is encrypted and uploaded to IPFS via Pinata</li>
                    <li>Invoice is created on the blockchain as an ERC-1155 token</li>
                    <li>If risk score ≤ 40, invoice is automatically listed for funding</li>
                    <li>If risk score {'>'} 40, admin will review before listing</li>
                </ol>
            </div>
        </div>
    );
}

