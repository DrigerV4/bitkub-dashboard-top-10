import React, { useState, useEffect } from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import './App.css';

const App = () => {
  const [tickerData, setTickerData] = useState({});
  const [symbols, setSymbols] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [priceHistory, setPriceHistory] = useState({});

  // Cryptocurrency logos mapping
  const cryptoLogos = {
    'BTC': 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
    'ETH': 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
    'USDT': 'https://assets.coingecko.com/coins/images/325/large/Tether-logo.png',
    'BNB': 'https://s2.coinmarketcap.com/static/img/coins/64x64/1839.png',
    'XRP': 'https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png',
    'ADA': 'https://assets.coingecko.com/coins/images/975/large/cardano.png',
    'DOGE': 'https://assets.coingecko.com/coins/images/5/large/dogecoin.png',
    'SOL': 'https://assets.coingecko.com/coins/images/4128/large/solana.png',
    'AVAX': 'https://assets.coingecko.com/coins/images/12559/large/coin-round-red.png',
    'MATIC': 'https://assets.coingecko.com/coins/images/4713/large/matic-token-icon.png',
    'LINK': 'https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png',
    'DOT': 'https://assets.coingecko.com/coins/images/12171/large/polkadot.png',
    'UNI': 'https://assets.coingecko.com/coins/images/12504/large/uniswap-uni.png',
    'ATOM': 'https://assets.coingecko.com/coins/images/1481/large/cosmos_hub.png',
    'LTC': 'https://assets.coingecko.com/coins/images/2/large/litecoin.png',
    'TRX': 'https://assets.coingecko.com/coins/images/1094/large/tron-logo.png',
    'XLM': 'https://assets.coingecko.com/coins/images/100/large/Stellar_symbol_black_RGB.png',
    'NEAR': 'https://assets.coingecko.com/coins/images/10365/large/near.jpg',
    'SUI': 'https://s2.coinmarketcap.com/static/img/coins/64x64/25080.png',
    'AAVE': 'https://assets.coingecko.com/coins/images/12645/large/AAVE.png'
  };

  // Fetch symbols and ticker data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch symbols
        const symbolsResponse = await fetch('https://api.bitkub.com/api/market/symbols');
        const symbolsData = await symbolsResponse.json();
        
        if (symbolsData.error === 0) {
          const thbSymbols = symbolsData.result.filter(item => 
            item.symbol.includes('THB_') && !item.symbol.includes('_THB')
          );
          setSymbols(thbSymbols);
        }

        // Fetch ticker data
        const tickerResponse = await fetch('https://api.bitkub.com/api/market/ticker');
        const tickerResult = await tickerResponse.json();
        
        setTickerData(tickerResult);
        updatePriceHistory(tickerResult);
        setLoading(false);
        setLastUpdate(new Date());

      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, []);

  const updatePriceHistory = (newTickerData) => {
    const timestamp = Date.now();
    setPriceHistory(prev => {
      const updated = { ...prev };
      Object.keys(newTickerData).forEach(symbol => {
        if (!updated[symbol]) {
          updated[symbol] = [];
        }
        updated[symbol].push({
          time: timestamp,
          price: parseFloat(newTickerData[symbol].last || 0)
        });
        // Keep only last 20 data points
        if (updated[symbol].length > 20) {
          updated[symbol] = updated[symbol].slice(-20);
        }
      });
      return updated;
    });
  };

  const getCoinSymbol = (fullSymbol) => {
    if (fullSymbol.startsWith('THB_')) {
      return fullSymbol.replace('THB_', '');
    }
    return fullSymbol.replace('_THB', '');
  };

  const formatPrice = (price) => {
    const numPrice = parseFloat(price);
    if (numPrice >= 1000000) {
      return `฿${(numPrice / 1000000).toFixed(2)}M`;
    } else if (numPrice >= 1000) {
      return `฿${(numPrice / 1000).toFixed(2)}K`;
    } else if (numPrice >= 1) {
      return `฿${numPrice.toFixed(2)}`;
    } else {
      return `฿${numPrice.toFixed(6)}`;
    }
  };

  const formatVolume = (volume) => {
    const numVolume = parseFloat(volume);
    if (numVolume >= 1000000000) {
      return `฿${(numVolume / 1000000000).toFixed(2)}B`;
    } else if (numVolume >= 1000000) {
      return `฿${(numVolume / 1000000).toFixed(2)}M`;
    } else if (numVolume >= 1000) {
      return `฿${(numVolume / 1000).toFixed(2)}K`;
    }
    return `฿${numVolume.toFixed(2)}`;
  };

  const getTopByVolume = () => {
    return Object.entries(tickerData)
      .filter(([symbol, data]) => symbol.includes('THB_') && data.quoteVolume)
      .sort((a, b) => parseFloat(b[1].quoteVolume) - parseFloat(a[1].quoteVolume))
      .slice(0, 10);
  };

  const getTopGainers = () => {
    return Object.entries(tickerData)
      .filter(([symbol, data]) => symbol.includes('THB_') && data.percentChange)
      .sort((a, b) => parseFloat(b[1].percentChange) - parseFloat(a[1].percentChange))
      .slice(0, 10);
  };

  const getTopLosers = () => {
    return Object.entries(tickerData)
      .filter(([symbol, data]) => symbol.includes('THB_') && data.percentChange)
      .sort((a, b) => parseFloat(a[1].percentChange) - parseFloat(b[1].percentChange))
      .slice(0, 10);
  };

  const CoinCard = ({ symbol, data, showVolume = false }) => {
    const coinSymbol = getCoinSymbol(symbol);
    const logoUrl = cryptoLogos[coinSymbol] || 'https://via.placeholder.com/48x48/333/fff?text=' + coinSymbol;
    const change = parseFloat(data.percentChange || 0);
    const isPositive = change >= 0;
    const historyData = priceHistory[symbol] || [];

    return (
      <div className="bg-gray-800 rounded-xl p-6 card-hover border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <img 
              src={logoUrl} 
              alt={coinSymbol}
              className="w-12 h-12 rounded-full"
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/48x48/333/fff?text=' + coinSymbol;
              }}
            />
            <div>
              <h3 className="text-white font-semibold text-lg">{coinSymbol}</h3>
              <p className="text-gray-400 text-sm">{symbol}</p>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-2xl font-bold text-white mb-1">
            {formatPrice(data.last)}
          </p>
          <p className={`text-sm font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            {isPositive ? '+' : ''}{change.toFixed(2)}%
          </p>
        </div>

        {showVolume && (
          <div className="mb-4">
            <p className="text-gray-400 text-sm">24h Volume</p>
            <p className="text-white font-semibold">
              {formatVolume(data.quoteVolume)}
            </p>
          </div>
        )}

        <div className="mb-4">
          <div className="text-gray-400 text-xs mb-2">Price Chart</div>
          <div className="h-16">
            {historyData.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historyData}>
                  <Line 
                    type="monotone" 
                    dataKey="price" 
                    stroke={isPositive ? "#10b981" : "#ef4444"}
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 text-xs">
                Loading chart data...
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-400">High 24h</p>
            <p className="text-white font-medium">{formatPrice(data.high24hr)}</p>
          </div>
          <div>
            <p className="text-gray-400">Low 24h</p>
            <p className="text-white font-medium">{formatPrice(data.low24hr)}</p>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-bitkub-green mx-auto mb-4"></div>
          <p className="text-white text-xl">Loading Bitkub Real-time Data...</p>
        </div>
      </div>
    );
  }

  const topVolume = getTopByVolume();
  const topGainers = getTopGainers();
  const topLosers = getTopLosers();

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img 
                src="/bitkub-logo.png" 
                alt="Bitkub" 
                className="h-12 w-auto"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
              <div>
                <h1 className="text-3xl font-bold text-bitkub-green">
                  Bitkub Real-time Dashboard
                </h1>
                <p className="text-gray-400">
                  Live cryptocurrency prices and market data
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">Last Updated</p>
              <p className="text-white font-medium">
                {lastUpdate.toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-12">
        
        {/* Top 10 by Volume */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <span className="bg-blue-600 w-3 h-8 rounded mr-3"></span>
            Top 10 by Volume
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {topVolume.map(([symbol, data]) => (
              <CoinCard 
                key={symbol} 
                symbol={symbol} 
                data={data} 
                showVolume={true}
              />
            ))}
          </div>
        </section>

        {/* Top 10 Gainers */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <span className="bg-green-600 w-3 h-8 rounded mr-3"></span>
            Top 10 Gainers
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {topGainers.map(([symbol, data]) => (
              <CoinCard 
                key={symbol} 
                symbol={symbol} 
                data={data}
              />
            ))}
          </div>
        </section>

        {/* Top 10 Losers */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <span className="bg-red-600 w-3 h-8 rounded mr-3"></span>
            Top 10 Losers
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {topLosers.map(([symbol, data]) => (
              <CoinCard 
                key={symbol} 
                symbol={symbol} 
                data={data}
              />
            ))}
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 border-t border-gray-700 mt-16">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="text-center text-gray-400">
            <p className="mb-2">
              Cryptocurrency and digital tokens involve high risks; investors may lose all investment money and should study information carefully and make investments according to their own risk profile.
            </p>
            <p className="text-sm">
              Powered by Bitkub API • Updates every 10 seconds • Last update: {lastUpdate.toLocaleString()}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;