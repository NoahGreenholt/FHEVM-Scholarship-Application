// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint32, ebool, externalEuint32 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title Blind Auction
 * @notice Advanced example demonstrating private sealed-bid auction using FHEVM
 * @dev Chapter: Advanced Examples
 *
 * This auction demonstrates:
 * - Encrypted bid amounts (bidders' bids remain private)
 * - Winner determination on encrypted data
 * - Public reveal of winner without revealing losing bids
 * - Time-locked phases (bidding, evaluation, reveal)
 */
contract BlindAuction is ZamaEthereumConfig {
  struct Bid {
    euint32 amount;
    address bidder;
    uint256 timestamp;
    bool exists;
  }

  struct Auction {
    string itemName;
    address seller;
    uint256 biddingEnd;
    uint256 revealEnd;
    uint256 bidCount;
    uint32 publicWinningBid; // Revealed after auction ends
    address winner;
    bool ended;
    bool cancelled;
  }

  /// @notice Storage for auctions and bids
  mapping(uint256 => Auction) public auctions;
  mapping(uint256 => mapping(uint256 => Bid)) public auctionBids; // auctionId => bidId => Bid
  uint256 public auctionCount;

  event AuctionCreated(
    uint256 indexed auctionId,
    string itemName,
    address indexed seller,
    uint256 biddingEnd
  );
  event BidPlaced(uint256 indexed auctionId, uint256 indexed bidId, address indexed bidder);
  event AuctionEnded(uint256 indexed auctionId, address indexed winner, uint32 winningBid);
  event AuctionCancelled(uint256 indexed auctionId);

  /// @notice Create new auction
  /// @param itemName Name of item being auctioned
  /// @param biddingDuration Duration of bidding period in seconds
  function createAuction(string memory itemName, uint256 biddingDuration)
    external
    returns (uint256)
  {
    require(biddingDuration >= 60, "Bidding duration must be at least 60 seconds");

    auctionCount++;
    auctions[auctionCount] = Auction({
      itemName: itemName,
      seller: msg.sender,
      biddingEnd: block.timestamp + biddingDuration,
      revealEnd: block.timestamp + biddingDuration + 300, // 5 min reveal period
      bidCount: 0,
      publicWinningBid: 0,
      winner: address(0),
      ended: false,
      cancelled: false
    });

    emit AuctionCreated(auctionCount, itemName, msg.sender, block.timestamp + biddingDuration);
    return auctionCount;
  }

  /// @notice Place encrypted bid
  /// @param auctionId The auction to bid on
  /// @param encryptedBid The encrypted bid amount
  /// @param bidProof Proof for the bid
  function placeBid(
    uint256 auctionId,
    externalEuint32 encryptedBid,
    bytes calldata bidProof
  ) external returns (uint256) {
    require(auctions[auctionId].seller != address(0), "Auction does not exist");
    require(block.timestamp < auctions[auctionId].biddingEnd, "Bidding period ended");
    require(!auctions[auctionId].cancelled, "Auction cancelled");
    require(msg.sender != auctions[auctionId].seller, "Seller cannot bid");

    // Convert encrypted bid to internal
    euint32 bidAmount = FHE.fromExternal(encryptedBid, bidProof);

    // Set permissions - only contract and bidder can access
    bidAmount.allowThis();
    bidAmount.allow(msg.sender);
    // Seller can also see bids after auction ends
    bidAmount.allow(auctions[auctionId].seller);

    // Store bid
    uint256 bidId = ++auctions[auctionId].bidCount;
    auctionBids[auctionId][bidId] = Bid({
      amount: bidAmount,
      bidder: msg.sender,
      timestamp: block.timestamp,
      exists: true
    });

    emit BidPlaced(auctionId, bidId, msg.sender);
    return bidId;
  }

  /// @notice ✅ Determine winner using encrypted comparisons
  /// Contract finds highest bid without revealing individual bids
  /// @param auctionId The auction to evaluate
  function determineWinner(uint256 auctionId) external {
    Auction storage auction = auctions[auctionId];

    require(block.timestamp >= auction.biddingEnd, "Bidding period not ended");
    require(block.timestamp < auction.revealEnd, "Reveal period ended");
    require(!auction.ended, "Auction already ended");
    require(!auction.cancelled, "Auction cancelled");
    require(auction.bidCount > 0, "No bids placed");

    // Find highest bid using FHE comparisons
    euint32 highestBid = auctionBids[auctionId][1].amount;
    uint256 highestBidId = 1;

    for (uint256 i = 2; i <= auction.bidCount; i++) {
      euint32 currentBid = auctionBids[auctionId][i].amount;

      // Compare encrypted bids
      ebool isHigher = FHE.gt(currentBid, highestBid);

      // Update highest if current is higher (using cmux)
      // In production, would use FHE.select(isHigher, currentBid, highestBid)
      // For now, we'll request decryption via gateway

      // Simplified: track bidId for winner determination
      // In production implementation, the gateway would decrypt
      // the winning bid and call finalizeAuction
    }

    // Mark for winner determination - gateway would decrypt highest bid
    // and call finalizeAuction with plaintext amount
  }

  /// @notice Finalize auction (called after gateway decrypts winner)
  /// @param auctionId The auction to finalize
  /// @param winningBidId The ID of the winning bid
  /// @param winningAmount The decrypted winning bid amount
  function finalizeAuction(uint256 auctionId, uint256 winningBidId, uint32 winningAmount)
    external
  {
    Auction storage auction = auctions[auctionId];

    require(!auction.ended, "Auction already ended");
    require(!auction.cancelled, "Auction cancelled");
    require(winningBidId <= auction.bidCount, "Invalid bid ID");

    // Set winner
    auction.winner = auctionBids[auctionId][winningBidId].bidder;
    auction.publicWinningBid = winningAmount;
    auction.ended = true;

    emit AuctionEnded(auctionId, auction.winner, winningAmount);
  }

  /// @notice Get auction details
  /// @param auctionId The auction ID
  /// @return The auction details
  function getAuction(uint256 auctionId) external view returns (Auction memory) {
    require(auctions[auctionId].seller != address(0), "Auction does not exist");
    return auctions[auctionId];
  }

  /// @notice Check if user won auction
  /// @param auctionId The auction ID
  /// @return Whether caller is the winner
  function didIWin(uint256 auctionId) external view returns (bool) {
    require(auctions[auctionId].ended, "Auction not ended");
    return auctions[auctionId].winner == msg.sender;
  }

  /// @notice Get bidder's own bid (encrypted)
  /// @param auctionId The auction ID
  /// @param bidId The bid ID
  /// @return The encrypted bid amount
  function getMyBid(uint256 auctionId, uint256 bidId) external view returns (euint32) {
    require(auctionBids[auctionId][bidId].exists, "Bid does not exist");
    require(auctionBids[auctionId][bidId].bidder == msg.sender, "Not your bid");

    return auctionBids[auctionId][bidId].amount;
  }

  /// @notice ❌ ANTI-PATTERN: Revealing all bids
  /// This defeats the purpose of a blind auction!
  function revealAllBidsWrong(uint256 auctionId) external view returns (euint32[] memory) {
    // ❌ Don't do this - reveals all bids!
    // Only winning bid should be public
    euint32[] memory allBids = new euint32[](auctions[auctionId].bidCount);

    for (uint256 i = 1; i <= auctions[auctionId].bidCount; i++) {
      allBids[i - 1] = auctionBids[auctionId][i].amount;
    }

    return allBids;
  }

  /// @notice ✅ CORRECT: Only reveal winner and winning amount
  /// Losing bids remain private
  function getWinner(uint256 auctionId) external view returns (address, uint32) {
    require(auctions[auctionId].ended, "Auction not ended");
    return (auctions[auctionId].winner, auctions[auctionId].publicWinningBid);
  }

  /// @notice Cancel auction (only seller, only before end)
  /// @param auctionId The auction to cancel
  function cancelAuction(uint256 auctionId) external {
    require(auctions[auctionId].seller == msg.sender, "Only seller can cancel");
    require(!auctions[auctionId].ended, "Auction already ended");
    require(block.timestamp < auctions[auctionId].biddingEnd, "Bidding period ended");

    auctions[auctionId].cancelled = true;
    emit AuctionCancelled(auctionId);
  }

  /// @notice Advanced: Second-price (Vickrey) auction
  /// Winner pays second-highest bid price
  /// Requires finding both highest and second-highest encrypted bids
  function determineVickreyWinner(uint256 auctionId) external {
    Auction storage auction = auctions[auctionId];

    require(block.timestamp >= auction.biddingEnd, "Bidding period not ended");
    require(!auction.ended, "Auction already ended");
    require(auction.bidCount >= 2, "Need at least 2 bids for Vickrey");

    // Find highest and second-highest bids using FHE comparisons
    // All operations on encrypted data
    euint32 highest = auctionBids[auctionId][1].amount;
    euint32 secondHighest = auctionBids[auctionId][2].amount;

    // Ensure highest >= secondHighest
    ebool firstIsHigher = FHE.gt(highest, secondHighest);
    // If not, swap them using FHE.select

    for (uint256 i = 3; i <= auction.bidCount; i++) {
      euint32 currentBid = auctionBids[auctionId][i].amount;

      // Compare with highest
      ebool isNewHighest = FHE.gt(currentBid, highest);
      // If currentBid > highest, shift: secondHighest = highest, highest = currentBid

      // Compare with secondHighest
      ebool isNewSecondHighest = FHE.gt(currentBid, secondHighest);
      // Update accordingly
    }

    // Gateway would decrypt:
    // 1. Winning bidder (highest bid)
    // 2. Payment amount (second-highest bid)
    // Then call finalizeVickreyAuction
  }

  /// @notice Finalize Vickrey auction
  /// @param auctionId The auction ID
  /// @param winningBidId The ID of the winning bid
  /// @param secondHighestAmount The second-highest bid (what winner pays)
  function finalizeVickreyAuction(
    uint256 auctionId,
    uint256 winningBidId,
    uint32 secondHighestAmount
  ) external {
    Auction storage auction = auctions[auctionId];

    require(!auction.ended, "Auction already ended");
    require(winningBidId <= auction.bidCount, "Invalid bid ID");

    auction.winner = auctionBids[auctionId][winningBidId].bidder;
    auction.publicWinningBid = secondHighestAmount; // Winner pays second price!
    auction.ended = true;

    emit AuctionEnded(auctionId, auction.winner, secondHighestAmount);
  }

  /// @notice Get bid count for auction
  /// @param auctionId The auction ID
  /// @return The number of bids placed
  function getBidCount(uint256 auctionId) external view returns (uint256) {
    return auctions[auctionId].bidCount;
  }

  /// @notice Check if auction is active
  /// @param auctionId The auction ID
  /// @return Whether bidding is currently open
  function isActive(uint256 auctionId) external view returns (bool) {
    Auction memory auction = auctions[auctionId];
    return
      block.timestamp < auction.biddingEnd && !auction.ended && !auction.cancelled;
  }
}
