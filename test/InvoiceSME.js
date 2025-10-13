const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

// We use a fixture to set up the same state for each test, which is faster and cleaner.
async function deployInvoiceSMEFixture() {
    // Get signers to represent different roles
    const [owner, seller, investor1, investor2, verifier] = await ethers.getSigners();

    // Deploy the Mock PYUSD Token
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const pyusdToken = await MockERC20.deploy();
    await pyusdToken.waitForDeployment();

    // Deploy the main InvoiceSME contract
    const InvoiceSME = await ethers.getContractFactory("InvoiceSME");
    const invoiceSME = await InvoiceSME.deploy(await pyusdToken.getAddress(), owner.address);
    await invoiceSME.waitForDeployment();

    // Pre-fund investors with mock PYUSD for testing
    const investorInitialBalance = ethers.parseUnits("10000", 18); // 10,000 PYUSD
    await pyusdToken.mint(investor1.address, investorInitialBalance);
    await pyusdToken.mint(investor2.address, investorInitialBalance);

    // Return all contracts and signers for use in tests
    return { invoiceSME, pyusdToken, owner, seller, investor1, investor2, verifier };
}

describe("InvoiceSME Contract Tests", function () {
    // Test constants
    const TOKEN_URI = "ipfs://somehash";
    const FACE_VALUE = ethers.parseUnits("1000", 18);
    const DISCOUNT_VALUE = ethers.parseUnits("950", 18); // This is the funding goal
    const DUE_DATE = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60); // 30 days from now

    describe("Deployment & Setup", function () {
        it("Should set the right owner and PYUSD token address", async function () {
            const { invoiceSME, pyusdToken, owner } = await loadFixture(deployInvoiceSMEFixture);
            expect(await invoiceSME.owner()).to.equal(owner.address);
            expect(await invoiceSME.pyusdToken()).to.equal(await pyusdToken.getAddress());
        });
    });

    describe("Seller & Invoice Management", function () {
        it("Should allow owner to add a verified seller", async function () {
            const { invoiceSME, seller } = await loadFixture(deployInvoiceSMEFixture);
            await expect(invoiceSME.addVerifiedSeller(seller.address))
                .to.emit(invoiceSME, "SellerVerified")
                .withArgs(seller.address);
            expect(await invoiceSME.verifiedSellers(seller.address)).to.be.true;
        });

        it("Should prevent non-owners from adding sellers", async function () {
            const { invoiceSME, seller } = await loadFixture(deployInvoiceSMEFixture);
            await expect(invoiceSME.connect(seller).addVerifiedSeller(seller.address)).to.be.revertedWithCustomError(
                invoiceSME,
                "OwnableUnauthorizedAccount"
            );
        });

        it("Should allow a verified seller to create an invoice", async function () {
            const { invoiceSME, seller } = await loadFixture(deployInvoiceSMEFixture);
            await invoiceSME.addVerifiedSeller(seller.address);

            await expect(
                invoiceSME.connect(seller).createInvoice(TOKEN_URI, FACE_VALUE, DISCOUNT_VALUE, DUE_DATE)
            ).to.emit(invoiceSME, "InvoiceCreated");

            const invoice = await invoiceSME.getInvoiceById(0);
            expect(invoice.seller).to.equal(seller.address);
            expect(invoice.faceValue).to.equal(FACE_VALUE);
            expect(invoice.status).to.equal(0); // Pending

            // The seller should own all the shares initially
            expect(await invoiceSME.balanceOf(seller.address, 0)).to.equal(DISCOUNT_VALUE);
        });

        it("Should prevent unverified sellers from creating invoices", async function () {
            const { invoiceSME, seller } = await loadFixture(deployInvoiceSMEFixture);
            await expect(
                invoiceSME.connect(seller).createInvoice(TOKEN_URI, FACE_VALUE, DISCOUNT_VALUE, DUE_DATE)
            ).to.be.revertedWith("Seller not verified");
        });
    });

    describe("Invoice Verification and Listing", function () {
        let fixture;
        beforeEach(async () => {
            fixture = await loadFixture(deployInvoiceSMEFixture);
            const { invoiceSME, seller } = fixture;
            await invoiceSME.addVerifiedSeller(seller.address);
            await invoiceSME.connect(seller).createInvoice(TOKEN_URI, FACE_VALUE, DISCOUNT_VALUE, DUE_DATE);
        });

        it("Should automatically list an invoice with a low risk score", async function () {
            const { invoiceSME } = fixture;
            const lowRiskScore = 30;
            await expect(invoiceSME.processVerificationResult(0, lowRiskScore))
                .to.emit(invoiceSME, "InvoiceListed")
                .withArgs(0, lowRiskScore);

            const invoice = await invoiceSME.invoices(0);
            expect(invoice.status).to.equal(2); // Listed
            expect(invoice.riskScore).to.equal(lowRiskScore);
        });

        it("Should send a high-risk invoice to manual review", async function () {
            const { invoiceSME } = fixture;
            const highRiskScore = 55;
            await expect(invoiceSME.processVerificationResult(0, highRiskScore))
                .to.emit(invoiceSME, "InvoiceNeedsManualReview")
                .withArgs(0, highRiskScore);

            const invoice = await invoiceSME.invoices(0);
            expect(invoice.status).to.equal(1); // ManualReview
        });

        it("Should allow owner to approve an invoice for listing", async function () {
            const { invoiceSME } = fixture;
            await invoiceSME.processVerificationResult(0, 55); // Send to manual review
            await expect(invoiceSME.approveForListing(0)).to.emit(invoiceSME, "InvoiceListed");

            const invoice = await invoiceSME.invoices(0);
            expect(invoice.status).to.equal(2); // Listed
        });
    });

    describe("Full Investment and Repayment Workflow", function () {
        let fixture;
        const tokenId = 0;

        // Setup the state to a "Listed" invoice before each test in this block
        beforeEach(async () => {
            fixture = await loadFixture(deployInvoiceSMEFixture);
            const { invoiceSME, seller } = fixture;
            await invoiceSME.addVerifiedSeller(seller.address);
            await invoiceSME.connect(seller).createInvoice(TOKEN_URI, FACE_VALUE, DISCOUNT_VALUE, DUE_DATE);
            await invoiceSME.processVerificationResult(tokenId, 25); // Auto-list
        });

        it("Should allow an investor to fund an invoice", async function () {
            const { invoiceSME, pyusdToken, seller, investor1 } = fixture;
            const investmentAmount = ethers.parseUnits("500", 18);

            // In a real marketplace, the seller would approve the marketplace to move their invoice tokens (ERC1155),
            // and the investor would approve the marketplace to move their payment tokens (ERC20).
            // We simulate this by having the investor approve our contract directly.
            await pyusdToken.connect(investor1).approve(await invoiceSME.getAddress(), investmentAmount);

            // Since executeInvestment is conceptual, we check its effects: PYUSD transfer and investment tracking.
            const sellerInitialBalance = await pyusdToken.balanceOf(seller.address);

            await invoiceSME.executeInvestment(investor1.address, seller.address, tokenId, investmentAmount);

            // Check that investor's PYUSD was transferred to the seller
            const sellerFinalBalance = await pyusdToken.balanceOf(seller.address);
            expect(sellerFinalBalance - sellerInitialBalance).to.equal(investmentAmount);

            // Check that the investment is tracked
            const investedInvoices = await invoiceSME.getUserInvestedInvoices(investor1.address);
            expect(investedInvoices.length).to.equal(1);
            expect(investedInvoices[0].id).to.equal(tokenId);
        });

        it("Should update invoice status to Funded when goal is met", async function () {
            const { invoiceSME, pyusdToken, seller, investor1 } = fixture;

            // To test the status change, we need to simulate the ERC1155 transfer that a real marketplace would do.
            // The check `balanceOf(seller, tokenId) == 0` depends on this.
            await invoiceSME.connect(seller).setApprovalForAll(investor1.address, true); // Seller approves investor to take tokens
            await invoiceSME.connect(investor1).safeTransferFrom(seller.address, investor1.address, tokenId, DISCOUNT_VALUE, "0x");
            
            // Now execute the payment part
            await pyusdToken.connect(investor1).approve(await invoiceSME.getAddress(), DISCOUNT_VALUE);
            await invoiceSME.executeInvestment(investor1.address, seller.address, tokenId, DISCOUNT_VALUE);

            const invoice = await invoiceSME.invoices(tokenId);
            expect(invoice.status).to.equal(3); // Funded
        });

        it("Should allow admin to mark invoice as Repaid and receive funds", async function () {
            const { invoiceSME, pyusdToken, owner, seller, investor1 } = fixture;
            
            // Step 1: Fund the invoice first
            await invoiceSME.connect(seller).setApprovalForAll(investor1.address, true);
            await invoiceSME.connect(investor1).safeTransferFrom(seller.address, investor1.address, tokenId, DISCOUNT_VALUE, "0x");
            await pyusdToken.connect(investor1).approve(await invoiceSME.getAddress(), DISCOUNT_VALUE);
            await invoiceSME.executeInvestment(investor1.address, seller.address, tokenId, DISCOUNT_VALUE);
            
            // Step 2: Owner (acting as treasury) repays the invoice
            const repaymentAmount = FACE_VALUE; // Let's say it was repaid at face value
            await pyusdToken.mint(owner.address, repaymentAmount); // Mint funds for the owner to repay
            await pyusdToken.connect(owner).approve(await invoiceSME.getAddress(), repaymentAmount);
            
            await expect(invoiceSME.repayInvoice(tokenId, repaymentAmount))
                .to.emit(invoiceSME, "InvoiceRepaid").withArgs(tokenId, repaymentAmount);

            const invoice = await invoiceSME.invoices(tokenId);
            expect(invoice.status).to.equal(4); // Repaid
            expect(await pyusdToken.balanceOf(await invoiceSME.getAddress())).to.equal(repaymentAmount);
        });

        it("Should allow investor to claim their repayment", async function () {
            const { invoiceSME, pyusdToken, owner, seller, investor1 } = fixture;

            // Step 1 & 2: Fund and Repay the invoice
            await invoiceSME.connect(seller).setApprovalForAll(investor1.address, true);
            await invoiceSME.connect(investor1).safeTransferFrom(seller.address, investor1.address, tokenId, DISCOUNT_VALUE, "0x");
            await pyusdToken.connect(investor1).approve(await invoiceSME.getAddress(), DISCOUNT_VALUE);
            await invoiceSME.executeInvestment(investor1.address, seller.address, tokenId, DISCOUNT_VALUE);
            const repaymentAmount = FACE_VALUE;
            await pyusdToken.mint(owner.address, repaymentAmount);
            await pyusdToken.connect(owner).approve(await invoiceSME.getAddress(), repaymentAmount);
            await invoiceSME.repayInvoice(tokenId, repaymentAmount);

            // Step 3: Investor claims repayment
            const investorInitialBalance = await pyusdToken.balanceOf(investor1.address);
            const expectedPayout = (DISCOUNT_VALUE * repaymentAmount) / DISCOUNT_VALUE;

            await expect(invoiceSME.connect(investor1).claimRepayment(tokenId))
                .to.emit(invoiceSME, "FundsClaimed").withArgs(tokenId, investor1.address, expectedPayout);
            
            // Check investor's balance increased by the payout amount
            const investorFinalBalance = await pyusdToken.balanceOf(investor1.address);
            expect(investorFinalBalance - investorInitialBalance).to.equal(expectedPayout);

            // Check investor's shares were burned
            expect(await invoiceSME.balanceOf(investor1.address, tokenId)).to.equal(0);
        });
    });
});