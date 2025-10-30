'use client';

import { useState, useEffect } from 'react';
import web3Service from '../components/services/Web3Service';
import { useWeb3 } from '../context/Web3Provider';
import { useRouter } from 'next/navigation';

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

export default function CreateInvoicePage() {
    const [faceValue, setFaceValue] = useState('');
    const [discountValue, setDiscountValue] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [invoiceFile, setInvoiceFile] = useState(null); 
    const [industry, setIndustry] = useState(''); 
    const [country, setCountry] = useState('India'); 
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [countries, setCountries] = useState([]);
    const [currentStep, setCurrentStep] = useState('');
    const [success, setSuccess] = useState('');
    const [title, setTitle] = useState('');
    const [ipfsLink, setIpfsLink] = useState('');
    const [formErrors, setFormErrors] = useState({});

    const {account} = useWeb3();
    const router = useRouter(); 


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
    }, [account]);

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

    const validateDiscount = (fv, dv) => {
        const faceNum = parseFloat(fv);
        const discountNum = parseFloat(dv);

        if (faceNum && discountNum && discountNum >= faceNum) {
            setFormErrors(prev => ({ ...prev, discount: 'Funding amount must be less than face value.' }));
        } else {
            setFormErrors(prev => ({ ...prev, discount: '' }));
        }
    };

    const handleFaceValueChange = (e) => {
        const newFaceValue = e.target.value;
        setFaceValue(newFaceValue);
        validateDiscount(newFaceValue, discountValue);
    };

    const handleDiscountValueChange = (e) => {
        const newDiscountValue = e.target.value;
        setDiscountValue(newDiscountValue);
        validateDiscount(faceValue, newDiscountValue);
    };

    const uploadToPinata = async (file) => {
        setCurrentStep('Uploading document to IPFS...'); 
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
        });

        const result = await res.json();
        console.log("result", result)
        if (!result) throw new Error('Upload failed');

        const link = `https://ipfs.io/ipfs://${result}`;
        setIpfsLink(link);

        return link;
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
                    wallet: account,
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
            
            const dueDateTimestamp = web3Service.dateToTimestamp(dueDate);
            
            const result = await web3Service.createInvoice(
                faceValue,
                discountValue,
                dueDateTimestamp,
                title,
                tokenURI
            );
            
            console.log('Invoice created on-chain:', result);

            await new Promise(resolve => setTimeout(resolve, 1500));
            
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
            if (!account) {
                throw new Error('Please connect your wallet first');
            }

            if (!invoiceFile) {
                throw new Error('Please upload an invoice PDF');
            }

            if (parseFloat(discountValue) >= parseFloat(faceValue)) {
                throw new Error('Funding amount must be less than face value');
            }

            setCurrentStep('Checking seller verification...');
            const isVerified = await web3Service.isVerifiedSeller();
            if (!isVerified) {
                throw new Error('Your wallet is not verified as a seller. Please contact admin.');
            }

            const riskData = await calculateRiskScore();
            
            const tokenURI = await uploadToPinata(invoiceFile);
            console.log("tokenuri", tokenURI)
            
            const invoiceResult = await createInvoiceOnChain(tokenURI, riskData.riskScore);
            console.log("result", invoiceResult)
            
            setSuccess(
                `✅ Invoice created successfully!\nTransaction: ${invoiceResult.transactionHash}\nToken ID: ${invoiceResult.tokenId}\nIPFS Link: ${ipfsLink}\nRisk Score: ${riskData.riskScore} (${riskData.riskLevel})\n${riskData.riskScore <= 40 ? 'Your invoice has been automatically listed!' : 'Your invoice needs manual review.'}`
            );

            setTimeout(() => {
                router.push('/dashboard');
            }, 3000);
            
            setFaceValue('');
            setDiscountValue('');
            setDueDate('');
            setInvoiceFile(null);
            setIndustry('');
            setCountry('India');
            setTitle('');
            
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
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-[#1E4D43] relative overflow-hidden"
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
            
            <style jsx>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-30px); }
                }
            `}</style>

            <div className="container mx-auto p-6 mt-6 relative z-10">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="backdrop-blur-md bg-white/80 rounded-3xl p-8 mb-8 shadow-xl border border-white/20"
                         style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(10px)' }}>
                        <div className="flex items-start justify-between">
                            <div>
                                <h2 className="text-3xl font-bold font-sans text-slate-900" style={{ color: '#0F172A' }}>
                                    Create Invoice
                                </h2>
                                <p className="text-slate-600 mt-2" style={{ color: '#64748B' }}>
                                    Fill out the details below to tokenize your invoice and list it for funding
                                </p>
                            </div>
                            <a 
                                href="/dashboard"
                                className="flex items-center gap-2 px-4 py-2 rounded-xl border transition-all hover:shadow-md"
                                style={{ 
                                    color: '#475569', 
                                    borderColor: '#E2E8F0', 
                                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                }}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                                Back
                            </a>
                        </div>

                        {!account && (
                            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl" 
                                 style={{ backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }}>
                                <div className="flex items-center gap-3">
                                    <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    <p className="text-sm font-medium text-amber-800" style={{ color: '#92400E' }}>
                                        Please connect your wallet to create an invoice
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    <form 
                        onSubmit={handleSubmit}
                        className="backdrop-blur-md bg-white/90 rounded-3xl p-8 shadow-xl border border-white/20 space-y-6"
                        style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(10px)' }}
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="title" className="block text-sm font-semibold text-slate-700 mb-2" style={{ color: '#334155' }}>
                                    Invoice Title
                                </label>
                                <input
                                    type="text"
                                    id="title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g., Q4 Services for Acme Corp"
                                    required
                                    className="w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1E4D43] focus:border-transparent transition-all"
                                    style={{ color: '#0F172A', backgroundColor: '#FFFFFF', borderColor: '#CBD5E1' }}
                                />
                                <p className="text-xs text-slate-500 mt-2" style={{ color: '#64748B' }}>
                                    A short, descriptive title for your invoice
                                </p>
                            </div>
                            <div>
                                <label htmlFor="faceValue" className="block text-sm font-semibold text-slate-700 mb-2" style={{ color: '#334155' }}>
                                    Invoice Face Value (USD)
                                </label>
                                <input
                                    type="number"
                                    id="faceValue"
                                    value={faceValue}
                                    onChange={handleFaceValueChange} // Use new handler
                                    placeholder="e.g., 50000"
                                    required
                                    step="0.01"
                                    min="0"
                                    className="w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1E4D43] focus:border-transparent transition-all"
                                    style={{ color: '#0F172A', backgroundColor: '#FFFFFF', borderColor: '#CBD5E1' }}
                                />
                                <p className="text-xs text-slate-500 mt-2" style={{ color: '#64748B' }}>
                                    The total amount the debtor owes
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="discountValue" className="block text-sm font-semibold text-slate-700 mb-2" style={{ color: '#334155' }}>
                                    Funding Amount (USD)
                                </label>
                                <input
                                    type="number"
                                    id="discountValue"
                                    value={discountValue}
                                    onChange={handleDiscountValueChange} // Use new handler
                                    placeholder="e.g., 48000"
                                    required
                                    step="0.01"
                                    min="0"
                                    className={`w-full px-4 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                                        formErrors.discount ? 'border-red-500 ring-2 ring-red-300' : 'border-slate-300 focus:ring-[#1E4D43]'
                                    }`}
                                    style={{ color: '#0F172A', backgroundColor: '#FFFFFF' }}
                                />
                                <p className="text-xs text-slate-500 mt-2" style={{ color: '#64748B' }}>
                                    Amount you'll receive now (discount: {faceValue && discountValue && parseFloat(faceValue) > 0 ? ((1 - parseFloat(discountValue) / parseFloat(faceValue)) * 100).toFixed(2) : 0}%)
                                </p>
                                {formErrors.discount && (
                                    <p className="text-xs text-red-600 mt-1" style={{ color: '#DC2626' }}>{formErrors.discount}</p>
                                )}
                            </div>
                            <div>
                                <label htmlFor="dueDate" className="block text-sm font-semibold text-slate-700 mb-2" style={{ color: '#334155' }}>
                                    Invoice Due Date
                                </label>
                                <input
                                    type="date"
                                    id="dueDate"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    required
                                    min={new Date().toISOString().split('T')[0]}
                                    className="w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1E4D43] focus:border-transparent transition-all"
                                    style={{ color: '#0F172A', backgroundColor: '#FFFFFF', borderColor: '#CBD5E1' }}
                                />
                                <p className="text-xs text-slate-500 mt-2" style={{ color: '#64748B' }}>
                                    When the debtor is expected to pay
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="country" className="block text-sm font-semibold text-slate-700 mb-2" style={{ color: '#334155' }}>
                                    Country
                                </label>
                                <select
                                    id="country"
                                    value={country}
                                    onChange={(e) => setCountry(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1E4D43] focus:border-transparent transition-all"
                                    style={{ color: '#0F172A', backgroundColor: '#FFFFFF', borderColor: '#CBD5E1' }}
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
                                <label htmlFor="industry" className="block text-sm font-semibold text-slate-700 mb-2" style={{ color: '#334155' }}>
                                    Industry
                                </label>
                                <select
                                    id="industry"
                                    value={industry}
                                    onChange={(e) => setIndustry(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1E4D43] focus:border-transparent transition-all"
                                    style={{ color: '#0F172A', backgroundColor: '#FFFFFF', borderColor: '#CBD5E1' }}
                                >
                                    <option value="" disabled>Select an industry</option>
                                    {industryOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="invoiceFile" className="block text-sm font-semibold text-slate-700 mb-2" style={{ color: '#334155' }}>
                                Upload Invoice PDF
                            </label>
                            <div className="relative">
                                <input
                                    type="file"
                                    id="invoiceFile"
                                    onChange={handleFileChange}
                                    accept="application/pdf"
                                    required
                                    className="w-full text-sm text-slate-500 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-[#1E4D43] file:text-white hover:file:bg-[#163C34] file:cursor-pointer cursor-pointer"
                                    style={{ color: '#64748B' }}
                                />
                            </div>
                            <p className="text-xs text-slate-500 mt-2" style={{ color: '#64748B' }}>
                                {invoiceFile ? (
                                    <span className="flex items-center gap-2 text-emerald-600" style={{ color: '#10B981' }}>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        {invoiceFile.name}
                                    </span>
                                ) : (
                                    'Upload the invoice document. This will be encrypted and stored securely on IPFS.'
                                )}
                            </p>
                        </div>

                        {isLoading && currentStep && (
                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl"
                                 style={{ backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }}>
                                <div className="flex items-center gap-3">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                                    <p className="text-sm font-medium text-blue-800" style={{ color: '#1E40AF' }}>{currentStep}</p>
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-xl"
                                 style={{ backgroundColor: '#FEF2F2', borderColor: '#FECACA' }}>
                                <div className="flex items-start gap-3">
                                    <svg className="w-5 h-5 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    <p className="text-sm text-red-800" style={{ color: '#991B1B' }}>{error}</p>
                                </div>
                            </div>
                        )}

                        {success && (
                            <div className="p-4 bg-green-50 border border-green-200 rounded-xl"
                                 style={{ backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }}>
                                <div className="flex items-start gap-3">
                                    <svg className="w-5 h-5 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <p className="text-sm text-green-800 whitespace-pre-line" style={{ color: '#166534' }}>{success}</p>
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex justify-center items-center gap-2 py-4 px-6 rounded-xl shadow-lg text-sm font-bold text-white transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                            style={{ 
                                backgroundColor: isLoading ? '#94A3B8' : '#1E4D43',
                                color: 'white',
                                boxShadow: isLoading ? 'none' : '0 10px 30px rgba(30, 77, 67, 0.3)'
                            }}
                        >
                            {isLoading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    {currentStep || 'Processing...'}
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Create Invoice
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 backdrop-blur-md bg-white/70 rounded-3xl p-6 shadow-xl border border-white/20"
                         style={{ backgroundColor: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(10px)' }}>
                        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2" style={{ color: '#0F172A' }}>
                            <svg className="w-5 h-5 text-[#1E4D43]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            How it works
                        </h3>
                        <ol className="text-xs text-slate-600 space-y-2" style={{ color: '#475569' }}>
                            <li className="flex items-start gap-3">
                                <span className="flex-shrink-0 w-6 h-6 bg-[#1E4D43] text-white rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: '#1E4D43' }}>1</span>
                                <span>Your wallet and invoice details are verified</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="flex-shrink-0 w-6 h-6 bg-[#1E4D43] text-white rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: '#1E4D43' }}>2</span>
                                <span>Risk score is calculated based on your profile and invoice</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="flex-shrink-0 w-6 h-6 bg-[#1E4D43] text-white rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: '#1E4D43' }}>3</span>
                                <span>Invoice document is encrypted and uploaded to IPFS via Pinata</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="flex-shrink-0 w-6 h-6 bg-[#1E4D43] text-white rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: '#1E4D43' }}>4</span>
                                <span>Invoice is created on the blockchain as an ERC-1155 token</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="flex-shrink-0 w-6 h-6 bg-[#1E4D43] text-white rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: '#1E4D43' }}>5</span>
                                <span>If risk score ≤ 40, invoice is automatically listed for funding</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="flex-shrink-0 w-6 h-6 bg-[#1E4D43] text-white rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: '#1E4D43' }}>6</span>
                                <span>If risk score {'>'} 40, admin will review before listing</span>
                            </li>
                        </ol>
                    </div>
                </div>
            </div>
        </div>
    );
}