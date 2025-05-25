import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import './stock.css';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Stock options data
const STOCK_OPTIONS = [
  { name: 'Apple Inc.', symbol: 'AAPL' },
  { name: 'Microsoft Corporation', symbol: 'MSFT' },
  { name: 'Amazon.com Inc.', symbol: 'AMZN' },
  { name: 'Google LLC', symbol: 'GOOGL' },
  { name: 'Tesla Inc.', symbol: 'TSLA' },
];

// Twelve Data API key
const API_KEY = '8c606ff945e6430ebf3098175a55d256';

const StockControls = () => {
  const [selectedStock, setSelectedStock] = useState('');
  const [interval, setInterval] = useState('5min');
  const [loading, setLoading] = useState(false);
  const [stockData, setStockData] = useState(null);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchStockPrices = async () => {
    if (!selectedStock || !interval) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get('https://api.twelvedata.com/time_series', {
        params: {
          symbol: selectedStock,
          interval: interval,
          apikey: API_KEY,
          outputsize: 30
        }
      });

      if (response.data.status === 'error') {
        throw new Error(response.data.message);
      }

      const timeSeriesData = response.data.values;
      const labels = timeSeriesData.map(item => item.datetime).reverse();
      const prices = timeSeriesData.map(item => parseFloat(item.close)).reverse();
      const volumes = timeSeriesData.map(item => parseFloat(item.volume)).reverse();

      setStockData({
        labels,
        datasets: [
          {
            label: `${selectedStock} Price`,
            data: prices,
            borderColor: '#00ff9d',
            backgroundColor: 'rgba(0, 255, 157, 0.1)',
            borderWidth: 2,
            pointRadius: 3,
            pointBackgroundColor: '#5ac8fa',
            pointBorderColor: '#5ac8fa',
            pointHoverRadius: 6,
            pointHoverBackgroundColor: '#00ff9d',
            pointHoverBorderColor: '#00ff9d',
            tension: 0.4,
            fill: true
          },
          {
            label: 'Volume',
            data: volumes,
            borderColor: '#ff3d3d',
            backgroundColor: 'rgba(255, 61, 61, 0.1)',
            borderWidth: 2,
            pointRadius: 3,
            pointBackgroundColor: '#5ac8fa',
            pointBorderColor: '#5ac8fa',
            pointHoverRadius: 6,
            pointHoverBackgroundColor: '#00ff9d',
            pointHoverBorderColor: '#00ff9d',
            tension: 0.4,
            fill: true,
            yAxisID: 'volume'
          }
        ]
      });
      setLastUpdate(new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Error fetching stock prices:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Set up real-time updates
  useEffect(() => {
    let intervalId;
    if (selectedStock) {
      // Initial fetch
      fetchStockPrices();
      
      // Set up interval for updates
      intervalId = setInterval(() => {
        fetchStockPrices();
      }, 60000); // Update every minute
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [selectedStock, interval]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: true,
        labels: {
          color: '#00ff9d',
          font: {
            family: "'Share Tech Mono', monospace"
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#00ff9d',
        bodyColor: '#00ff9d',
        borderColor: '#00ff9d',
        borderWidth: 1,
        padding: 10,
        font: {
          family: "'Share Tech Mono', monospace"
        },
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
              }).format(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(0, 255, 157, 0.1)'
        },
        ticks: {
          color: '#00ff9d',
          font: {
            family: "'Share Tech Mono', monospace"
          }
        }
      },
      y: {
        grid: {
          color: 'rgba(0, 255, 157, 0.1)'
        },
        ticks: {
          color: '#00ff9d',
          font: {
            family: "'Share Tech Mono', monospace"
          },
          callback: function(value) {
            return '$' + value.toLocaleString();
          }
        }
      },
      volume: {
        position: 'right',
        grid: {
          color: 'rgba(255, 61, 61, 0.1)'
        },
        ticks: {
          color: '#ff3d3d',
          font: {
            family: "'Share Tech Mono', monospace"
          }
        }
      }
    },
    animation: {
      duration: 1000, // Animation duration in milliseconds
      easing: 'easeInOutQuart', // Easing function
      // Animations for drawing lines and points
      modes: {
        "" : { // Default animation mode
          animation: {
            duration: 1000,
            easing: 'easeInOutQuart'
          }
        },
        resize: {
          duration: 0 // No animation on resize
        }
      },
      // Specific animation for line elements
      line: {
        duration: 1000,
        easing: 'easeInOutQuart'
      },
      // Specific animation for point elements
      point: {
        duration: 1000,
        easing: 'easeInOutQuart'
      }
    }
  };

  return (
    <div className="app-container">
      <h1 className="app-title">Stock Analyzer</h1>
      <div className="controls-row">
        <div className="control-item">
          <label className="label">Choose Stock:</label>
          <select
            className="select-input"
            value={selectedStock}
            onChange={(e) => setSelectedStock(e.target.value)}
          >
            <option value="">-- Select --</option>
            {STOCK_OPTIONS.map(({ name, symbol }) => (
              <option key={symbol} value={symbol}>
                {name} ({symbol})
              </option>
            ))}
          </select>
        </div>

        <div className="control-item">
          <label className="label">Interval:</label>
          <select
            className="select-input"
            value={interval}
            onChange={(e) => setInterval(e.target.value)}
          >
            <option value="5min">5 minutes</option>
            <option value="15min">15 minutes</option>
            <option value="30min">30 minutes</option>
            <option value="1h">1 hour</option>
          </select>
        </div>

        <div className="control-item">
          <button
            className="btn-primary"
            onClick={fetchStockPrices}
            disabled={!selectedStock || loading}
          >
            {loading ? 'Loading...' : 'Refresh Data'}
          </button>
        </div>
      </div>

      <div className="chart-wrapper">
        {error ? (
          <p className="error-message">{error}</p>
        ) : stockData ? (
          <>
            <div style={{ height: '400px' }}>
              <Line data={stockData} options={chartOptions} />
            </div>
            {lastUpdate && (
              <p className="update-time">
                Last updated: {lastUpdate}
              </p>
            )}
          </>
        ) : (
          <p>Select a stock to view the chart</p>
        )}
      </div>
    </div>
  );
};

export default StockControls; 