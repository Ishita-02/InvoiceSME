import Web3 from 'web3';
import InvoiceSMEABI from './../../abis/InvoiceSME';
import tokenABI from './../../abis/Token';


class Web3Service {
  constructor() {

    this.contract = null;
    
    this.account = null;
    this.contractABI = InvoiceSMEABI;
    this.tokenABI = tokenABI;
    
    this.contractAddress = "0xbD0a10dd3fCBCeF37fFfF05A459A8E68554B1303";
    this.tokenAddress = "0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9"
  }

  
  async init() {
    if (typeof window.ethereum !== 'undefined') {
      this.web3 = new Web3("https://ethereum-sepolia-rpc.publicnode.com"); 
      
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const accounts = await this.web3.eth.getAccounts();
        this.account = accounts[0];
        console.log("account", this.account)

        window.ethereum.on('accountsChanged', (newAccounts) => {
          console.log("Wallet account changed to:", newAccounts[0]);
         
          window.location.reload(); 
        });
        
        this.contract = new this.web3.eth.Contract(this.contractABI, this.contractAddress);
        this.tokenContract = new this.web3.eth.Contract(this.tokenABI, this.tokenAddress);
        
        return true;
      } catch (error) {
        console.error("User denied account access");
        return false;
      }
    } else {
      console.error("No ethereum provider detected");
      return false;
    }
  }

  async connectWallet() {
    if (typeof window.ethereum === 'undefined') {
      throw new Error("No Ethereum provider found. Please install MetaMask.");
    }
    
    this.web3 = new Web3(window.ethereum);
    
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    if (accounts.length === 0) {
      throw new Error("No accounts found. Please connect an account in MetaMask.");
    }
    
    this.account = accounts[0]; 

    this.contract = new this.web3.eth.Contract(this.contractABI, this.contractAddress);
    this.tokenContract = new this.web3.eth.Contract(this.tokenABI, this.tokenAddress);
    
    console.log("Web3Service connected to account:", this.account);
    return this.account;
  }

  async isConnected() {
    if (typeof window.ethereum === 'undefined') {
      return false;
    }
    this.web3 = new Web3(window.ethereum);
    const accounts = await this.web3.eth.getAccounts();
    return accounts.length > 0;
  }

  getAccount() {
    return this.account;
  }

  isInitialized() {
    return this.web3 && this.contract && this.account;
  }

  getContractAddress() {
    if (this.contract) {
      return this.contract.options.address;
    }
    console.error("Contract not initialized, cannot get address.");
    return null;
  }

  async approveTokenSpend(amountInWei) {
    if (!this.tokenContract || !this.account) {
      throw new Error("Web3 not initialized. Please connect your wallet.");
    }
  
    try {
      const currentAllowance = await this.tokenContract.methods
        .allowance(this.account, this.contractAddress)
        .call();
  
      console.log("Current allowance:", currentAllowance);
      console.log("Amount needed:", amountInWei);
  
      if (BigInt(currentAllowance) >= BigInt(amountInWei)) {
        console.log("Sufficient allowance already exists.");
        return true; 
      } else {
        console.log("Allowance is insufficient. Sending approve transaction...");
        const tx = await this.tokenContract.methods
          .approve(this.contractAddress, amountInWei)
          .send({ from: this.account });
          
        console.log("Approve transaction successful:", tx.transactionHash);
        return tx.transactionHash; 
      }
    } catch (error) {
      console.error("Error approving token spend:", error);
      throw error;
    }
  }

   async getTokenBalance(address = null) {
    if (!this.tokenContract) {
      throw new Error("Token contract not initialized.");
    }

    const targetAddress = address || this.account;
    if (!targetAddress) {
      throw new Error("No address provided and no account connected.");
    }

    try {
      const balance = await this.tokenContract.methods.balanceOf(targetAddress).call();
      return this.web3.utils.fromWei(balance, 'ether'); // Assuming PYUSD uses 18 decimals
    } catch (error) {
      console.error("Error fetching token balance:", error);
      throw error;
    }
  }

  // ==================== SELLER MANAGEMENT ====================

  /**
   * Adds a verified seller (Owner only)
   * @param {string} sellerAddress - The address of the seller to verify
   */
  async addVerifiedSeller(sellerAddress) {
    if (!this.contract || !this.account) {
      throw new Error("Web3 not initialized. Please connect your wallet.");
    }

    try {
      const tx = await this.contract.methods
        .addVerifiedSeller(sellerAddress)
        .send({ from: this.account });
      
      console.log("Seller verified successfully:", tx.transactionHash);
      return tx.transactionHash;
    } catch (error) {
      console.error("Error verifying seller:", error);
      throw error;
    }
  }

  /**
   * Checks if an address is a verified seller
   * @param {string} sellerAddress - The address to check
   */
  async isVerifiedSeller(sellerAddress) {
    if (!this.contract) {
      throw new Error("Contract not initialized.");
    }

    const targetAddress = sellerAddress || this.account;
    console.log("address", this.account)
    if (!targetAddress) {
      throw new Error("No address provided and no account connected.");
    }

    try {
      const isVerified = await this.contract.methods
        .verifiedSellers(targetAddress)
        .call();
    console.log("seller", isVerified)
      return isVerified;
    } catch (error) {
      console.error("Error checking seller verification:", error);
      throw error;
    }
  }

  // ==================== INVOICE CREATION & MANAGEMENT ====================

  /**
   * Creates a new invoice
   * @param {string} tokenURI - IPFS URI for invoice metadata
   * @param {string} faceValue - Face value in Wei (or token's smallest unit)
   * @param {string} discountValue - Discount value in Wei
   * @param {number} dueDate - Unix timestamp of due date
   */
  async createInvoice(faceValue, discountValue, dueDate, title, tokenURI) {
    if (!this.contract || !this.account) {
      throw new Error("Web3 not initialized. Please connect your wallet.");
    }

    try {
      const faceValueWei = this.web3.utils.toBN(faceValue).mul(this.web3.utils.toBN(10).pow(this.web3.utils.toBN(6)));
      const discountValueWei = this.web3.utils.toBN(discountValue).mul(this.web3.utils.toBN(10).pow(this.web3.utils.toBN(6)));
      
      const tx = await this.contract.methods
        .createInvoice(faceValueWei, discountValueWei, dueDate, title, tokenURI)
        .send({ from: this.account });
      
      console.log("Invoice created successfully:", tx.transactionHash);
      
      // Extract tokenId from events
      const tokenId = tx.events.InvoiceCreated?.returnValues?.tokenId;
      return { transactionHash: tx.transactionHash, tokenId };
    } catch (error) {
      console.error("Error creating invoice:", error);
      throw error;
    }
  }

  /**
   * Process verification result (called by off-chain service)
   * @param {number} tokenId - Invoice token ID
   * @param {number} riskScore - Risk score (0-100)
   */
  async processVerificationResult(tokenId, riskScore) {
    if (!this.contract || !this.account) {
      throw new Error("Web3 not initialized. Please connect your wallet.");
    }

    try {
      console.log(riskScore)
      const tx = await this.contract.methods
        .processVerificationResult(tokenId, riskScore)
        .send({ from: this.account });
      
      console.log("Verification result processed:", tx.transactionHash);
      return tx.transactionHash;
    } catch (error) {
      console.error("Error processing verification result:", error);
      throw error;
    }
  }

  /**
   * Manually approve an invoice for listing (Owner only)
   * @param {number} tokenId - Invoice token ID
   */
  async approveForListing(tokenId) {
    if (!this.contract || !this.account) {
      throw new Error("Web3 not initialized. Please connect your wallet.");
    }

    try {
      const tx = await this.contract.methods
        .approveForListing(tokenId)
        .send({ from: this.account });
      
      console.log("Invoice approved for listing:", tx.transactionHash);
      return tx.transactionHash;
    } catch (error) {
      console.error("Error approving invoice for listing:", error);
      throw error;
    }
  }

  // ==================== INVESTOR FUNCTIONS ====================

  /**
   * Execute investment (buy invoice shares)
   * @param {string} investor - Investor address
   * @param {string} seller - Seller address
   * @param {number} tokenId - Invoice token ID
   * @param {string} amount - Amount in Wei
   */
  async executeInvestment( tokenId, amount) {
    if (!this.contract || !this.account) {
      throw new Error("Web3 not initialized. Please connect your wallet.");
    }

    try {
      // First approve token spend
      await this.approveTokenSpend(amount);

      // Execute investment
      const tx = await this.contract.methods
        .executeInvestment( tokenId, amount)
        .send({ from: this.account });
      
      console.log("Investment executed:", tx.transactionHash);
      return tx.transactionHash;
    } catch (error) {
      console.error("Error executing investment:", error);
      throw error;
    }
  }

  async approveMarketplace() {
    if (!this.contract || !this.account) {
      throw new Error("Web3 not initialized. Please connect your wallet.");
    }
    
    try {
      // The operator is the address of our own smart contract
      const operatorAddress = this.contract.options.address;
      
      console.log(`Approving marketplace contract (${operatorAddress}) for all tokens...`);

      const tx = await this.contract.methods
        .setApprovalForAll(operatorAddress, true)
        .send({ from: this.account });

      console.log("Marketplace approved successfully:", tx.transactionHash);
      return tx;
    } catch (error) {
      console.error("Error approving marketplace:", error);
      throw error;
    }
  }

  /**
   * Transfer ERC1155 invoice tokens (for selling shares)
   * @param {string} to - Recipient address
   * @param {number} tokenId - Invoice token ID
   * @param {string} amount - Amount of shares to transfer
   */
  async safeTransferFrom(to, tokenId, amount) {
    if (!this.contract || !this.account) {
      throw new Error("Web3 not initialized. Please connect your wallet.");
    }

    try {
      const tx = await this.contract.methods
        .safeTransferFrom(this.account, to, tokenId, amount, "0x")
        .send({ from: this.account });
      
      console.log("Shares transferred:", tx.transactionHash);
      return tx.transactionHash;
    } catch (error) {
      console.error("Error transferring shares:", error);
      throw error;
    }
  }

  /**
   * Approve operator to transfer tokens on behalf of owner
   * @param {string} operator - Operator address
   * @param {boolean} approved - Approval status
   */
  async setApprovalForAll(operator, approved) {
    if (!this.contract || !this.account) {
      throw new Error("Web3 not initialized. Please connect your wallet.");
    }

    try {
      const tx = await this.contract.methods
        .setApprovalForAll(operator, approved)
        .send({ from: this.account });
      
      console.log("Approval set:", tx.transactionHash);
      return tx.transactionHash;
    } catch (error) {
      console.error("Error setting approval:", error);
      throw error;
    }
  }

  /**
   * Check if operator is approved
   * @param {string} owner - Owner address
   * @param {string} operator - Operator address
   */
  async isApprovedForAll(owner, operator) {
    if (!this.contract) {
      throw new Error("Contract not initialized.");
    }

    try {
      const isApproved = await this.contract.methods
        .isApprovedForAll(owner, operator)
        .call();
      return isApproved;
    } catch (error) {
      console.error("Error checking approval:", error);
      throw error;
    }
  }

  // ==================== REPAYMENT & CLAIMING ====================

  /**
   * Repay an invoice (Owner only)
   * @param {number} tokenId - Invoice token ID
   */
  async repayInvoice(tokenId, totalRepaymentAmount) {
    if (!this.contract || !this.account) {
      throw new Error("Web3 not initialized. Please connect your wallet.");
    }

    try {
      // First approve token spend
      await this.approveTokenSpend(totalRepaymentAmount);

      // Repay invoice
      const tx = await this.contract.methods
        .repayInvoice(tokenId)
        .send({ from: this.account });
      
      console.log("Invoice repaid:", tx.transactionHash);
      return tx.transactionHash;
    } catch (error) {
      console.error("Error repaying invoice:", error);
      throw error;
    }
  }

  /**
   * Claim repayment for invested shares
   * @param {number} tokenId - Invoice token ID
   */
  async claimRepayment(tokenId) {
    if (!this.contract || !this.account) {
      throw new Error("Web3 not initialized. Please connect your wallet.");
    }

    try {
      const tx = await this.contract.methods
        .claimRepayment(tokenId)
        .send({ from: this.account });
      
      console.log("Repayment claimed:", tx.transactionHash);
      return tx.transactionHash;
    } catch (error) {
      console.error("Error claiming repayment:", error);
      throw error;
    }
  }

  // ==================== VIEW FUNCTIONS ====================

  /**
   * Get all invoices
   */
  async getAllInvoices() {
    if (!this.contract) {
      throw new Error("Contract not initialized.");
    }

    try {
      const invoices = await this.contract.methods.getAllInvoices().call();
      return this.formatInvoices(invoices);
    } catch (error) {
      console.error("Error fetching all invoices:", error);
      throw error;
    }
  }

  /**
   * Get invoice by ID
   * @param {number} invoiceId - Invoice token ID
   */
  async getInvoiceById(invoiceId) {
    if (!this.contract) {
      throw new Error("Contract not initialized.");
    }

    try {
      const invoice = await this.contract.methods.getInvoiceById(invoiceId).call();
      return this.formatInvoice(invoice);
    } catch (error) {
      console.error("Error fetching invoice by ID:", error);
      throw error;
    }
  }

  /**
   * Get user's created invoices (as seller)
   * @param {string} userAddress - User address (optional, defaults to connected account)
   */
  async getUsersInvoices(userAddress = null) {
    if (!this.contract) {
      throw new Error("Contract not initialized.");
    }

    const targetAddress = userAddress || this.account;
    if (!targetAddress) {
      throw new Error("No address provided and no account connected.");
    }

    try {
      const invoices = await this.contract.methods.getUsersInvoices(targetAddress).call();
      return this.formatInvoices(invoices);
    } catch (error) {
      console.error("Error fetching user invoices:", error);
      throw error;
    }
  }

  /**
   * Get invoices user has invested in
   * @param {string} userAddress - User address (optional, defaults to connected account)
   */
  async getUserInvestedInvoices(userAddress = null) {
    if (!this.contract) {
      throw new Error("Contract not initialized.");
    }

    const targetAddress = userAddress || this.account;
    if (!targetAddress) {
      throw new Error("No address provided and no account connected.");
    }

    try {
      const invoices = await this.contract.methods.getUserInvestedInvoices(targetAddress).call();
      return this.formatInvoices(invoices);
    } catch (error) {
      console.error("Error fetching invested invoices:", error);
      throw error;
    }
  }

  /**
   * Get balance of invoice shares for an address
   * @param {string} address - Address to check (optional, defaults to connected account)
   * @param {number} tokenId - Invoice token ID
   */
  async getInvoiceShareBalance(tokenId, address = null) {
    if (!this.contract) {
      throw new Error("Contract not initialized.");
    }

    const targetAddress = address || this.account;
    if (!targetAddress) {
      throw new Error("No address provided and no account connected.");
    }

    try {
      const balance = await this.contract.methods.balanceOf(targetAddress, tokenId).call();
      return balance;
    } catch (error) {
      console.error("Error fetching invoice share balance:", error);
      throw error;
    }
  }

  /**
   * Get token URI for an invoice
   * @param {number} tokenId - Invoice token ID
   */
  async getTokenURI(tokenId) {
    if (!this.contract) {
      throw new Error("Contract not initialized.");
    }

    try {
      const uri = await this.contract.methods.uri(tokenId).call();
      return uri;
    } catch (error) {
      console.error("Error fetching token URI:", error);
      throw error;
    }
  }

  /**
   * Get contract owner
   */
  async getOwner() {
    if (!this.contract) {
      throw new Error("Contract not initialized.");
    }

    try {
      const owner = await this.contract.methods.owner().call();
      return owner;
    } catch (error) {
      console.error("Error fetching contract owner:", error);
      throw error;
    }
  }

  // ==================== HELPER FUNCTIONS ====================

  /**
   * Format invoice data from contract
   */
  formatInvoice(invoice) {
    const statusNames = ['Pending', 'ManualReview', 'Listed', 'Funded', 'Repaid', 'Closed'];
    
    return {
      id: Number(invoice.id),
      seller: invoice.seller,
      faceValue: this.web3.utils.fromWei(invoice.faceValue.toString(), 'ether'),
      discountValue: this.web3.utils.fromWei(invoice.discountValue.toString(), 'ether'),
      dueDate: Number(invoice.dueDate),
      dueDateFormatted: new Date(Number(invoice.dueDate) * 1000).toLocaleDateString(),
      status: statusNames[Number(invoice.status)],
      statusCode: Number(invoice.status),
      riskScore: Number(invoice.riskScore),
      repaymentAmount: this.web3.utils.fromWei(invoice.repaymentAmount.toString(), 'ether'),
      title: invoice.title,
      fundedAmount: this.web3.utils.fromWei(invoice.fundedAmount.toString(), 'ether'),
      tokenURI: invoice.tokenURI
    };
  }

  /**
   * Format array of invoices
   */
  formatInvoices(invoices) {
    return invoices.map(invoice => this.formatInvoice(invoice));
  }

  /**
   * Convert date to Unix timestamp
   * @param {Date|string} date - Date object or date string
   */
  dateToTimestamp(date) {
    const dateObj = date instanceof Date ? date : new Date(date);
    return Math.floor(dateObj.getTime() / 1000);
  }

  /**
   * Convert Unix timestamp to Date
   * @param {number} timestamp - Unix timestamp
   */
  timestampToDate(timestamp) {
    return new Date(timestamp * 1000);
  }

  /**
   * Convert Ether to Wei
   */
  toWei(value) {
    return this.web3.utils.toWei(value.toString(), 'ether');
  }

  /**
   * Convert Wei to Ether
   */
  fromWei(value) {
    return this.web3.utils.fromWei(value.toString(), 'ether');
  }

  // ==================== EVENT LISTENERS ====================

  /**
   * Listen for InvoiceCreated events
   */
  onInvoiceCreated(callback) {
    if (!this.contract) {
      throw new Error("Contract not initialized.");
    }

    this.contract.events.InvoiceCreated({})
      .on('data', (event) => {
        callback(event.returnValues);
      })
      .on('error', console.error);
  }

  /**
   * Listen for InvoiceFunded events
   */
  onInvoiceFunded(callback) {
    if (!this.contract) {
      throw new Error("Contract not initialized.");
    }

    this.contract.events.InvoiceFunded({})
      .on('data', (event) => {
        callback(event.returnValues);
      })
      .on('error', console.error);
  }

  /**
   * Listen for InvoiceRepaid events
   */
  onInvoiceRepaid(callback) {
    if (!this.contract) {
      throw new Error("Contract not initialized.");
    }

    this.contract.events.InvoiceRepaid({})
      .on('data', (event) => {
        callback(event.returnValues);
      })
      .on('error', console.error);
  }

  /**
   * Listen for FundsClaimed events
   */
  onFundsClaimed(callback) {
    if (!this.contract) {
      throw new Error("Contract not initialized.");
    }

    this.contract.events.FundsClaimed({})
      .on('data', (event) => {
        callback(event.returnValues);
      })
      .on('error', console.error);
  }

  async getInvoicesForManualReview() {
    const allInvoices = await this.getAllInvoices();
    return allInvoices.filter(invoice => invoice.status === 'ManualReview');
  }

  async getActiveInvoices() {
    const allInvoices = await this.getAllInvoices();
    return allInvoices.filter(invoice => invoice.status === 'Listed');
  }

  async getOwner() {
    if (!this.contract) {
      throw new Error("Contract not initialized.");
    }
    const owner = await this.contract.methods.owner().call();
    console.log("owner", owner)
    return owner;
  }

}

export default new Web3Service();