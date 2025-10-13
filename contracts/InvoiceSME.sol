// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Context.sol";

/**
 * @title InvoiceSME Marketplace Contract
 * @author Your Name
 * @notice A decentralized marketplace for tokenizing and trading SME invoices using the ERC-1155 standard.
 * Each invoice is represented by a unique token ID, and its shares are the supply of that token.
 */
contract InvoiceSME is ERC1155, Ownable {

    //=========== STATE VARIABLES ===========

    IERC20 public immutable pyusdToken;
    uint256 private _nextTokenId;

    // Off-chain risk threshold for automatic approval.
    uint256 public constant AUTO_APPROVAL_RISK_THRESHOLD = 40;

    enum InvoiceStatus {
        Pending,        // 0 - Submitted, awaiting off-chain risk score
        ManualReview,   // 1 - High risk, needs admin approval
        Listed,         // 2 - Approved and listed on the marketplace for funding
        Funded,         // 3 - Funding goal met, seller has been paid
        Repaid,         // 4 - Debtor has paid, funds ready for investors to claim
        Closed          // 5 - All investors have claimed their funds
    }

    struct Invoice {
        uint256 id;
        address seller;
        uint256 faceValue;
        uint256 discountValue; // The funding goal (amount investors pay)
        uint256 dueDate;
        InvoiceStatus status;
        uint256 riskScore;
        uint256 repaymentAmount; // Stored after debtor pays, includes yield
    }

    // Mappings
    mapping(uint256 => Invoice) public invoices;
    mapping(address => bool) public verifiedSellers;
    mapping(address => uint256[]) public userInvestedInvoices;


    //=========== EVENTS ===========

    event SellerVerified(address indexed seller);
    event InvoiceCreated(uint256 indexed tokenId, address indexed seller, uint256 faceValue, uint256 discountValue);
    event InvoiceNeedsManualReview(uint256 indexed tokenId, uint256 riskScore);
    event InvoiceListed(uint256 indexed tokenId, uint256 riskScore);
    event InvoiceFunded(uint256 indexed tokenId, uint256 totalFunded);
    event InvoiceRepaid(uint256 indexed tokenId, uint256 repaymentAmount);
    event FundsClaimed(uint256 indexed tokenId, address indexed investor, uint256 amountPaid);


    //=========== CONSTRUCTOR ===========

    constructor(address _pyusdAddress, address initialOwner) ERC1155("https://api.invoicesme.com/metadata/{id}.json") Ownable(initialOwner) {
        pyusdToken = IERC20(_pyusdAddress);
    }

    //=========== SELLER & INVOICE MANAGEMENT ===========

    /**
     * @notice Onboards a new seller after off-chain verification (e.g., GST check).
     * @param sellerAddress The address of the verified business.
     */
    function addVerifiedSeller(address sellerAddress) external onlyOwner {
        verifiedSellers[sellerAddress] = true;
        emit SellerVerified(sellerAddress);
    }

    /**
     * @notice Creates a new invoice, minting its fractional shares to the seller.
     * The URI should point to the encrypted invoice data on Lighthouse/IPFS.
     */
    function createInvoice(
        string memory tokenURI,
        uint256 faceValue,
        uint256 discountValue,
        uint256 dueDate
    ) external returns (uint256) {
        require(verifiedSellers[_msgSender()], "Seller not verified");
        require(discountValue < faceValue, "Discount must be less than face value");

        uint256 tokenId = _nextTokenId++;
        _setURI(tokenURI); // Set the URI for the new token ID

        invoices[tokenId] = Invoice({
            id: tokenId,
            seller: _msgSender(),
            faceValue: faceValue,
            discountValue: discountValue,
            dueDate: dueDate,
            status: InvoiceStatus.Pending,
            riskScore: 0,
            repaymentAmount: 0
        });

        // Mint the invoice shares (1 share = 1 unit of currency) to the seller.
        // The seller will then approve the marketplace to sell these on their behalf.
        _mint(_msgSender(), tokenId, discountValue, "");

        emit InvoiceCreated(tokenId, _msgSender(), faceValue, discountValue);
        return tokenId;
    }

    /**
     * @notice An off-chain service calls this to provide the risk score.
     * Based on the score, the invoice is either listed or sent for manual review.
     */
    function processVerificationResult(uint256 tokenId, uint256 riskScore) external {
        Invoice storage invoice = invoices[tokenId];
        require(invoice.status == InvoiceStatus.Pending, "Invoice not pending");
        // Potentially add role-based access for the verifier service.

        invoice.riskScore = riskScore;

        if (riskScore <= AUTO_APPROVAL_RISK_THRESHOLD) {
            invoice.status = InvoiceStatus.Listed;
            emit InvoiceListed(tokenId, riskScore);
        } else {
            invoice.status = InvoiceStatus.ManualReview;
            emit InvoiceNeedsManualReview(tokenId, riskScore);
        }
    }

    /**
     * @notice Admin function to manually list a high-risk invoice.
     */
    function approveForListing(uint256 tokenId) external onlyOwner {
        Invoice storage invoice = invoices[tokenId];
        require(invoice.status == InvoiceStatus.ManualReview, "Not under manual review");

        invoice.status = InvoiceStatus.Listed;
        emit InvoiceListed(tokenId, invoice.riskScore);
    }

    //=========== INVESTOR WORKFLOW FUNCTIONS ===========

    /**
     * @notice Called by the marketplace contract after an investor buys shares from a seller.
     * This function transfers the PYUSD from the investor to the seller and marks the invoice as funded if the goal is met.
     * NOTE: This is a conceptual function. In a real scenario, this logic would be part of a separate Marketplace/DEX contract.
     * The seller would first `approve` the marketplace to transfer their invoice tokens.
     */
    function executeInvestment(address investor, address seller, uint256 tokenId, uint256 amount) external {
        Invoice storage invoice = invoices[tokenId];
        require(invoice.status == InvoiceStatus.Listed || invoice.status == InvoiceStatus.Funded, "Invoice not available for funding");

        // Simulate payment from investor to seller
        pyusdToken.transferFrom(investor, seller, amount);

        // Track the investor's involvement
        uint256[] storage investedList = userInvestedInvoices[investor];
        bool alreadyInvested = false;
        for(uint i = 0; i < investedList.length; i++){
            if(investedList[i] == tokenId){
                alreadyInvested = true;
                break;
            }
        }
        if(!alreadyInvested){
            investedList.push(tokenId);
        }
    }

    /**
     * @dev Override _update to intercept token transfers and check funding status
     * This replaces the deprecated _afterTokenTransfer hook in newer OpenZeppelin versions
     */
    function _update(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory values
    ) internal virtual override {
        super._update(from, to, ids, values);

        // Check if any invoice is fully funded after the transfer
        for (uint i = 0; i < ids.length; i++) {
            uint256 tokenId = ids[i];
            Invoice storage invoice = invoices[tokenId];
            
            // Only check if invoice exists and is in Listed status
            if (invoice.seller != address(0) && invoice.status == InvoiceStatus.Listed) {
                // Check if seller has sold all their shares
                if (from == invoice.seller && balanceOf(invoice.seller, tokenId) == 0) {
                    invoice.status = InvoiceStatus.Funded;
                    emit InvoiceFunded(tokenId, invoice.discountValue);
                }
            }
        }
    }

    /**
     * @notice Admin function to mark an invoice as repaid after receiving off-chain funds from the debtor.
     * The repayment amount (principal + yield) is pulled into this contract.
     */
    function repayInvoice(uint256 tokenId, uint256 totalRepaymentAmount) external onlyOwner {
        Invoice storage invoice = invoices[tokenId];
        require(invoice.status == InvoiceStatus.Funded, "Invoice not funded");
        require(totalRepaymentAmount >= invoice.faceValue, "Repayment must be at least face value");

        // Admin (or a treasury contract) sends the repayment funds into this contract
        pyusdToken.transferFrom(_msgSender(), address(this), totalRepaymentAmount);

        invoice.status = InvoiceStatus.Repaid;
        invoice.repaymentAmount = totalRepaymentAmount;
        emit InvoiceRepaid(tokenId, totalRepaymentAmount);
    }

    /**
     * @notice Allows an investor to burn their invoice shares to claim their proportional share of the repayment.
     */
    function claimRepayment(uint256 tokenId) external {
        Invoice storage invoice = invoices[tokenId];
        require(invoice.status == InvoiceStatus.Repaid, "Invoice not repaid");

        uint256 investorShares = balanceOf(_msgSender(), tokenId);
        require(investorShares > 0, "No shares held for this invoice");

        // Calculate the investor's proportional payout
        uint256 payout = (investorShares * invoice.repaymentAmount) / invoice.discountValue;

        // Burn the investor's shares to prevent double claiming
        _burn(_msgSender(), tokenId, investorShares);

        // Transfer the payout to the investor
        pyusdToken.transfer(_msgSender(), payout);
        emit FundsClaimed(tokenId, _msgSender(), payout);
    }

    //=========== UTILITY FUNCTIONS ===========

    /**
     * @dev See {IERC1155-uri}.
     * This is required for OpenZeppelin's ERC1155 implementation.
     */
    function uri(uint256 tokenId) public view override returns (string memory) {
        return super.uri(tokenId);
    }

    function getAllInvoices() public view returns(Invoice[] memory) {
        Invoice[] memory allInvoices = new Invoice[](_nextTokenId);
        for(uint i=0; i < _nextTokenId; i++) {
            allInvoices[i] = invoices[i];
        }

        return allInvoices;
    }

    function getInvoiceById(uint256 invoiceId) public view returns(Invoice memory) {
        require(invoiceId < _nextTokenId, "Invalid invoice id");
        return invoices[invoiceId];
    }

    function getUsersInvoices(address user) public view returns(Invoice[] memory) {
        // Pass 1: Count the number of invoices for the user to correctly size the memory array.
        uint256 userInvoiceCount = 0;
        for(uint i=0; i < _nextTokenId; i++) {
            if (invoices[i].seller == user) {
                userInvoiceCount++;
            }
        }

        if (userInvoiceCount == 0) {
            return new Invoice[](0);
        }

        // Pass 2: Populate the correctly sized array.
        Invoice[] memory userInvoices = new Invoice[](userInvoiceCount);
        uint256 counter = 0;
        for(uint i=0; i < _nextTokenId; i++) {
            if (invoices[i].seller == user) {
                userInvoices[counter] = invoices[i];
                counter++;
            }
        }
        return userInvoices;
    }

    function getUserInvestedInvoices(address user) public view returns(Invoice[] memory) {
        uint256[] memory invoiceIdList = userInvestedInvoices[user];
        Invoice[] memory userInvoices = new Invoice[](invoiceIdList.length);

        for(uint i=0; i < invoiceIdList.length; i++) {
            userInvoices[i] = invoices[invoiceIdList[i]];
        }

        return userInvoices;
    }
}