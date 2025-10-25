'use client';

import { useState, useEffect } from 'react';
import lighthouse from '@lighthouse-web3/sdk'
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
  "Fashion",
  "Cryptocurrency"
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

    const convertDateToDDMMYYYY = (dateString) => {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const uploadToLighthouse = async (file) => {
        try {
            setCurrentStep('Uploading invoice to Lighthouse...');
            
            // Upload file to Lighthouse
            const output = await lighthouse.upload([file], process.env.NEXT_LIGHTHOUSE_API_KEY);
            
            if (!output || !output.data || !output.data.Hash) {
                throw new Error('Failed to get IPFS hash from Lighthouse');
            }

            const ipfsHash = output.data.Hash;
            const ipfsUri = `ipfs://${ipfsHash}`;
            
            console.log('File uploaded to Lighthouse:', ipfsUri);
            return ipfsUri;
        } catch (error) {
            console.error('Lighthouse upload error:', error);
            throw new Error(`Failed to upload to Lighthouse: ${error.message}`);
        }
    };

    const calculateRiskScore = async () => {
        try {
            setCurrentStep('Calculating risk score...');
            
            const formattedDate = convertDateToDDMMYYYY(dueDate);
            
            const response = await fetch('/api/risk/check', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    wallet: walletAddress,
                    country: country,
                    amount: parseFloat(faceValue),
                    industry: industry,
                    date: formattedDate
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
                message: data.message
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
                tokenURI,
                faceValue,
                discountValue,
                dueDateTimestamp
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
            
            // Step 2: Upload to Lighthouse
            const tokenURI = await uploadToLighthouse(invoiceFile);
            
            // Step 3: Create Invoice on Blockchain
            const invoiceResult = await createInvoiceOnChain(tokenURI, riskData.riskScore);
            
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
             <h2 className="text-3xl font-bold font-sans">Create a New Invoice</h2>
            <p className="text-gray-600 mt-2">Fill out the details below to tokenize your invoice and list it for funding.</p>
            
            <form onSubmit={handleSubmit} className="mt-8 p-8 border border-gray-200 rounded-lg bg-white shadow-sm space-y-6">
                {/* Face Value and Discount Value can be in a grid for better layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#1E4D43] focus:border-[#1E4D43] text-gray-900 placeholder-gray-400" // ADDED text colors
                        />
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
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#1E4D43] focus:border-[#1E4D43] text-gray-900 placeholder-gray-400" // ADDED text colors
                        />
                    </div>
                </div>

                {/* ADDED: Country and Industry Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="country" className="block text-sm font-medium text-gray-700 font-sans">
                            Country
                        </label>
                         <select
                            id="country"
                            value={country}
                            onChange={(e) => setCountry(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-[#1E4D43] focus:border-[#1E4D43] text-gray-900"
                            >
                            <option value="">Select a country</option>
                            {countries.map((c) => (
                                <option key={c.code} value={c.name}>
                                {c.name} ({c.code})
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
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-[#1E4D43] focus:border-[#1E4D43] text-gray-900" // ADDED text color
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
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#1E4D43] focus:border-[#1E4D43] text-gray-900" // ADDED text color
                    />
                </div>

                {/* ADDED: File Upload Input */}
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
                        className="mt-1 block w-full text-sm text-gray-500
                                   file:mr-4 file:py-2 file:px-4
                                   file:rounded-md file:border-0
                                   file:text-sm file:font-semibold
                                   file:bg-[#1E4D43]/10 file:text-[#1E4D43]
                                   hover:file:bg-[#1E4D43]/20"
                    />
                    <p className="text-xs text-gray-500 mt-1">Upload the invoice document. This will be encrypted and stored securely.</p>
                </div>

                {error && <p className="text-sm text-red-600 text-center">{error}</p>}

                 <div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-[#1E4D43] hover:bg-opacity-90 disabled:bg-gray-400 font-sans"
                    >
                        {isLoading ? 'Submitting...' : 'Create & List Invoice'}
                    </button>
                </div>
            </form>
        </div>
    );
}

