//index.js
const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 5000;

// Placeholder for your database
let productTransactions = [];

// Function to initialize the database with seed data
const initializeDatabase = async () => {
  try {
    // Fetch data from the provided URL
    const response = await axios.get('https://s3.amazonaws.com/roxiler.com/product_transaction.json');
    productTransactions = response.data;

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error.message);
    throw error; // Rethrow the error for further handling
  }
};

// Database initialization API
app.get('/api/initialize-database', async (req, res) => {
  try {
    // Initialize the database with seed data
    await initializeDatabase();

    res.json({ message: 'Database initialized successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// API to list all transactions with search and pagination
app.get('/api/transactions', (req, res) => {
  const requestedMonth = req.query.month.toLowerCase();
  const search = req.query.search || '';
  const page = parseInt(req.query.page) || 1;
  const perPage = parseInt(req.query.perPage) || 10;

  // Filter transactions based on month and search criteria
  const filteredTransactions = productTransactions.filter(transaction => {
    const transactionMonth = new Date(transaction.dateOfSale).toLocaleString('en-US', { month: 'long' }).toLowerCase();
    return transactionMonth.includes(requestedMonth) &&
      (transaction.title.includes(search) || transaction.description.includes(search) || transaction.price.toString().includes(search));
  });

  // Paginate the results
  const startIndex = (page - 1) * perPage;
  const endIndex = startIndex + perPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);

  res.json({
    transactions: paginatedTransactions,
    totalTransactions: filteredTransactions.length
  });
});

// API for statistics
app.get('/api/statistics', (req, res) => {
  const requestedMonth = req.query.month.toLowerCase();

  // Filter transactions based on the requested month
  const filteredTransactions = productTransactions.filter(transaction =>
    new Date(transaction.dateOfSale).toLocaleString('en-US', { month: 'long' }).toLowerCase().includes(requestedMonth)
  );

  const totalSaleAmount = filteredTransactions.reduce((sum, transaction) => sum + transaction.price, 0);
  const totalSoldItems = filteredTransactions.length;
  const totalNotSoldItems = productTransactions.length - totalSoldItems;

  res.json({
    totalSaleAmount,
    totalSoldItems,
    totalNotSoldItems
  });
});

// API for bar chart
app.get('/api/bar-chart', (req, res) => {
  const requestedMonth = req.query.month.toLowerCase();

  // Filter transactions based on the requested month
  const filteredTransactions = productTransactions.filter(transaction =>
    new Date(transaction.dateOfSale).toLocaleString('en-US', { month: 'long' }).toLowerCase().includes(requestedMonth)
  );

  const priceRanges = [
    { range: '0-100', count: 0 },
    { range: '101-200', count: 0 },
    { range: '201-300', count: 0 },
    { range: '301-400', count: 0 },
    { range: '401-500', count: 0 },
    { range: '501-600', count: 0 },
    { range: '601-700', count: 0 },
    { range: '701-800', count: 0 },
    { range: '801-900', count: 0 },
    { range: '901-above', count: 0 }
  ];

  // Count transactions in each price range
  filteredTransactions.forEach(transaction => {
    const price = transaction.price;
    if (price >= 0 && price <= 100) {
      priceRanges[0].count++;
    } else if (price <= 200) {
      priceRanges[1].count++;
    } else if (price <= 300) {
      priceRanges[2].count++;
    } else if (price <= 400) {
      priceRanges[3].count++;
    } else if (price <= 500) {
      priceRanges[4].count++;
    } else if (price <= 600) {
      priceRanges[5].count++;
    } else if (price <= 700) {
      priceRanges[6].count++;
    } else if (price <= 800) {
      priceRanges[7].count++;
    } else if (price <= 900) {
      priceRanges[8].count++;
    } else {
      priceRanges[9].count++;
    }
  });

  res.json(priceRanges);
});

// API for pie chart
app.get('/api/pie-chart', (req, res) => {
  const requestedMonth = req.query.month.toLowerCase();

  // Filter transactions based on the requested month
  const filteredTransactions = productTransactions.filter(transaction =>
    new Date(transaction.dateOfSale).toLocaleString('en-US', { month: 'long' }).toLowerCase().includes(requestedMonth)
  );

  // Count items in each unique category
  const categoryCounts = {};
  filteredTransactions.forEach(transaction => {
    const category = transaction.category;
    if (category) {
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    }
  });

  const pieChartData = Object.keys(categoryCounts).map(category => ({
    category,
    itemCount: categoryCounts[category]
  }));

  res.json(pieChartData);
});

// API to fetch data from all APIs and combine the response
app.get('/api/combined-response', async (req, res) => {
  const month = req.query.month.toLowerCase();

  try {
    // Fetch data from all APIs
    const transactionsResponse = await axios.get(`http://localhost:5000/api/transactions?month=${month}`);
    const statisticsResponse = await axios.get(`http://localhost:5000/api/statistics?month=${month}`);
    const barChartResponse = await axios.get(`http://localhost:5000/api/bar-chart?month=${month}`);
    const pieChartResponse = await axios.get(`http://localhost:5000/api/pie-chart?month=${month}`);

    // Combine the responses
    const combinedResponse = {
      transactions: transactionsResponse.data.transactions,
      statistics: statisticsResponse.data,
      barChart: barChartResponse.data,
      pieChart: pieChartResponse.data,
    };

    res.json(combinedResponse);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(PORT, async () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  // Initialize the database with seed data when the server starts
  await initializeDatabase();
});
