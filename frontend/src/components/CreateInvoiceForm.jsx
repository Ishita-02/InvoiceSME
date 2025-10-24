'use client';

import { useState, useEffect } from 'react';
import lighthouse from '@lighthouse-web3/sdk'


// Added a list of industries for the dropdown
const industryOptions = [
    "IT Services & Consulting",
    "Manufacturing",
    "Textiles & Apparel",
    "Pharmaceuticals",
    "Automotive",
    "FMCG (Fast-Moving Consumer Goods)",
    "Logistics & Supply Chain",
    "Other"
];

export default function CreateInvoiceForm() {
    const [faceValue, setFaceValue] = useState('');
    const [discountValue, setDiscountValue] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [invoiceFile, setInvoiceFile] = useState(null); // ADDED: State for file object
    const [industry, setIndustry] = useState(''); // ADDED: State for industry
    const [country, setCountry] = useState('India'); // ADDED: State for country
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [countries, setCountries] = useState([]);

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
    }, []);

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        // TODO:
        // 1. Upload the `invoiceFile` to Lighthouse/IPFS to get the tokenURI.
        // 2. Pass the form data (including industry, country) to your backend.
        // 3. Your backend calculates the risk score.
        // 4. Your backend calls the `createInvoice` function on the smart contract.
        console.log({
            faceValue,
            discountValue,
            dueDate,
            invoiceFile: invoiceFile?.name,
            industry,
            country
        });

        await new Promise(resolve => setTimeout(resolve, 2000)); // Mock network delay

        setIsLoading(false);
        // Reset form or show success message
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

