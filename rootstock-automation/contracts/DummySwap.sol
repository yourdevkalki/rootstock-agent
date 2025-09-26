// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract DummySwap {
    IERC20 public xbtc;
    IERC20 public xusdc;
    
    uint256 public xbtcReserve;
    uint256 public xusdcReserve;
    
    uint256 private constant FEE_BASIS_POINTS = 30; // 0.3% fee
    uint256 private constant BASIS_POINTS = 10000;
    
    event LiquidityAdded(address indexed provider, uint256 xbtcAmount, uint256 xusdcAmount);
    event LiquidityRemoved(address indexed provider, uint256 xbtcAmount, uint256 xusdcAmount);
    event Swap(
        address indexed user,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut
    );
    
    constructor(address _xbtc, address _xusdc) {
        xbtc = IERC20(_xbtc);
        xusdc = IERC20(_xusdc);
    }
    
    // Add initial liquidity (simplified version)
    function addLiquidity(uint256 xbtcAmount, uint256 xusdcAmount) external {
        require(xbtcAmount > 0 && xusdcAmount > 0, "Invalid amounts");
        
        require(xbtc.transferFrom(msg.sender, address(this), xbtcAmount), "xBTC transfer failed");
        require(xusdc.transferFrom(msg.sender, address(this), xusdcAmount), "xUSDC transfer failed");
        
        xbtcReserve += xbtcAmount;
        xusdcReserve += xusdcAmount;
        
        emit LiquidityAdded(msg.sender, xbtcAmount, xusdcAmount);
    }
    
    // Simple constant product formula: x * y = k
    function swapXBTCForXUSDC(uint256 xbtcAmountIn) external {
        require(xbtcAmountIn > 0, "Invalid input amount");
        require(xbtcReserve > 0 && xusdcReserve > 0, "No liquidity");
        
        // Calculate fee
        uint256 xbtcAmountInAfterFee = (xbtcAmountIn * (BASIS_POINTS - FEE_BASIS_POINTS)) / BASIS_POINTS;
        
        // Calculate output amount using constant product formula
        uint256 xusdcAmountOut = (xusdcReserve * xbtcAmountInAfterFee) / (xbtcReserve + xbtcAmountInAfterFee);
        require(xusdcAmountOut > 0, "Insufficient output amount");
        require(xusdcAmountOut < xusdcReserve, "Not enough xUSDC reserves");
        
        // Execute transfers
        require(xbtc.transferFrom(msg.sender, address(this), xbtcAmountIn), "xBTC transfer failed");
        require(xusdc.transfer(msg.sender, xusdcAmountOut), "xUSDC transfer failed");
        
        // Update reserves
        xbtcReserve += xbtcAmountIn;
        xusdcReserve -= xusdcAmountOut;
        
        emit Swap(msg.sender, address(xbtc), address(xusdc), xbtcAmountIn, xusdcAmountOut);
    }
    
    function swapXUSDCForXBTC(uint256 xusdcAmountIn) external {
        require(xusdcAmountIn > 0, "Invalid input amount");
        require(xbtcReserve > 0 && xusdcReserve > 0, "No liquidity");
        
        // Calculate fee
        uint256 xusdcAmountInAfterFee = (xusdcAmountIn * (BASIS_POINTS - FEE_BASIS_POINTS)) / BASIS_POINTS;
        
        // Calculate output amount using constant product formula
        uint256 xbtcAmountOut = (xbtcReserve * xusdcAmountInAfterFee) / (xusdcReserve + xusdcAmountInAfterFee);
        require(xbtcAmountOut > 0, "Insufficient output amount");
        require(xbtcAmountOut < xbtcReserve, "Not enough xBTC reserves");
        
        // Execute transfers
        require(xusdc.transferFrom(msg.sender, address(this), xusdcAmountIn), "xUSDC transfer failed");
        require(xbtc.transfer(msg.sender, xbtcAmountOut), "xBTC transfer failed");
        
        // Update reserves
        xusdcReserve += xusdcAmountIn;
        xbtcReserve -= xbtcAmountOut;
        
        emit Swap(msg.sender, address(xusdc), address(xbtc), xusdcAmountIn, xbtcAmountOut);
    }
    
    // Get quote for swapping xBTC to xUSDC
    function getXBTCToXUSDCQuote(uint256 xbtcAmountIn) external view returns (uint256 xusdcAmountOut) {
        if (xbtcAmountIn == 0 || xbtcReserve == 0 || xusdcReserve == 0) {
            return 0;
        }
        
        uint256 xbtcAmountInAfterFee = (xbtcAmountIn * (BASIS_POINTS - FEE_BASIS_POINTS)) / BASIS_POINTS;
        xusdcAmountOut = (xusdcReserve * xbtcAmountInAfterFee) / (xbtcReserve + xbtcAmountInAfterFee);
        
        if (xusdcAmountOut >= xusdcReserve) {
            return 0;
        }
    }
    
    // Get quote for swapping xUSDC to xBTC
    function getXUSDCToXBTCQuote(uint256 xusdcAmountIn) external view returns (uint256 xbtcAmountOut) {
        if (xusdcAmountIn == 0 || xbtcReserve == 0 || xusdcReserve == 0) {
            return 0;
        }
        
        uint256 xusdcAmountInAfterFee = (xusdcAmountIn * (BASIS_POINTS - FEE_BASIS_POINTS)) / BASIS_POINTS;
        xbtcAmountOut = (xbtcReserve * xusdcAmountInAfterFee) / (xusdcReserve + xusdcAmountInAfterFee);
        
        if (xbtcAmountOut >= xbtcReserve) {
            return 0;
        }
    }
    
    // Get current reserves
    function getReserves() external view returns (uint256, uint256) {
        return (xbtcReserve, xusdcReserve);
    }
    
    // Get current price (xBTC in terms of xUSDC)
    function getPrice() external view returns (uint256) {
        if (xbtcReserve == 0) return 0;
        return (xusdcReserve * 1e18) / xbtcReserve;
    }
}
