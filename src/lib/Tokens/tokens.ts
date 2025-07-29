// Token interface
export interface Token {
  id: number
  symbol: string;
  name: string;
  balance: number;
  address?: string;
  pool:string[];
  poolId?: number[];
  img?: string; // Optional image URL for the token
}


// Token array
const tokens: Token[] = [
  { 
    id:1,
    symbol: 'ETH', 
    name: 'Ethereum', 
    balance: 0.5,
    address: '0x010Ca9Ed0D1e8ff914c268186Af412aBE4ceA7f6', // Replace with your native token address
    pool: ["AFR","USDT"],
    poolId: [1,2],
    img: "https://assets.pancakeswap.finance/web/native/1.png"
  },
  { 
    id:2,
    symbol: 'USDT', 
    name: 'USDT', 
    balance: 2,
    address: '0x25a8e2d1e9883D1909040b6B3eF2bb91feAB2e2f', // Updated with deployed address
    pool: ["ETH","AFX"],
    poolId: [2,6],
    img:'https://coin-images.coingecko.com/coins/images/39963/large/usdt.png?1724952731'
  },
   { 
    id:3,
    symbol: 'WETH', 
    name: 'Wrapped Ethereum', 
    balance: 1250,
    address: '0xC7d68ce9A8047D4bF64E6f7B79d388a11944A06E', // Updated with deployed address
    pool: [],
    poolId: [],
    img: 'https://coin-images.coingecko.com/coins/images/39810/large/weth.png?1724139790',
        
  }, 

  { 
    id:4,
    symbol: 'AFR', 
    name: 'AfriRemit', 
    balance: 1250,
    address: '0x48D2210bd4E72c741F74E6c0E8f356b2C36ebB7A', // Updated with deployed address
    pool: ["ETH"],
    poolId: [1],
    img: 'https://cdn.moralis.io/eth/0x6b3595068778dd592e39a122f4f5a5cf09c90fe2.png',
        
  },
     { 
    id:5,
    symbol: 'AFX', 
    name: 'AfriStable', 
    balance: 1250,
    address: '0x8F11F588B1Cc0Bc88687F7d07d5A529d34e5CD84', // Updated with deployed address
    pool: ["cZAR", "USDT"],
    poolId: [5,6],
    img: 'https://www.xe.com/svgs/flags/ngn.static.svg',
        
  },
   { 
    id:6,
    symbol: 'cNGN', 
    name: 'Crypto Naira', 
    balance: 1250,
    address: '0x7dd1aD415F58D91BbF76BcC2640cc6FdD44Aa94b', // Updated with deployed address
    pool: ["cZAR"],
    poolId: [3],
    img: 'https://www.xe.com/svgs/flags/ngn.static.svg',
        
  },
   { 
    id:7,
    symbol: 'cZAR', 
    name: 'Crypto South African Rand', 
    balance: 1250,
    address: '0xaC56E37f70407f279e27cFcf2E31EdCa888EaEe4', // Updated with deployed address
    pool: ["cNGN","AFX"],
    poolId: [3,5],
    img: 'https://www.xe.com/svgs/flags/zar.static.svg',
        
  },
   { 
    id:8,
    symbol: 'cGHS', 
    name: 'Crypto Ghanaian Cedi', 
    balance: 1250,
    address: '0x48686EA995462d611F4DA0d65f90B21a30F259A5', // Updated with deployed address
    pool: ["cKES"],
    poolId: [4],
    
    img: 'https://www.xe.com/svgs/flags/ghs.static.svg',
        
  },
   { 
    id:9,
    symbol: 'cKES', 
    name: 'Crypto Kenyan Shilling', 
    balance: 1250,
    address: '0xC0c182d9895882C61C1fC1DF20F858e5E29a4f71', // Updated with deployed address
    pool: ["cGHS"],
    poolId: [4],
    img: 'https://www.xe.com/svgs/flags/kes.static.svg',
        
  },
];

export default tokens;


// Updated addresses array for reference:
/*
USDT: 0x25a8e2d1e9883D1909040b6B3eF2bb91feAB2e2f
WETH: 0xC7d68ce9A8047D4bF64E6f7B79d388a11944A06E
AFR:  0x48D2210bd4E72c741F74E6c0E8f356b2C36ebB7A
AFX:  0x8F11F588B1Cc0Bc88687F7d07d5A529d34e5CD84
cNGN: 0x7dd1aD415F58D91BbF76BcC2640cc6FdD44Aa94b
cZAR: 0xaC56E37f70407f279e27cFcf2E31EdCa888EaEe4
cGHS: 0x48686EA995462d611F4DA0d65f90B21a30F259A5
cKES: 0xC0c182d9895882C61C1fC1DF20F858e5E29a4f71
*/