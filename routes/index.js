/**
 * Main Routes
 * Handles routing for the home page and static pages
 */

const express = require('express');
const path = require('path');

const router = express.Router();

/**
 * GET /
 * Serves the main landing page (index.html)
 */
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

/**
 * GET /contact
 * Serves the contact page
 */
router.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/contact.html'));
});

/**
 * GET /media
 * Serves the media/press page
 */
router.get('/media', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/media.html'));
});

module.exports = router;