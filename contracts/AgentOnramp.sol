// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/**
 * @title AgentOnramp
 * @notice Solves the cold-start problem for new agents:
 *         - Identity binding (GitHub -> wallet)
 *         - Objective bounty completion for first reputation
 *         - Sponsor relay gating based on verified completions
 */
contract AgentOnramp is Ownable {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    IERC20 public immutable usdc;
    
    // === Identity Registry ===
    mapping(address => string) public walletToGithub;
    mapping(string => address) public githubToWallet;
    mapping(address => bool) public identityVerified;
    
    // === Bounty System ===
    struct Bounty {
        string description;
        uint256 reward;
        bool active;
        BountyType bountyType;
        bytes32 expectedProofHash; // For objective verification
    }
    
    enum BountyType {
        GITHUB_PR,      // Verify PR merged + CI passed
        CONTRACT_DEPLOY, // Verify contract deployed with specific bytecode
        DATA_HASH       // Verify submitted data matches expected hash
    }
    
    Bounty[] public bounties;
    mapping(uint256 => mapping(address => bool)) public bountyClaimed;
    mapping(address => uint256) public completedBountyCount;
    
    // === Sponsor System ===
    mapping(address => bool) public isSponsor;
    mapping(address => uint256) public sponsorBalance;
    uint256 public minBountiesForRelay = 1;
    
    // === Events ===
    event IdentityRegistered(address indexed wallet, string githubUsername);
    event IdentityVerified(address indexed wallet, string githubUsername);
    event BountyCreated(uint256 indexed bountyId, string description, uint256 reward, BountyType bountyType);
    event BountyClaimed(uint256 indexed bountyId, address indexed agent, uint256 reward);
    event SponsorDeposit(address indexed sponsor, uint256 amount);
    event SponsorRelayApproved(address indexed agent, uint256 completedBounties);
    
    constructor(address _usdc) Ownable(msg.sender) {
        usdc = IERC20(_usdc);
    }
    
    // ============ Identity Functions ============
    
    /**
     * @notice Register a GitHub username claim (agent calls this)
     * @param githubUsername The GitHub username to link
     * @param signature Signature of keccak256(githubUsername) by the wallet
     */
    function registerIdentity(string calldata githubUsername, bytes calldata signature) external {
        require(bytes(walletToGithub[msg.sender]).length == 0, "Already registered");
        require(githubToWallet[githubUsername] == address(0), "GitHub already linked");
        
        // Verify signature proves wallet controls this request
        bytes32 messageHash = keccak256(abi.encodePacked(githubUsername));
        bytes32 ethSignedHash = messageHash.toEthSignedMessageHash();
        address signer = ethSignedHash.recover(signature);
        require(signer == msg.sender, "Invalid signature");
        
        walletToGithub[msg.sender] = githubUsername;
        githubToWallet[githubUsername] = msg.sender;
        
        emit IdentityRegistered(msg.sender, githubUsername);
    }
    
    /**
     * @notice Oracle/admin verifies the GitHub identity (after checking gist)
     * @param wallet The wallet to verify
     */
    function verifyIdentity(address wallet) external onlyOwner {
        require(bytes(walletToGithub[wallet]).length > 0, "Not registered");
        identityVerified[wallet] = true;
        emit IdentityVerified(wallet, walletToGithub[wallet]);
    }
    
    // ============ Bounty Functions ============
    
    /**
     * @notice Create a new objective bounty
     */
    function createBounty(
        string calldata description,
        uint256 reward,
        BountyType bountyType,
        bytes32 expectedProofHash
    ) external onlyOwner {
        // Transfer reward to contract
        require(usdc.transferFrom(msg.sender, address(this), reward), "Transfer failed");
        
        bounties.push(Bounty({
            description: description,
            reward: reward,
            active: true,
            bountyType: bountyType,
            expectedProofHash: expectedProofHash
        }));
        
        emit BountyCreated(bounties.length - 1, description, reward, bountyType);
    }
    
    /**
     * @notice Claim a bounty by submitting proof
     * @param bountyId The bounty to claim
     * @param proof The proof data (hash must match expectedProofHash)
     */
    function claimBounty(uint256 bountyId, bytes calldata proof) external {
        require(bountyId < bounties.length, "Invalid bounty");
        Bounty storage bounty = bounties[bountyId];
        require(bounty.active, "Bounty not active");
        require(!bountyClaimed[bountyId][msg.sender], "Already claimed");
        require(identityVerified[msg.sender], "Identity not verified");
        
        // Verify proof
        bytes32 proofHash = keccak256(proof);
        require(proofHash == bounty.expectedProofHash, "Invalid proof");
        
        // Mark claimed and pay
        bountyClaimed[bountyId][msg.sender] = true;
        completedBountyCount[msg.sender]++;
        
        require(usdc.transfer(msg.sender, bounty.reward), "Transfer failed");
        
        emit BountyClaimed(bountyId, msg.sender, bounty.reward);
        
        // Check if agent now qualifies for sponsor relay
        if (completedBountyCount[msg.sender] >= minBountiesForRelay) {
            emit SponsorRelayApproved(msg.sender, completedBountyCount[msg.sender]);
        }
    }
    
    // ============ Sponsor Functions ============
    
    /**
     * @notice Check if an agent qualifies for sponsored relay
     */
    function canSponsor(address agent) external view returns (bool) {
        return completedBountyCount[agent] >= minBountiesForRelay;
    }
    
    /**
     * @notice Deposit funds as a sponsor
     */
    function sponsorDeposit(uint256 amount) external {
        require(usdc.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        sponsorBalance[msg.sender] += amount;
        isSponsor[msg.sender] = true;
        emit SponsorDeposit(msg.sender, amount);
    }
    
    // ============ View Functions ============
    
    function getBountyCount() external view returns (uint256) {
        return bounties.length;
    }
    
    function getAgentStatus(address agent) external view returns (
        string memory githubUsername,
        bool verified,
        uint256 completedBounties,
        bool eligibleForRelay
    ) {
        return (
            walletToGithub[agent],
            identityVerified[agent],
            completedBountyCount[agent],
            completedBountyCount[agent] >= minBountiesForRelay
        );
    }
    
    // ============ Admin Functions ============
    
    function setMinBountiesForRelay(uint256 _min) external onlyOwner {
        minBountiesForRelay = _min;
    }
    
    function deactivateBounty(uint256 bountyId) external onlyOwner {
        require(bountyId < bounties.length, "Invalid bounty");
        bounties[bountyId].active = false;
    }
}
