require('dotenv').config();
let createError = require('http-errors');
let express = require('express');
let cookieParser = require('cookie-parser');
let morganLogger = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger.config');

// Logger setup
const winston = require('winston');
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
    ),
    defaultMeta: { service: 'poi-service' },
    transports: [
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' }),
        new winston.transports.Console({
            format: winston.format.simple(),
        }),
    ],
});

global.logger = logger;

// API Logger middleware
const apiLogger = (req, res, next) => {
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info('API Request', {
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            userAgent: req.get('User-Agent') || '',
            ip: req.ip,
        });
    });

    next();
};

let indexRouter = require('./app/routes/index');
const http = require('http');

let app = express();

global.CONFIG = require('./config.json');
global.path = require('path');
global.ROOT = __dirname;
global.psql = require('./app/modules/db.psql');
global.funcCmmn = require('./app/modules/func-common');

// Ensure logs directory exists
const fs = require('fs');
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir);
    console.log('📁 Created logs directory');
}

// Auto-initialize database on startup
const indexModel = require('./app/models/indexModel');
setTimeout(async () => {
    try {
        logger.info('Starting database initialization');
        console.log('🔧 Starting database initialization...');
        await indexModel.createTable(
            (result) => {
                logger.info('Database initialized successfully', { result });
                console.log('✅ Database initialized successfully:', result);
            },
            (error) => {
                logger.error('Database initialization failed', {
                    error: error.message,
                    stack: error.stack,
                });
                console.error('❌ Database initialization failed:', error);
                console.log(
                    '🔄 You can manually initialize the database using /api/initialize-db endpoint',
                );
            },
        );
    } catch (error) {
        logger.error('Database initialization error', {
            error: error.message,
            stack: error.stack,
        });
        console.error('❌ Database initialization error:', error);
        console.log(
            '🔄 You can manually initialize the database using /api/initialize-db endpoint',
        );
    }
}, 2000); // Wait 2 seconds for database connection to be ready

// view engine setup
app.set('views', path.join(__dirname, 'app', 'views'));
app.set('view engine', 'ejs');

app.use(morganLogger('dev'));
app.use(apiLogger);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

http.createServer(app).listen('3535', () => {
    const startupMessage = `Server is running at port 3535`;
    logger.info('Server started', {
        port: 3535,
        environment: process.env.NODE_ENV || 'development',
        swaggerDocs: 'http://localhost:3535/api-docs',
    });
    console.log(`✅  ${startupMessage}`);
    console.log(`📚  Swagger API Documentation: http://localhost:3535/api-docs`);
});

module.exports = app;
