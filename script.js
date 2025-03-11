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
    const apiKey = 'XIK06MDH33YFE33V'; // Replace with your actual API key
    const symbol = 'GLD';
    
    try {
        let url;
        // Select appropriate API endpoint based on timeframe
        if (timeframe === 'day') {
            url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${apiKey}&outputsize=full`;
        } else if (timeframe === 'week') {
            url = `https://www.alphavantage.co/query?function=TIME_SERIES_WEEKLY&symbol=${symbol}&apikey=${apiKey}`;
        } else {
            url = `https://www.alphavantage.co/query?function=TIME_SERIES_MONTHLY&symbol=${symbol}&apikey=${apiKey}`;
        }
        
        const response = await fetch(url);
        const data = await response.json();
        
        // Parse Alpha Vantage response
        const timeSeries = timeframe === 'day' 
            ? data['Time Series (Daily)'] 
            : timeframe === 'week'
                ? data['Weekly Time Series']
                : data['Monthly Time Series'];
        
        if (!timeSeries) {
            console.error('Invalid response format from Alpha Vantage:', data);
            return generateSimulatedGoldData(startDate, endDate, timeframe); // Fallback to simulated data
        }
        
        const formattedData = [];
        for (const date in timeSeries) {
            // Check if date is within specified range
            if (date >= startDate && date <= endDate) {
                formattedData.push({
                    date: new Date(date),
                    price: parseFloat(timeSeries[date]['4. close']),
                    volume: parseFloat(timeSeries[date]['5. volume'])
                });
            }
        }
        
        // Sort by date
        return formattedData.sort((a, b) => a.date - b.date);
        
    } catch (error) {
        console.error('Error fetching Gold ETF data:', error);
        // Fallback to simulated data if API fails
        return generateSimulatedGoldData(startDate, endDate, timeframe);
    }
}

// Fetch Bitcoin ETF data (IBIT)
async function fetchBitcoinETFData(startDate, endDate, timeframe) {
    const apiKey = 'XIK06MDH33YFE33V'; // Replace with your actual API key
    const symbol = 'IBIT';
    
    try {
        let url;
        // Select appropriate API endpoint based on timeframe
        if (timeframe === 'day') {
            url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${apiKey}&outputsize=full`;
        } else if (timeframe === 'week') {
            url = `https://www.alphavantage.co/query?function=TIME_SERIES_WEEKLY&symbol=${symbol}&apikey=${apiKey}`;
        } else {
            url = `https://www.alphavantage.co/query?function=TIME_SERIES_MONTHLY&symbol=${symbol}&apikey=${apiKey}`;
        }
        
        const response = await fetch(url);
        const data = await response.json();
        
        // Parse Alpha Vantage response
        const timeSeries = timeframe === 'day' 
            ? data['Time Series (Daily)'] 
            : timeframe === 'week'
                ? data['Weekly Time Series']
                : data['Monthly Time Series'];
        
        if (!timeSeries) {
            console.error('Invalid response format from Alpha Vantage:', data);
            return generateSimulatedBitcoinData(startDate, endDate, timeframe); // Fallback to simulated data
        }
        
        const formattedData = [];
        for (const date in timeSeries) {
            // Check if date is within specified range
            if (date >= startDate && date <= endDate) {
                formattedData.push({
                    date: new Date(date),
                    price: parseFloat(timeSeries[date]['4. close']),
                    volume: parseFloat(timeSeries[date]['5. volume'])
                });
            }
        }
        
        // Sort by date
        return formattedData.sort((a, b) => a.date - b.date);
        
    } catch (error) {
        console.error('Error fetching Bitcoin ETF data:', error);
        // Fallback to simulated data if API fails
        return generateSimulatedBitcoinData(startDate, endDate, timeframe);
    }
}

// Process data for quarter and year views from monthly data
async function getAggregatedData(symbol, startDate, endDate, timeframe) {
    // For quarter and year views, we'll fetch monthly data and aggregate it
    const apiKey = 'XIK06MDH33YFE33V';
    const url = `https://www.alphavantage.co/query?function=TIME_SERIES_MONTHLY&symbol=${symbol}&apikey=${apiKey}`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        const monthlyData = data['Monthly Time Series'];
        
        if (!monthlyData) {
            throw new Error('Invalid data format received');
        }
        
        // Convert monthly data to array format
        const dataArray = [];
        for (const date in monthlyData) {
            if (date >= startDate && date <= endDate) {
                dataArray.push({
                    date: new Date(date),
                    price: parseFloat(monthlyData[date]['4. close']),
                    volume: parseFloat(monthlyData[date]['5. volume'])
                });
            }
        }
        
        // Sort by date
        dataArray.sort((a, b) => a.date - b.date);
        
        // If timeframe is quarter or year, aggregate the data
        if (timeframe === 'quarter' || timeframe === 'year') {
            const aggregatedData = [];
            let currentPeriodData = [];
            let currentPeriodStart = null;
            
            dataArray.forEach(item => {
                const itemDate = item.date;
                
                if (timeframe === 'quarter') {
                    // Check if this is a new quarter
                    const itemQuarter = Math.floor(itemDate.getMonth() / 3);
                    const itemYear = itemDate.getFullYear();
                    const periodKey = `${itemYear}-Q${itemQuarter + 1}`;
                    
                    if (!currentPeriodStart) {
                        currentPeriodStart = periodKey;
                    } else if (currentPeriodStart !== periodKey) {
                        // Process the previous quarter
                        if (currentPeriodData.length > 0) {
                            const avgPrice = currentPeriodData.reduce((sum, d) => sum + d.price, 0) / currentPeriodData.length;
                            const totalVolume = currentPeriodData.reduce((sum, d) => sum + d.volume, 0);
                            
                            aggregatedData.push({
                                date: new Date(currentPeriodData[0].date), // First date of the quarter
                                price: avgPrice,
                                volume: totalVolume
                            });
                        }
                        
                        currentPeriodData = [];
                        currentPeriodStart = periodKey;
                    }
                } else if (timeframe === 'year') {
                    // Check if this is a new year
                    const itemYear = itemDate.getFullYear();
                    
                    if (!currentPeriodStart) {
                        currentPeriodStart = itemYear;
                    } else if (currentPeriodStart !== itemYear) {
                        // Process the previous year
                        if (currentPeriodData.length > 0) {
                            const avgPrice = currentPeriodData.reduce((sum, d) => sum + d.price, 0) / currentPeriodData.length;
                            const totalVolume = currentPeriodData.reduce((sum, d) => sum + d.volume, 0);
                            
                            aggregatedData.push({
                                date: new Date(currentPeriodData[0].date), // First date of the year
                                price: avgPrice,
                                volume: totalVolume
                            });
                        }
                        
                        currentPeriodData = [];
                        currentPeriodStart = itemYear;
                    }
                }
                
                currentPeriodData.push(item);
            });
            
            // Process the last period
            if (currentPeriodData.length > 0) {
                const avgPrice = currentPeriodData.reduce((sum, d) => sum + d.price, 0) / currentPeriodData.length;
                const totalVolume = currentPeriodData.reduce((sum, d) => sum + d.volume, 0);
                
                aggregatedData.push({
                    date: new Date(currentPeriodData[0].date),
                    price: avgPrice,
                    volume: totalVolume
                });
            }
            
            return aggregatedData;
        }
        
        return dataArray;
        
    } catch (error) {
        console.error(`Error fetching aggregated data for ${symbol}:`, error);
        return [];
    }
}

// Generate simulated Gold ETF data (as fallback)
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

// Generate simulated Bitcoin ETF data (as fallback)
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
    
    // Show loading indicator
    document.querySelector('.chart-container').classList.add('loading');
    
    try {
        // Fetch data based on timeframe
        if (timeframe === 'quarter' || timeframe === 'year') {
            // For quarter and year views, we need to aggregate monthly data
            goldData = await getAggregatedData('GLD', startDate, endDate, timeframe);
            btcData = await getAggregatedData('IBIT', startDate, endDate, timeframe);
        } else {
            // For day, week, and month views, fetch directly
            goldData = await fetchGoldETFData(startDate, endDate, timeframe);
            btcData = await fetchBitcoinETFData(startDate, endDate, timeframe);
        }
        
        // Handle case where API returns empty data
        if (goldData.length === 0) {
            goldData = generateSimulatedGoldData(startDate, endDate, timeframe);
            console.warn('Using simulated gold data due to empty API response');
        }
        
        if (btcData.length === 0) {
            btcData = generateSimulatedBitcoinData(startDate, endDate, timeframe);
            console.warn('Using simulated bitcoin data due to empty API response');
        }
        
        // Make sure both datasets cover similar date ranges
        // This is important since IBIT was launched in January 2024
        const goldStart = goldData[0].date;
        const btcStart = btcData[0].date;
        
        // If one dataset starts later than the other, trim the earlier one
        if (goldStart < btcStart) {
            goldData = goldData.filter(item => item.date >= btcStart);
        } else if (btcStart < goldStart) {
            btcData = btcData.filter(item => item.date >= goldStart);
        }
        
        // Update chart and table
        createChart(goldData, btcData);
        updateComparisonTable(goldData, btcData);
    } catch (error) {
        console.error('Error updating data:', error);
        alert('Error loading data. Using simulated data instead.');
        
        // Fallback to simulated data
        goldData = generateSimulatedGoldData(startDate, endDate, timeframe);
        btcData = generateSimulatedBitcoinData(startDate, endDate, timeframe);
        
        createChart(goldData, btcData);
        updateComparisonTable(goldData, btcData);
    } finally {
        // Hide loading indicator
        document.querySelector('.chart-container').classList.remove('loading');
    }
}

// Add loading animation CSS
document.addEventListener('DOMContentLoaded', function() {
    // Create a style element for loading animation
    const style = document.createElement('style');
    style.textContent = `
        .chart-container.loading::after {
            content: "Loading data...";
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background-color: rgba(255, 255, 255, 0.8);
            padding: 20px;
            border-radius: 5px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
        
        .chart-container {
            position: relative;
        }
    `;
    document.head.appendChild(style);
    
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
