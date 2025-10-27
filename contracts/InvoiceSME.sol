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

    uint256 public constant AUTO_APPROVAL_RISK_THRESHOLD = 40;

    enum InvoiceStatus {
        Pending, ManualReview, Listed, Funded, Repaid, Closed
    }

    struct Invoice {
        string title;
        uint256 id;
        address seller;
        uint256 faceValue;
        uint256 discountValue;
        uint256 dueDate;
        InvoiceStatus status;
        uint256 riskScore;
        uint256 repaymentAmount;
        uint256 fundedAmount;
        string tokenURI; // <-- ADDED: To store the unique URI for each invoice
    }

    // Mappings
    mapping(uint256 => Invoice) public invoices;
    mapping(address => bool) public verifiedSellers;
    mapping(address => uint256[]) public userInvestedInvoices;


    //=========== EVENTS ===========

    event SellerVerified(address indexed seller);
    event InvoiceCreated(uint256 indexed tokenId, address indexed seller, uint256 faceValue, uint256 discountValue, string tokenURI);
    event InvoiceNeedsManualReview(uint256 indexed tokenId, uint256 riskScore);
    event InvoiceListed(uint256 indexed tokenId, uint256 riskScore);
    event InvestmentMade(uint256 indexed tokenId, address indexed investor, uint256 amount);
    event InvoiceFunded(uint256 indexed tokenId, uint256 totalFunded);
    event InvoiceRepaid(uint256 indexed tokenId, uint256 repaymentAmount);
    event FundsClaimed(uint256 indexed tokenId, address indexed investor, uint256 amountPaid);


    //=========== CONSTRUCTOR ===========

    constructor(address _pyusdAddress, address initialOwner) ERC1155("") Ownable(initialOwner) { // Base URI is now empty
        pyusdToken = IERC20(_pyusdAddress);
    }

    //=========== SELLER & INVOICE MANAGEMENT ===========

    function addVerifiedSeller(address sellerAddress) external onlyOwner {
        verifiedSellers[sellerAddress] = true;
        emit SellerVerified(sellerAddress);
    }

    function setApprovalForAll(address operator, bool approved) public virtual override {
        super.setApprovalForAll(operator, approved);
    }

    function createInvoice(
        uint256 faceValue,
        uint256 discountValue,
        uint256 dueDate,
        string memory title,
        string memory tokenURI // <-- RE-ADDED: Parameter is back
    ) external returns (uint256) {
        require(verifiedSellers[_msgSender()], "Seller not verified");
        require(discountValue < faceValue, "Discount must be less than face value");

        uint256 tokenId = _nextTokenId++;

        invoices[tokenId] = Invoice({
            title: title,
            id: tokenId,
            seller: _msgSender(),
            faceValue: faceValue,
            discountValue: discountValue,
            dueDate: dueDate,
            status: InvoiceStatus.Pending,
            riskScore: 0,
            repaymentAmount: 0,
            fundedAmount: 0,
            tokenURI: tokenURI // <-- ADDED: URI is saved to the struct
        });

        _mint(_msgSender(), tokenId, discountValue, "");

        emit InvoiceCreated(tokenId, _msgSender(), faceValue, discountValue, tokenURI);
        return tokenId;
    }

    function processVerificationResult(uint256 tokenId, uint256 riskScore) external {
        Invoice storage invoice = invoices[tokenId];
        require(invoice.status == InvoiceStatus.Pending, "Invoice not pending");

        invoice.riskScore = riskScore;

        if (riskScore <= AUTO_APPROVAL_RISK_THRESHOLD) {
            invoice.status = InvoiceStatus.Listed;
            emit InvoiceListed(tokenId, riskScore);
        } else {
            invoice.status = InvoiceStatus.ManualReview;
            emit InvoiceNeedsManualReview(tokenId, riskScore);
        }
    }

    function approveForListing(uint256 tokenId) external onlyOwner {
        Invoice storage invoice = invoices[tokenId];
        require(invoice.status == InvoiceStatus.ManualReview, "Not under manual review");

        invoice.status = InvoiceStatus.Listed;
        emit InvoiceListed(tokenId, invoice.riskScore);
    }

    //=========== INVESTOR WORKFLOW FUNCTIONS ===========

    function executeInvestment(uint256 tokenId, uint256 amount) external {
        Invoice storage invoice = invoices[tokenId];
        address seller = invoice.seller;
        address investor = _msgSender();

        require(invoice.status == InvoiceStatus.Listed, "Invoice not available for funding");
        require(invoice.fundedAmount + amount <= invoice.discountValue, "Investment exceeds funding goal");

        pyusdToken.transferFrom(investor, seller, amount);
        safeTransferFrom(seller, investor, tokenId, amount, "");
        invoice.fundedAmount += amount;

        _trackInvestor(investor, tokenId);
        emit InvestmentMade(tokenId, investor, amount);

        if (invoice.fundedAmount == invoice.discountValue) {
            invoice.status = InvoiceStatus.Funded;
            emit InvoiceFunded(tokenId, invoice.fundedAmount);
        }
    }

    function repayInvoice(uint256 tokenId, uint256 totalRepaymentAmount) external onlyOwner {
        Invoice storage invoice = invoices[tokenId];
        require(invoice.status == InvoiceStatus.Funded, "Invoice not funded");
        require(totalRepaymentAmount >= invoice.faceValue, "Repayment must be at least face value");

        pyusdToken.transferFrom(_msgSender(), address(this), totalRepaymentAmount);
        invoice.status = InvoiceStatus.Repaid;
        invoice.repaymentAmount = totalRepaymentAmount;
        emit InvoiceRepaid(tokenId, totalRepaymentAmount);
    }

    function claimRepayment(uint256 tokenId) external {
        Invoice storage invoice = invoices[tokenId];
        require(invoice.status == InvoiceStatus.Repaid, "Invoice not repaid");

        uint256 investorShares = balanceOf(_msgSender(), tokenId);
        require(investorShares > 0, "No shares held for this invoice");

        uint256 payout = (investorShares * invoice.repaymentAmount) / invoice.discountValue;
        _burn(_msgSender(), tokenId, investorShares);
        pyusdToken.transfer(_msgSender(), payout);
        emit FundsClaimed(tokenId, _msgSender(), payout);
    }

    //=========== UTILITY & VIEW FUNCTIONS ===========

    /**
     * @dev OVERRIDDEN: Returns the unique URI for each token.
     */
    function uri(uint256 tokenId) public view override returns (string memory) {
        require(invoices[tokenId].id == tokenId, "URI: nonexistent token");
        return invoices[tokenId].tokenURI;
    }

    function _trackInvestor(address investor, uint256 tokenId) internal {
        uint256[] storage investedList = userInvestedInvoices[investor];
        for(uint i = 0; i < investedList.length; i++){
            if(investedList[i] == tokenId){
                return;
            }
        }
        investedList.push(tokenId);
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
        uint256 userInvoiceCount = 0;
        for(uint i=0; i < _nextTokenId; i++) {
            if (invoices[i].seller == user) {
                userInvoiceCount++;
            }
        }

        if (userInvoiceCount == 0) {
            return new Invoice[](0);
        }

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
        uint256[] storage invoiceIdList = userInvestedInvoices[user];
        Invoice[] memory userInvoices = new Invoice[](invoiceIdList.length);

        for(uint i=0; i < invoiceIdList.length; i++) {
            userInvoices[i] = invoices[invoiceIdList[i]];
        }

        return userInvoices;
    }
}