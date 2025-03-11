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
    
    // For BTC ETF, start from Jan 2024 (IBIT launch date)
    const btcStartDate = new Date('2024-01-11');
    
    // For GLD, start from Nov 2004 (GLD launch date)
    const goldStartDate = new Date('2004-11-18');
    
    return {
        goldStart: formatDate(goldStartDate),
        btcStart: formatDate(btcStartDate),
        end: formatDate(endDate)
    };
}

// Initialize date pickers with default values
function initializeDatePickers() {
    const dates = getDefaultDates();
    document.getElementById('startDate').value = dates.btcStart; // Default to BTC ETF start
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

// Normalize data to compare performance from respective launch dates
function normalizeData(data) {
    if (data.length === 0) return [];
    
    const baseValue = data[0].price;
    return data.map(item => ({
        ...item,
        normalizedPrice: (item.price / baseValue) * 100
    }));
}

// Create or update the comparison chart
function createChart(goldData, btcData) {
    const ctx = document.getElementById('comparison-chart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (chart) {
        chart.destroy();
    }
    
    // Normalize data to compare from respective launch points
    const normalizedGoldData = normalizeData(goldData);
    const normalizedBtcData = normalizeData(btcData);
    
    // Get days since launch for x-axis
    const goldLabels = normalizedGoldData.map((item, index) => `Day ${index + 1}`);
    const btcLabels = normalizedBtcData.map((item, index) => `Day ${index + 1}`);
    
    // Use the longer set of labels
    const labels = goldLabels.length >= btcLabels.length ? goldLabels : btcLabels;
    
    // Prepare datasets
    const goldPrices = normalizedGoldData.map(item => item.price);
    const btcPrices = normalizedBtcData.map(item => item.price);
    
    // Prepare normalized values for percentage comparison
    const goldNormalized = normalizedGoldData.map(item => item.normalizedPrice);
    const btcNormalized = normalizedBtcData.map(item => item.normalizedPrice);
    
    // Create tabs for different view types
    const tabContainer = document.createElement('div');
    tabContainer.className = 'chart-tabs';
    tabContainer.innerHTML = `
        <button class="tab-button active" data-view="absolute">Absolute Prices</button>
        <button class="tab-button" data-view="normalized">Normalized (% Change)</button>
        <button class="tab-button" data-view="log">Log Scale</button>
    `;
    
    // Insert tabs before chart
    const chartContainer = document.querySelector('.chart-container');
    chartContainer.insertBefore(tabContainer, document.getElementById('comparison-chart'));
    
    // Initial chart with absolute values
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
                        text: 'Days Since Launch'
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        title: function(context) {
                            const dataIndex = context[0].dataIndex;
                            const datasetIndex = context[0].datasetIndex;
                            const date = datasetIndex === 0 
                                ? normalizedGoldData[dataIndex]?.date 
                                : normalizedBtcData[dataIndex]?.date;
                            
                            if (date) {
                                return `${date.toLocaleDateString()} (Day ${dataIndex + 1})`;
                            } else {
                                return `Day ${dataIndex + 1}`;
                            }
                        },
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
                },
                title: {
                    display: true,
                    text: 'ETF Price Comparison (Absolute Values)'
                }
            }
        }
    });
    
    // Add event listeners to tabs
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', function() {
            // Update active tab
            document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            const view = this.getAttribute('data-view');
            
            // Update chart based on view type
            if (view === 'normalized') {
                // Switch to normalized (percentage) view
                chart.data.datasets[0].data = goldNormalized;
                chart.data.datasets[1].data = btcNormalized;
                
                chart.options.scales.y.title.text = 'GLD % Change from Launch';
                chart.options.scales.y1.title.text = 'IBIT % Change from Launch';
                
                chart.options.plugins.title.text = 'ETF Performance Comparison (% Change from Launch)';
                
                chart.options.plugins.tooltip.callbacks.label = function(context) {
                    let label = context.dataset.label || '';
                    if (label) {
                        label += ': ';
                    }
                    if (context.parsed.y !== null) {
                        label += `${context.parsed.y.toFixed(2)}%`;
                    }
                    return label;
                };
                
            } else if (view === 'log') {
                // Switch to log scale view
                chart.data.datasets[0].data = goldPrices;
                chart.data.datasets[1].data = btcPrices;
                
                chart.options.scales.y.type = 'logarithmic';
                chart.options.scales.y1.type = 'logarithmic';
                
                chart.options.scales.y.title.text = 'Gold ETF Price ($) - Log Scale';
                chart.options.scales.y1.title.text = 'Bitcoin ETF Price ($) - Log Scale';
                
                chart.options.plugins.title.text = 'ETF Price Comparison (Log Scale)';
                
                chart.options.plugins.tooltip.callbacks.label = function(context) {
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
                };
                
            } else {
                // Switch to absolute values view
                chart.data.datasets[0].data = goldPrices;
                chart.data.datasets[1].data = btcPrices;
                
                chart.options.scales.y.type = 'linear';
                chart.options.scales.y1.type = 'linear';
                
                chart.options.scales.y.title.text = 'Gold ETF Price ($)';
                chart.options.scales.y1.title.text = 'Bitcoin ETF Price ($)';
                
                chart.options.plugins.title.text = 'ETF Price Comparison (Absolute Values)';
                
                chart.options.plugins.tooltip.callbacks.label = function(context) {
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
                };
            }
            
            chart.update();
        });
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
    
    // Add additional rows to the comparison table
    const tbody = document.getElementById('comparison-table').querySelector('tbody');
    
    // Calculate CAGR (Compound Annual Growth Rate)
    const goldLaunchDate = new Date('2004-11-18');
    const btcLaunchDate = new Date('2024-01-11');
    const currentDate = new Date();
    
    const goldYears = (currentDate - goldLaunchDate) / (1000 * 60 * 60 * 24 * 365.25);
    const btcYears = (currentDate - btcLaunchDate) / (1000 * 60 * 60 * 24 * 365.25);
    
    // Calculate CAGR using the formula: (FV/PV)^(1/n) - 1
    // where FV = final value, PV = initial value, n = number of years
    const goldCAGR = (((latestGoldPrice / 44.38) ** (1/goldYears)) - 1) * 100; // 44.38 was GLD's initial price
    const btcCAGR = (((latestBtcPrice / 27.72) ** (1/btcYears)) - 1) * 100;  // 27.72 was IBIT's initial price
    
    // Add CAGR row
    const cagrRow = document.createElement('tr');
    cagrRow.innerHTML = `
        <td>CAGR (Annualized Return)</td>
        <td>${goldCAGR.toFixed(2)}%</td>
        <td>${btcCAGR.toFixed(2)}%</td>
    `;
    tbody.appendChild(cagrRow);
    
    // Add volatility row (standard deviation of daily returns)
    const goldVolatility = calculateVolatility(goldData);
    const btcVolatility = calculateVolatility(btcData);
    
    const volatilityRow = document.createElement('tr');
    volatilityRow.innerHTML = `
        <td>Volatility (Std Dev)</td>
        <td>${goldVolatility.toFixed(2)}%</td>
        <td>${btcVolatility.toFixed(2)}%</td>
    `;
    tbody.appendChild(volatilityRow);
    
    // Add max drawdown
    const goldDrawdown = calculateMaxDrawdown(goldData);
    const btcDrawdown = calculateMaxDrawdown(btcData);
    
    const drawdownRow = document.createElement('tr');
    drawdownRow.innerHTML = `
        <td>Max Drawdown</td>
        <td>${goldDrawdown.toFixed(2)}%</td>
        <td>${btcDrawdown.toFixed(2)}%</td>
    `;
    tbody.appendChild(drawdownRow);
}

// Calculate volatility (standard deviation of returns)
function calculateVolatility(data) {
    if (data.length < 2) return 0;
    
    // Calculate daily returns
    const returns = [];
    for (let i = 1; i < data.length; i++) {
        const dailyReturn = (data[i].price / data[i-1].price) - 1;
        returns.push(dailyReturn);
    }
    
    // Calculate mean
    const mean = returns.reduce((sum, val) => sum + val, 0) / returns.length;
    
    // Calculate standard deviation
    const squaredDiffs = returns.map(val => Math.pow(val - mean, 2));
    const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    
    // Annualize (multiply by sqrt of trading days in a year)
    return stdDev * Math.sqrt(252) * 100;
}

// Calculate maximum drawdown
function calculateMaxDrawdown(data) {
    if (data.length < 2) return 0;
    
    let maxDrawdown = 0;
    let peak = data[0].price;
    
    for (let i = 1; i < data.length; i++) {
        if (data[i].price > peak) {
            peak = data[i].price;
        } else {
            const drawdown = (peak - data[i].price) / peak * 100;
            if (drawdown > maxDrawdown) {
                maxDrawdown = drawdown;
            }
        }
    }
    
    return maxDrawdown;
}

// Main function to update the chart and data
async function updateData() {
    const endDate = document.getElementById('endDate').value;
    const timeframe = document.getElementById('timeframe').value;
    
    // Set different start dates for each ETF
    const dates = getDefaultDates();
    const goldStartDate = dates.goldStart;
    const btcStartDate = dates.btcStart;
    
    // Show loading indicator
    document.querySelector('.chart-container').classList.add('loading');
    
    try {
        // Fetch data based on timeframe
        if (timeframe === 'quarter' || timeframe === 'year') {
            // For quarter and year views, we need to aggregate monthly data
            goldData = await getAggregatedData('GLD', goldStartDate, endDate, timeframe);
            btcData = await getAggregatedData('IBIT', btcStartDate, endDate, timeframe);
        } else {
            // For day, week, and month views, fetch directly
            goldData = await fetchGoldETFData(goldStartDate, endDate, timeframe);
            btcData = await fetchBitcoinETFData(btcStartDate, endDate, timeframe);
        }
        
        // Handle case where API returns empty data
        if (goldData.length === 0) {
            goldData = generateSimulatedGoldData(goldStartDate, endDate, timeframe);
            console.warn('Using simulated gold data due to empty API response');
        }
        
        if (btcData.length === 0) {
            btcData = generateSimulatedBitcoinData(btcStartDate, endDate, timeframe);
            console.warn('Using simulated bitcoin data due to empty API response');
        }
        
        // Update chart and table
        createChart(goldData, btcData);
        updateComparisonTable(goldData, btcData);
        
        // Add a summary section
        addSummarySection(goldData, btcData);
        
    } catch (error) {
        console.error('Error updating data:', error);
        alert('Error loading data. Using simulated data instead.');
        
        // Fallback to
    // ... [previous code remains the same] ...

// Add a summary section with key insights
function addSummarySection(goldData, btcData) {
    // Remove existing summary if present
    const existingSummary = document.getElementById('summary-section');
    if (existingSummary) {
        existingSummary.remove();
    }
    
    // Create summary section
    const summarySection = document.createElement('div');
    summarySection.id = 'summary-section';
    summarySection.className = 'summary-container';
    
    // Calculate key metrics for comparison
    const goldStartPrice = goldData[0].price;
    const goldEndPrice = goldData[goldData.length - 1].price;
    const goldGrowth = ((goldEndPrice / goldStartPrice) - 1) * 100;
    
    const btcStartPrice = btcData[0].price;
    const btcEndPrice = btcData[btcData.length - 1].price;
    const btcGrowth = ((btcEndPrice / btcStartPrice) - 1) * 100;
    
    const goldVolatility = calculateVolatility(goldData);
    const btcVolatility = calculateVolatility(btcData);
    
    const goldMaxDrawdown = calculateMaxDrawdown(goldData);
    const btcMaxDrawdown = calculateMaxDrawdown(btcData);
    
    // Determine which asset had better performance in various metrics
    const betterGrowth = btcGrowth > goldGrowth ? 'Bitcoin ETF (IBIT)' : 'Gold ETF (GLD)';
    const lowerVolatility = btcVolatility < goldVolatility ? 'Bitcoin ETF (IBIT)' : 'Gold ETF (GLD)';
    const lowerDrawdown = btcMaxDrawdown < goldMaxDrawdown ? 'Bitcoin ETF (IBIT)' : 'Gold ETF (GLD)';
    
    // Calculate Sharpe ratio (using risk-free rate of 2% as example)
    const riskFreeRate = 2.0;
    const goldSharpe = (goldGrowth - riskFreeRate) / goldVolatility;
    const btcSharpe = (btcGrowth - riskFreeRate) / btcVolatility;
    const betterSharpe = btcSharpe > goldSharpe ? 'Bitcoin ETF (IBIT)' : 'Gold ETF (GLD)';
    
    // Create content
    summarySection.innerHTML = `
        <h2>Comparative Analysis Summary</h2>
        <div class="summary-cards">
            <div class="summary-card">
                <h3>Performance Metrics</h3>
                <p><strong>Total Return:</strong> ${betterGrowth} performed better</p>
                <p><strong>Gold ETF Return:</strong> ${goldGrowth.toFixed(2)}%</p>
                <p><strong>Bitcoin ETF Return:</strong> ${btcGrowth.toFixed(2)}%</p>
            </div>
            <div class="summary-card">
                <h3>Risk Metrics</h3>
                <p><strong>Lower Volatility:</strong> ${lowerVolatility}</p>
                <p><strong>Lower Max Drawdown:</strong> ${lowerDrawdown}</p>
                <p><strong>Better Risk-Adjusted Return:</strong> ${betterSharpe}</p>
            </div>
            <div class="summary-card">
                <h3>Key Takeaways</h3>
                <p>Gold ETF (GLD) has historically been a ${goldVolatility < btcVolatility ? 'less volatile' : 'more volatile'} asset.</p>
                <p>Bitcoin ETF (IBIT) has shown ${btcGrowth > goldGrowth ? 'stronger' : 'weaker'} growth since its launch.</p>
                <p>Risk-adjusted returns favor ${goldSharpe > btcSharpe ? 'Gold ETF' : 'Bitcoin ETF'}.</p>
            </div>
        </div>
    `;
    
    // Add to document
    document.querySelector('.container').appendChild(summarySection);
}

// Add UI enhancements
function addUIEnhancements() {
    // Add a loading spinner
    const chartContainer = document.querySelector('.chart-container');
    const loadingSpinner = document.createElement('div');
    loadingSpinner.className = 'loading-spinner';
    loadingSpinner.innerHTML = '<div class="spinner"></div><p>Loading data...</p>';
    chartContainer.appendChild(loadingSpinner);
    
    // Add styles for loading state
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        .loading-spinner {
            display: none;
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
        }
        
        .chart-container.loading .loading-spinner {
            display: block;
        }
        
        .chart-container.loading canvas {
            opacity: 0.3;
        }
        
        .spinner {
            border: 4px solid rgba(0, 0, 0, 0.1);
            width: 36px;
            height: 36px;
            border-radius: 50%;
            border-left-color: #3498db;
            animation: spin 1s linear infinite;
            margin: 0 auto 10px;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .summary-container {
            margin-top: 30px;
            padding: 20px;
            background-color: #f9f9f9;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .summary-cards {
            display: flex;
            flex-wrap: wrap;
            gap: 20px;
            margin-top: 15px;
        }
        
        .summary-card {
            flex: 1;
            min-width: 250px;
            padding: 15px;
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .summary-card h3 {
            margin-top: 0;
            color: #2c3e50;
            border-bottom: 1px solid #eee;
            padding-bottom: 8px;
        }
        
        .chart-tabs {
            display: flex;
            gap: 10px;
            margin-bottom: 15px;
        }
        
        .tab-button {
            padding: 8px 16px;
            background-color: #f1f1f1;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            transition: background-color 0.3s;
        }
        
        .tab-button:hover {
            background-color: #e1e1e1;
        }
        
        .tab-button.active {
            background-color: #3498db;
            color: white;
        }
        
        @media (max-width: 768px) {
            .summary-cards {
                flex-direction: column;
            }
            
            .chart-tabs {
                flex-wrap: wrap;
            }
        }
    `;
    document.head.appendChild(styleElement);
    
    // Add export functionality
    const controlsContainer = document.querySelector('.controls');
    const exportButton = document.createElement('button');
    exportButton.id = 'export-button';
    exportButton.className = 'button';
    exportButton.textContent = 'Export Data';
    controlsContainer.appendChild(exportButton);
    
    // Add event listener for export
    exportButton.addEventListener('click', exportData);
}

// Export data as CSV
function exportData() {
    // Prepare data
    const csvRows = [];
    
    // Add headers
    csvRows.push('Date,GLD Price,GLD Volume,IBIT Price,IBIT Volume');
    
    // Determine the maximum length
    const maxLength = Math.max(goldData.length, btcData.length);
    
    // Add data rows
    for (let i = 0; i < maxLength; i++) {
        const goldItem = goldData[i] || { date: '', price: '', volume: '' };
        const btcItem = btcData[i] || { date: '', price: '', volume: '' };
        
        const goldDate = goldItem.date ? goldItem.date.toISOString().split('T')[0] : '';
        const btcDate = btcItem.date ? btcItem.date.toISOString().split('T')[0] : '';
        
        // Use the date that exists, prefer gold date
        const date = goldDate || btcDate;
        
        csvRows.push(`${date},${goldItem.price || ''},${goldItem.volume || ''},${btcItem.price || ''},${btcItem.volume || ''}`);
    }
    
    // Create CSV content
    const csvContent = csvRows.join('\n');
    
    // Create a download link
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', 'etf_comparison_data.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Add a time alignment option
function addTimeAlignmentOption() {
    const controlsContainer = document.querySelector('.controls');
    const alignmentDiv = document.createElement('div');
    alignmentDiv.className = 'control-group';
    alignmentDiv.innerHTML = `
        <label for="alignment">Time Alignment:</label>
        <select id="alignment" class="input-field">
            <option value="separate">Separate Launch Dates</option>
            <option value="aligned">Aligned (Same Start Point)</option>
        </select>
    `;
    
    controlsContainer.appendChild(alignmentDiv);
    
    // Add event listener
    document.getElementById('alignment').addEventListener('change', function() {
        updateData();
    });
}

// Modify chart creation to respect time alignment option
function createTimeAlignedChart(goldData, btcData) {
    const alignment = document.getElementById('alignment').value;
    
    if (alignment === 'aligned') {
        // For aligned view, we need to adjust the data
        // We'll show only the first N days of each ETF where N is the shorter dataset
        const minLength = Math.min(goldData.length, btcData.length);
        const truncatedGoldData = goldData.slice(0, minLength);
        const truncatedBtcData = btcData.slice(0, minLength);
        
        // Use the truncated data for the chart
        createChart(truncatedGoldData, truncatedBtcData);
    } else {
        // For separate launch dates, use full data
        createChart(goldData, btcData);
    }
}

// Main initialization function
function initializeApplication() {
    initializeDatePickers();
    addUIEnhancements();
    addTimeAlignmentOption();
    
    // Add event listeners
    document.getElementById('update-button').addEventListener('click', updateData);
    
    // Initialize the chart with default data
    updateData();
}

// Add a download chart image functionality
function addChartImageExport() {
    const chartContainer = document.querySelector('.chart-container');
    const exportImageButton = document.createElement('button');
    exportImageButton.id = 'export-image-button';
    exportImageButton.className = 'button';
    exportImageButton.textContent = 'Download Chart';
    exportImageButton.style.marginLeft = '10px';
    
    document.querySelector('.controls').appendChild(exportImageButton);
    
    exportImageButton.addEventListener('click', function() {
        // Convert chart to image and download
        const canvas = document.getElementById('comparison-chart');
        const image = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = image;
        a.download = 'etf_comparison_chart.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    });
}

// Add support for responsive layout
function makeResponsive() {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        @media (max-width: 768px) {
            .container {
                padding: 10px;
            }
            
            .controls {
                flex-direction: column;
            }
            
            .control-group {
                width: 100%;
                margin-bottom: 10px;
            }
            
            .chart-container {
                height: 300px;
            }
            
            .comparison-table {
                font-size: 14px;
            }
            
            .chart-tabs {
                overflow-x: auto;
                padding-bottom: 5px;
            }
        }
    `;
    document.head.appendChild(styleElement);
}

// Create an intro section with key information about the ETFs
function addIntroSection() {
    const container = document.querySelector('.container');
    const intro = document.createElement('div');
    intro.className = 'intro-section';
    intro.innerHTML = `
        <h2>Gold ETF vs Bitcoin ETF: Historical Performance Comparison</h2>
        <div class="intro-content">
            <div class="intro-card">
                <h3>Gold ETF (GLD)</h3>
                <p><strong>Launch Date:</strong> November 18, 2004</p>
                <p><strong>Description:</strong> The SPDR Gold Shares ETF (GLD) is one of the largest gold ETFs, designed to track the price of gold bullion. It offers investors a way to access gold without physically owning it.</p>
                <p><strong>Trading Info:</strong> NYSE Arca, founded by World Gold Council</p>
            </div>
            <div class="intro-card">
                <h3>Bitcoin ETF (IBIT)</h3>
                <p><strong>Launch Date:</strong> January 11, 2024</p>
                <p><strong>Description:</strong> The BlackRock iShares Bitcoin Trust (IBIT) is a spot Bitcoin ETF that allows investors to gain exposure to Bitcoin price movements without directly holding the cryptocurrency.</p>
                <p><strong>Trading Info:</strong> NASDAQ, managed by BlackRock</p>
            </div>
        </div>
    `;
    
    // Add styles
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        .intro-section {
            margin-bottom: 30px;
            background-color: #f9f9f9;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .intro-content {
            display: flex;
            gap: 20px;
            margin-top: 15px;
        }
        
        .intro-card {
            flex: 1;
            background-color: white;
            padding: 15px;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .intro-card h3 {
            margin-top: 0;
            color: #2c3e50;
            border-bottom: 1px solid #eee;
            padding-bottom: 8px;
        }
        
        @media (max-width: 768px) {
            .intro-content {
                flex-direction: column;
            }
        }
    `;
    document.head.appendChild(styleElement);
    
    // Insert at the beginning of container
    container.insertBefore(intro, container.firstChild);
}

// Initialize everything when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApplication();
    addChartImageExport();
    makeResponsive();
    addIntroSection();
});
