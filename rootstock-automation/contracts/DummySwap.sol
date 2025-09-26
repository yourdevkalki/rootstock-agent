// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract DummySwap {
    IERC20 public xbtc;
    IERC20 public xusd;
    
    uint256 public xbtcReserve;
    uint256 public xusdReserve;
    
    uint256 private constant FEE_BASIS_POINTS = 30; // 0.3% fee
    uint256 private constant BASIS_POINTS = 10000;
    
    event LiquidityAdded(address indexed provider, uint256 xbtcAmount, uint256 xusdAmount);
    event LiquidityRemoved(address indexed provider, uint256 xbtcAmount, uint256 xusdAmount);
    event Swap(
        address indexed user,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut
    );
    
    constructor(address _xbtc, address _xusd) {
        xbtc = IERC20(_xbtc);
        xusd = IERC20(_xusd);
    }
    
    // Add initial liquidity (simplified version)
    function addLiquidity(uint256 xbtcAmount, uint256 xusdAmount) external {
        require(xbtcAmount > 0 && xusdAmount > 0, "Invalid amounts");
        
        require(xbtc.transferFrom(msg.sender, address(this), xbtcAmount), "xBTC transfer failed");
        require(xusd.transferFrom(msg.sender, address(this), xusdAmount), "xUSD transfer failed");
        
        xbtcReserve += xbtcAmount;
        xusdReserve += xusdAmount;
        
        emit LiquidityAdded(msg.sender, xbtcAmount, xusdAmount);
    }
    
    // Simple constant product formula: x * y = k
    function swapXBTCForXUSD(uint256 xbtcAmountIn) external {
        require(xbtcAmountIn > 0, "Invalid input amount");
        require(xbtcReserve > 0 && xusdReserve > 0, "No liquidity");
        
        // Calculate fee
        uint256 xbtcAmountInAfterFee = (xbtcAmountIn * (BASIS_POINTS - FEE_BASIS_POINTS)) / BASIS_POINTS;
        
        // Calculate output amount using constant product formula
        uint256 xusdAmountOut = (xusdReserve * xbtcAmountInAfterFee) / (xbtcReserve + xbtcAmountInAfterFee);
        require(xusdAmountOut > 0, "Insufficient output amount");
        require(xusdAmountOut < xusdReserve, "Not enough xUSD reserves");
        
        // Execute transfers
        require(xbtc.transferFrom(msg.sender, address(this), xbtcAmountIn), "xBTC transfer failed");
        require(xusd.transfer(msg.sender, xusdAmountOut), "xUSD transfer failed");
        
        // Update reserves
        xbtcReserve += xbtcAmountIn;
        xusdReserve -= xusdAmountOut;
        
        emit Swap(msg.sender, address(xbtc), address(xusd), xbtcAmountIn, xusdAmountOut);
    }
    
    function swapXUSDForXBTC(uint256 xusdAmountIn) external {
        require(xusdAmountIn > 0, "Invalid input amount");
        require(xbtcReserve > 0 && xusdReserve > 0, "No liquidity");
        
        // Calculate fee
        uint256 xusdAmountInAfterFee = (xusdAmountIn * (BASIS_POINTS - FEE_BASIS_POINTS)) / BASIS_POINTS;
        
        // Calculate output amount using constant product formula
        uint256 xbtcAmountOut = (xbtcReserve * xusdAmountInAfterFee) / (xusdReserve + xusdAmountInAfterFee);
        require(xbtcAmountOut > 0, "Insufficient output amount");
        require(xbtcAmountOut < xbtcReserve, "Not enough xBTC reserves");
        
        // Execute transfers
        require(xusd.transferFrom(msg.sender, address(this), xusdAmountIn), "xUSD transfer failed");
        require(xbtc.transfer(msg.sender, xbtcAmountOut), "xBTC transfer failed");
        
        // Update reserves
        xusdReserve += xusdAmountIn;
        xbtcReserve -= xbtcAmountOut;
        
        emit Swap(msg.sender, address(xusd), address(xbtc), xusdAmountIn, xbtcAmountOut);
    }
    
    // Get quote for swapping xBTC to xUSD
    function getXBTCToXUSDQuote(uint256 xbtcAmountIn) external view returns (uint256 xusdAmountOut) {
        if (xbtcAmountIn == 0 || xbtcReserve == 0 || xusdReserve == 0) {
            return 0;
        }
        
        uint256 xbtcAmountInAfterFee = (xbtcAmountIn * (BASIS_POINTS - FEE_BASIS_POINTS)) / BASIS_POINTS;
        xusdAmountOut = (xusdReserve * xbtcAmountInAfterFee) / (xbtcReserve + xbtcAmountInAfterFee);
        
        if (xusdAmountOut >= xusdReserve) {
            return 0;
        }
    }
    
    // Get quote for swapping xUSD to xBTC
    function getXUSDToXBTCQuote(uint256 xusdAmountIn) external view returns (uint256 xbtcAmountOut) {
        if (xusdAmountIn == 0 || xbtcReserve == 0 || xusdReserve == 0) {
            return 0;
        }
        
        uint256 xusdAmountInAfterFee = (xusdAmountIn * (BASIS_POINTS - FEE_BASIS_POINTS)) / BASIS_POINTS;
        xbtcAmountOut = (xbtcReserve * xusdAmountInAfterFee) / (xusdReserve + xusdAmountInAfterFee);
        
        if (xbtcAmountOut >= xbtcReserve) {
            return 0;
        }
    }
    
    // Get current reserves
    function getReserves() external view returns (uint256, uint256) {
        return (xbtcReserve, xusdReserve);
    }
    
    // Get current price (xBTC in terms of xUSD)
    function getPrice() external view returns (uint256) {
        if (xbtcReserve == 0) return 0;
        return (xusdReserve * 1e18) / xbtcReserve;
    }
}
