// Global variables
let chart;
let goldData = [];
let btcData = [];

// Helper functions
function formatDate(date) {
    return date.toISOString().split('T')[0];
}

function getDefaultDates() {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 1);
    
    return {
        start: formatDate(startDate),
        end: formatDate(endDate)
    };
}

// Initialize date pickers with default values
function initializeDatePickers() {
    const dates = getDefaultDates();
    document.getElementById('startDate').value = dates.start;
    document.getElementById('endDate').value = dates.end;
}

// Fetch Gold ETF data (GLD)
async function fetchGoldETFData(startDate, endDate, timeframe) {
    // Using Alpha Vantage API for historical data
    // Note: In a real implementation, you would need an API key
    const apiKey = 'YOUR_ALPHA_VANTAGE_API_KEY'; // Replace with your actual API key
    const symbol = 'GLD';
    
    try {
        // For demo purposes, we'll simulate with random data
        // In a real app, you would fetch from an API like:
        // `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${apiKey}&outputsize=full`
        
        // Generate simulated data for demonstration
        const data = generateSimulatedGoldData(startDate, endDate, timeframe);
        return data;
    } catch (error) {
        console.error('Error fetching Gold ETF data:', error);
        return [];
    }
}

// Fetch Bitcoin ETF data (IBIT)
async function fetchBitcoinETFData(startDate, endDate, timeframe) {
    // For IBIT, since it's newer, we might need a different API or approach
    // For demo purposes, we'll simulate with random data
    try {
        const data = generateSimulatedBitcoinData(startDate, endDate, timeframe);
        return data;
    } catch (error) {
        console.error('Error fetching Bitcoin ETF data:', error);
        return [];
    }
}

// Generate simulated Gold ETF data
function generateSimulatedGoldData(startDate, endDate, timeframe) {
    let start = new Date(startDate);
    const end = new Date(endDate);
    const data = [];
    
    // Base price around $180 (typical GLD price)
    let price = 180;
    
    while (start <= end) {
        // Add some random variation
        const randomChange = (Math.random() - 0.48) * 2; // Slightly biased towards growth
        price = price * (1 + randomChange / 100);
        
        data.push({
            date: new Date(start),
            price: price,
            volume: Math.floor(Math.random() * 5000000) + 1000000
        });
        
        // Increment date based on timeframe
        switch (timeframe) {
            case 'day':
                start.setDate(start.getDate() + 1);
                break;
            case 'week':
                start.setDate(start.getDate() + 7);
                break;
            case 'month':
                start.setMonth(start.getMonth() + 1);
                break;
            case 'quarter':
                start.setMonth(start.getMonth() + 3);
                break;
            case 'year':
                start.setFullYear(start.getFullYear() + 1);
                break;
        }
    }
    
    return data;
}

// Generate simulated Bitcoin ETF data
function generateSimulatedBitcoinData(startDate, endDate, timeframe) {
    let start = new Date(startDate);
    const end = new Date(endDate);
    const data = [];
    
    // Base price around $30 (example IBIT price)
    let price = 30;
    
    while (start <= end) {
        // Add some random variation with higher volatility than gold
        const randomChange = (Math.random() - 0.45) * 5; // Higher volatility, slightly more positive bias
        price = price * (1 + randomChange / 100);
        
        data.push({
            date: new Date(start),
            price: price,
            volume: Math.floor(Math.random() * 8000000) + 2000000
        });
        
        // Increment date based on timeframe
        switch (timeframe) {
            case 'day':
                start.setDate(start.getDate() + 1);
                break;
            case 'week':
                start.setDate(start.getDate() + 7);
                break;
            case 'month':
                start.setMonth(start.getMonth() + 1);
                break;
            case 'quarter':
                start.setMonth(start.getMonth() + 3);
                break;
            case 'year':
                start.setFullYear(start.getFullYear() + 1);
                break;
        }
    }
    
    return data;
}

// Create or update the comparison chart
function createChart(goldData, btcData) {
    const ctx = document.getElementById('comparison-chart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (chart) {
        chart.destroy();
    }
    
    // Prepare data for chart
    const labels = goldData.map(item => {
        const date = new Date(item.date);
        return date.toLocaleDateString();
    });
    
    const goldPrices = goldData.map(item => item.price);
    const btcPrices = btcData.map(item => item.price);
    
    // Create new Chart
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Gold ETF (GLD)',
                    data: goldPrices,
                    borderColor: '#f1c40f',
                    backgroundColor: 'rgba(241, 196, 15, 0.1)',
                    yAxisID: 'y',
                    tension: 0.1
                },
                {
                    label: 'Bitcoin ETF (IBIT)',
                    data: btcPrices,
                    borderColor: '#3498db',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    yAxisID: 'y1',
                    tension: 0.1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            stacked: false,
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Gold ETF Price ($)'
                    },
                    grid: {
                        drawOnChartArea: false,
                    },
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Bitcoin ETF Price ($)'
                    },
                    grid: {
                        drawOnChartArea: false,
                    },
                },
                x: {
                    title: {
                        display: true,
                        text: 'Date'
                    }
                }
            },
            plugins: {
                tooltip: {
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
            }
        }
    });
}

// Update comparison table
function updateComparisonTable(goldData, btcData) {
    // Calculate statistics
    const latestGoldPrice = goldData[goldData.length - 1].price;
    const latestBtcPrice = btcData[btcData.length - 1].price;
    
    const firstGoldPrice = goldData[0].price;
    const firstBtcPrice = btcData[0].price;
    
    const goldChange = ((latestGoldPrice - firstGoldPrice) / firstGoldPrice * 100).toFixed(2);
    const btcChange = ((latestBtcPrice - firstBtcPrice) / firstBtcPrice * 100).toFixed(2);
    
    const goldVolumeAvg = goldData.reduce((sum, item) => sum + item.volume, 0) / goldData.length;
    const btcVolumeAvg = btcData.reduce((sum, item) => sum + item.volume, 0) / btcData.length;
    
    // Update table cells
    document.getElementById('gold-price').textContent = `$${latestGoldPrice.toFixed(2)}`;
    document.getElementById('btc-price').textContent = `$${latestBtcPrice.toFixed(2)}`;
    
    document.getElementById('gold-change').textContent = `${goldChange}%`;
    document.getElementById('btc-change').textContent = `${btcChange}%`;
    
    document.getElementById('gold-volume').textContent = new Intl.NumberFormat().format(Math.round(goldVolumeAvg));
    document.getElementById('btc-volume').textContent = new Intl.NumberFormat().format(Math.round(btcVolumeAvg));
    
    // Add color coding for percentage changes
    const goldChangeElement = document.getElementById('gold-change');
    const btcChangeElement = document.getElementById('btc-change');
    
    if (parseFloat(goldChange) > 0) {
        goldChangeElement.style.color = 'green';
    } else {
        goldChangeElement.style.color = 'red';
    }
    
    if (parseFloat(btcChange) > 0) {
        btcChangeElement.style.color = 'green';
    } else {
        btcChangeElement.style.color = 'red';
    }
}

// Main function to update the chart and data
async function updateData() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const timeframe = document.getElementById('timeframe').value;
    
    // Fetch data
    goldData = await fetchGoldETFData(startDate, endDate, timeframe);
    btcData = await fetchBitcoinETFData(startDate, endDate, timeframe);
    
    // Make sure both datasets have the same number of points
    // (In a real implementation, you might need more sophisticated handling)
    const minLength = Math.min(goldData.length, btcData.length);
    goldData = goldData.slice(0, minLength);
    btcData = btcData.slice(0, minLength);
    
    // Update chart and table
    createChart(goldData, btcData);
    updateComparisonTable(goldData, btcData);
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    initializeDatePickers();
    
    // Add event listeners
    document.getElementById('updateChart').addEventListener('click', updateData);
    document.getElementById('timeframe').addEventListener('change', function() {
        // Auto-update when timeframe changes
        updateData();
    });
    
    // Initial data load
    updateData();
});
