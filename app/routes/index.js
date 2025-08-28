const express = require('express');
const router = express.Router();
const indexController = require('../controllers/indexController');
// Use global logger defined in app.js
const logger = global.logger || console;

/** Route handler for home page */
router.get('/', function (req, res, next) {
    res.render('index', { title: 'Express' });
});

/**
 * @swagger
 * /api/upload-excel:
 *   post:
 *     summary: Upload Excel file with POI data
 *     tags: [POI Management]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               excelFile:
 *                 type: string
 *                 format: binary
 *                 description: Excel file containing POI data (title, latitude, longitude columns)
 *     responses:
 *       200:
 *         description: POI data successfully uploaded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Bad request - no file uploaded or invalid file format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/api/upload-excel', indexController.uploadExcel);

/**
 * @swagger
 * /api/poi:
 *   get:
 *     summary: Get all POI data
 *     tags: [POI Data]
 *     responses:
 *       200:
 *         description: Successfully retrieved all POI data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/api/poi', indexController.getAllPoi);

/**
 * @swagger
 * /api/poi/search:
 *   get:
 *     summary: Search POI data by name
 *     tags: [POI Data]
 *     parameters:
 *       - in: query
 *         name: searchText
 *         required: true
 *         schema:
 *           type: string
 *         description: Search keyword for POI names
 *         example: 경복궁
 *     responses:
 *       200:
 *         description: Search results returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/api/poi/search', indexController.searchPoi);

module.exports = router;
