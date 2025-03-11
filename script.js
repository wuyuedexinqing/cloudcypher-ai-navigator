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
    return {
        goldStart: '2004-11-18',  // GLD launch date
        btcStart: '2024-01-11',    // IBIT launch date
        end: formatDate(endDate)
    };
}

// Unified data fetching function
async function fetchETFData(symbol, startDate, endDate, timeframe) {
    const apiKey = 'XIK06MDH33YFE33V'; // Replace with your actual API key
    const isSimulated = symbol === 'IBIT'; // IBIT data may not be available
    
    try {
        let url;
        if (timeframe === 'day') {
            url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${apiKey}&outputsize=full`;
        } else if (timeframe === 'week') {
            url = `https://www.alphavantage.co/query?function=TIME_SERIES_WEEKLY&symbol=${symbol}&apikey=${apiKey}`;
        } else {
            url = `https://www.alphavantage.co/query?function=TIME_SERIES_MONTHLY&symbol=${symbol}&apikey=${apiKey}`;
        }

        const response = await fetch(url);
        const data = await response.json();
        
        // Parse response
        const timeSeries = data[
            timeframe === 'day' ? 'Time Series (Daily)' :
            timeframe === 'week' ? 'Weekly Time Series' : 
            'Monthly Time Series'
        ];

        if (!timeSeries) {
            console.error('Invalid API response:', data);
            throw new Error('Invalid API response');
        }

        const formattedData = [];
        for (const date in timeSeries) {
            if (date >= startDate && date <= endDate) {
                formattedData.push({
                    date: new Date(date),
                    price: parseFloat(timeSeries[date]['4. close']),
                    volume: parseFloat(timeSeries[date]['5. volume'])
                });
            }
        }
        
        return formattedData.sort((a, b) => a.date - b.date);

    } catch (error) {
        console.error(`Error fetching ${symbol} data:`, error);
        showErrorToast(`Failed to load ${symbol} data. Using simulation.`);
        return generateSimulatedData(symbol, startDate, endDate, timeframe);
    }
}

// Unified simulated data generator
function generateSimulatedData(symbol, startDate, endDate, timeframe) {
    let start = new Date(startDate);
    const end = new Date(endDate);
    const data = [];
    
    // Base prices
    let price = symbol === 'GLD' ? 180 : 30;
    const volatility = symbol === 'GLD' ? 0.5 : 2.0;

    while (start <= end) {
        // Geometric Brownian Motion model
        const randomChange = (Math.random() - 0.5) * volatility;
        price = price * (1 + randomChange / 100);
        
        data.push({
            date: new Date(start),
            price: price,
            volume: Math.floor(Math.random() * (symbol === 'GLD' ? 5000000 : 8000000)) + 1000000
        });

        // Increment date
        const incrementMap = {
            day: () => start.setDate(start.getDate() + 1),
            week: () => start.setDate(start.getDate() + 7),
            month: () => start.setMonth(start.getMonth() + 1),
            quarter: () => start.setMonth(start.getMonth() + 3),
            year: () => start.setFullYear(start.getFullYear() + 1)
        };
        incrementMap[timeframe]();
    }

    return data;
}

// Enhanced data aggregation
async function getAggregatedData(symbol, startDate, endDate, timeframe) {
    try {
        const monthlyData = await fetchETFData(symbol, startDate, endDate, 'month');
        if (timeframe === 'month') return monthlyData;

        const aggregatedData = [];
        let currentPeriod = [];
        let currentPeriodKey = '';

        monthlyData.forEach(item => {
            const date = item.date;
            let periodKey;

            if (timeframe === 'quarter') {
                const quarter = Math.ceil((date.getMonth() + 1) / 3);
                periodKey = `${date.getFullYear()}-Q${quarter}`;
            } else { // year
                periodKey = date.getFullYear().toString();
            }

            if (periodKey !== currentPeriodKey) {
                if (currentPeriod.length > 0) {
                    aggregatedData.push({
                        date: new Date(currentPeriod[0].date),
                        price: currentPeriod.reduce((sum, d) => sum + d.price, 0) / currentPeriod.length,
                        volume: currentPeriod.reduce((sum, d) => sum + d.volume, 0)
                    });
                }
                currentPeriod = [];
                currentPeriodKey = periodKey;
            }
            currentPeriod.push(item);
        });

        // Add last period
        if (currentPeriod.length > 0) {
            aggregatedData.push({
                date: new Date(currentPeriod[0].date),
                price: currentPeriod.reduce((sum, d) => sum + d.price, 0) / currentPeriod.length,
                volume: currentPeriod.reduce((sum, d) => sum + d.volume, 0)
            });
        }

        return aggregatedData;

    } catch (error) {
        console.error('Aggregation error:', error);
        return [];
    }
}

// Error handling UI
function showErrorToast(message) {
    const toast = document.createElement('div');
    toast.className = 'error-toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// Chart creation with improved axes
function createChart(goldData, btcData) {
    const ctx = document.getElementById('comparison-chart').getContext('2d');
    if (chart) chart.destroy();

    // Get alignment mode
    const alignment = document.getElementById('alignment').value;
    let labels, goldDataset, btcDataset;

    if (alignment === 'aligned') {
        const minLength = Math.min(goldData.length, btcData.length);
        labels = Array.from({length: minLength}, (_, i) => `Day ${i + 1}`);
        goldDataset = goldData.slice(0, minLength);
        btcDataset = btcData.slice(0, minLength);
    } else {
        labels = [
            ...goldData.map(d => formatDate(d.date)), 
            ...btcData.map(d => formatDate(d.date))
        ].filter((v, i, a) => a.indexOf(v) === i).sort();
        
        goldDataset = goldData;
        btcDataset = btcData;
    }

    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Gold ETF (GLD)',
                data: goldDataset.map(d => d.price),
                borderColor: '#f1c40f',
                yAxisID: 'y',
                tension: 0.1
            }, {
                label: 'Bitcoin ETF (IBIT)',
                data: btcDataset.map(d => d.price),
                borderColor: '#3498db',
                yAxisID: 'y1',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    type: 'linear',
                    position: 'left',
                    title: { text: 'GLD Price ($)' },
                    grid: { drawOnChartArea: false },
                    min: Math.min(...goldDataset.map(d => d.price)) * 0.95,
                    max: Math.max(...goldDataset.map(d => d.price)) * 1.05
                },
                y1: {
                    type: 'linear',
                    position: 'right',
                    title: { text: 'IBIT Price ($)' },
                    grid: { drawOnChartArea: false },
                    min: Math.min(...btcDataset.map(d => d.price)) * 0.95,
                    max: Math.max(...btcDataset.map(d => d.price)) * 1.05
                },
                x: {
                    title: { 
                        text: alignment === 'aligned' ? 
                            'Days Since Alignment' : 
                            'Date' 
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        title: ([ctx]) => {
                            const date = alignment === 'aligned' ? 
                                `Day ${ctx.dataIndex + 1}` : 
                                labels[ctx.dataIndex];
                            return date;
                        },
                        label: ctx => `${ctx.dataset.label}: $${ctx.parsed.y.toFixed(2)}`
                    }
                }
            }
        }
    });
}

// Initialization and event handlers
function initializeApplication() {
    // Date pickers
    const dates = getDefaultDates();
    document.getElementById('startDate').value = dates.btcStart;
    document.getElementById('endDate').value = dates.end;

    // Event listeners
    document.getElementById('update-button').addEventListener('click', async () => {
        const timeframe = document.getElementById('timeframe').value;
        const { goldStart, btcStart, end } = getDefaultDates();
        
        try {
            [goldData, btcData] = await Promise.all([
                timeframe === 'quarter' || timeframe === 'year' ?
                    getAggregatedData('GLD', goldStart, end, timeframe) :
                    fetchETFData('GLD', goldStart, end, timeframe),
                
                timeframe === 'quarter' || timeframe === 'year' ?
                    getAggregatedData('IBIT', btcStart, end, timeframe) :
                    fetchETFData('IBIT', btcStart, end, timeframe)
            ]);

            createChart(goldData, btcData);
            updateComparisonTable(goldData, btcData);

        } catch (error) {
            showErrorToast('Failed to update data. Using cached values.');
        }
    });

    // Initial load
    document.getElementById('update-button').click();
}

// Initialize when ready
document.addEventListener('DOMContentLoaded', initializeApplication);
