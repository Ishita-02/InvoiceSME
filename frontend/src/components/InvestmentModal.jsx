"use client";
import { useState } from 'react';
import web3Service from '../app/components/services/Web3Service';
import { useWeb3 } from '../app/context/Web3Provider';

const InvestmentModal = ({ invoice, onClose }) => {
  const { account } = useWeb3();
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const fundingGoal = parseFloat(invoice.discountValue) || 0;
  const fundedAmount = parseFloat(invoice.fundedAmount) || 0;
  const remainingAmount = Math.max(fundingGoal - fundedAmount, 0);

  const handleAmountChange = (e) => {
    const value = e.target.value;
    setAmount(value);
    setError('');

    const investAmount = parseFloat(value);
    if (investAmount > remainingAmount) {
      setError('Entered amount exceeds the remaining funding available.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const investAmount = parseFloat(amount);

    if (!investAmount || investAmount <= 0) {
      setError('Please enter a valid amount.');
      setIsLoading(false);
      return;
    }

    if (investAmount > remainingAmount) {
      setError('Entered amount exceeds the remaining funding available.');
      setIsLoading(false);
      return;
    }

    try {
      const amountInWei = web3Service.toWei(investAmount);

      await web3Service.executeInvestment(invoice.id, amountInWei);

      alert('Investment successful!');
      onClose();
      window.location.reload()
    } catch (err) {
      console.error('Investment failed:', err);
      setError(err.message || 'An error occurred during the investment.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white rounded-lg p-8 shadow-2xl w-full max-w-md m-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-[#1E4D43]">
            Invest in Invoice #{invoice.id}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800"
          >
            &times;
          </button>
        </div>

        <div className="space-y-2 mb-6 text-sm">
          <p>
            <strong>Funding Goal:</strong> {invoice.discountValue} PYUSD
          </p>
          <p>
            <strong>Seller:</strong>{' '}
            <span className="text-xs break-all">{invoice.seller}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="amount"
              className="block text-sm font-medium text-gray-700"
            >
              Amount to Invest (PYUSD)
            </label>
            <input
              type="number"
              id="amount"
              value={amount}
              onChange={handleAmountChange}
              placeholder="0.00"
              required
              step="0.01"
              min="0"
              className={`mt-1 block w-full px-3 py-2 border ${
                error ? 'border-red-500' : 'border-gray-300'
              } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1E4D43]`}
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !!error}
              className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-[#1E4D43] hover:bg-opacity-90 disabled:bg-gray-400"
            >
              {isLoading ? 'Processing...' : 'Invest Now'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InvestmentModal;
