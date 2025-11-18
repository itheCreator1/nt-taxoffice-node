/**
 * NT - TAXOFFICE
 * Main server entry point
 */

const express = require('express');
const path = require('path');
const indexRoutes = require('./routes/index');

const app = express();
const PORT = process.env.PORT || 3000;

/**
 * Middleware
 */
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * Routes
 */
app.use('/', indexRoutes);

/**
 * Error handling - 404
 */
app.use((req, res) => {
  res.status(404).send('Page not found');
});

/**
 * Start server
 */
app.listen(PORT, () => {
  console.log(`NT - TAXOFFICE server running on http://localhost:${PORT}`);
});