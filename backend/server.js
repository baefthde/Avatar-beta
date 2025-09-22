const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

// Import API routes
const apiRoutes = require('./api');

// Initialize Express app
const app = express();
const port = process.env.PORT || 3000;

// Configuration
const configPath = path.join(__dirname, 'config.json');
let config = {};

// Load configuration
function loadConfig() {
    try {
        if (fs.existsSync(configPath)) {
            const configData = fs.readFileSync(configPath, 'utf-8');
            config = JSON.parse(configData);
            console.log('✅ Configuration loaded successfully');
        } else {
            console.log('⚠️  No config.json found, using defaults');
            config = getDefaultConfig();
            saveConfig();
        }
    } catch (error) {
        console.error('❌ Error loading configuration:', error.message);
        config = getDefaultConfig();
    }
}

// Get default configuration
function getDefaultConfig() {
    return {
        openwebui_url: "https://localhost:443",
        openwebui_api_key: "",
        use_speech_input: true,
        use_speech_output: true,
        default_model: "gpt-4o-mini",
        tts_engine_url: "",
        tts_api_key: "",
        tts_voice: "alloy",
        tts_model: "tts-1",
        tts_speed: 1.0,
        tts_volume: 1.0,
        speech_recognition_lang: "de-DE",
        max_conversation_history: 20,
        request_timeout: 30000,
        tts_timeout: 15000,
        avatar_settings: {
            default_type: "3d",
            default_quality: "high",
            animation_enabled: true,
            emotion_detection: true,
            face_tracking: false
        },
        logging: {
            level: "info",
            max_file_size: "10MB",
            rotate_logs: true,
            log_requests: false,
            log_responses: false
        },
        security: {
            cors_enabled: true,
            rate_limiting: false,
            max_requests_per_minute: 60
        },
        features: {
            conversation_export: true,
            voice_commands: false,
            multilingual_support: true,
            avatar_customization: true
        },
        ui: {
            theme: "dark",
            show_diagnostics: true,
            auto_scroll: true,
            typing_indicators: true,
            sound_effects: false
        }
    };
}

// Save configuration
function saveConfig() {
    try {
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
        console.log('✅ Configuration saved successfully');
    } catch (error) {
        console.error('❌ Error saving configuration:', error.message);
    }
}

// Ensure log files exist
function ensureLogFiles() {
    const logFiles = ['system.log', 'all.log'];
    logFiles.forEach(logFile => {
        const filePath = path.join(__dirname, logFile);
        if (!fs.existsSync(filePath)) {
            try {
                fs.writeFileSync(filePath, '', 'utf-8');
                console.log(`📝 Created log file: ${logFile}`);
            } catch (error) {
                console.error(`❌ Error creating log file ${logFile}:`, error.message);
            }
        }
    });
}

// System logging function
function logSystem(message, details = '') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}\n${details ? details + '\n' : ''}`;
    
    try {
        fs.appendFileSync(path.join(__dirname, 'system.log'), logEntry, 'utf-8');
        
        // Console output with colors
        if (message.includes('Error') || message.includes('Failed')) {
            console.error(`❌ ${message}`, details ? `\n${details}` : '');
        } else if (message.includes('Warning') || message.includes('⚠')) {
            console.warn(`⚠️  ${message}`, details ? `\n${details}` : '');
        } else {
            console.log(`ℹ️  ${message}`, details ? `\n${details}` : '');
        }
    } catch (error) {
        console.error('Failed to write to system log:', error.message);
    }
}

// Request logging middleware
function requestLogger(req, res, next) {
    if (config.logging?.log_requests) {
        const startTime = Date.now();
        const originalSend = res.send;
        
        // Override res.send to capture response
        res.send = function(data) {
            const duration = Date.now() - startTime;
            
            logSystem(`HTTP Request: ${req.method} ${req.path}`, JSON.stringify({
                method: req.method,
                path: req.path,
                query: req.query,
                body: req.method === 'POST' ? req.body : undefined,
                status: res.statusCode,
                duration: `${duration}ms`,
                userAgent: req.get('User-Agent'),
                ip: req.ip || req.connection.remoteAddress
            }, null, 2));
            
            originalSend.call(this, data);
        };
    }
    
    next();
}

// Error handling middleware
function errorHandler(err, req, res, next) {
    logSystem(`Server Error: ${err.message}`, err.stack);
    
    // Don't expose error details in production
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    res.status(500).json({
        error: 'Internal Server Error',
        message: isDevelopment ? err.message : 'Something went wrong',
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
    });
}

// Security headers middleware
function securityHeaders(req, res, next) {
    // CORS headers
    if (config.security?.cors_enabled) {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
        
        if (req.method === 'OPTIONS') {
            return res.sendStatus(200);
        }
    }
    
    // Security headers
    res.header('X-Content-Type-Options', 'nosniff');
    res.header('X-Frame-Options', 'DENY');
    res.header('X-XSS-Protection', '1; mode=block');
    res.header('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Remove X-Powered-By header
    res.removeHeader('X-Powered-By');
    
    next();
}

// Rate limiting middleware (simple implementation)
const rateLimitMap = new Map();
function rateLimit(req, res, next) {
    if (!config.security?.rate_limiting) {
        return next();
    }
    
    const clientIP = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute
    const maxRequests = config.security.max_requests_per_minute || 60;
    
    if (!rateLimitMap.has(clientIP)) {
        rateLimitMap.set(clientIP, { count: 1, resetTime: now + windowMs });
        return next();
    }
    
    const clientData = rateLimitMap.get(clientIP);
    
    if (now > clientData.resetTime) {
        clientData.count = 1;
        clientData.resetTime = now + windowMs;
        return next();
    }
    
    if (clientData.count >= maxRequests) {
        logSystem(`Rate limit exceeded for IP: ${clientIP}`);
        return res.status(429).json({
            error: 'Rate limit exceeded',
            message: `Too many requests. Limit: ${maxRequests} per minute`,
            retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
        });
    }
    
    clientData.count++;
    next();
}

// Health check endpoint
app.get('/health', (req, res) => {
    const healthCheck = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '6.0.0-enhanced',
        memory: process.memoryUsage(),
        pid: process.pid,
        environment: process.env.NODE_ENV || 'development'
    };
    
    res.json(healthCheck);
});

// Initialize server
function initializeServer() {
    console.log('🚀 Initializing Avatar Chat UI v6 Enhanced Server...');
    
    // Load configuration
    loadConfig();
    
    // Ensure log files exist
    ensureLogFiles();
    
    // Apply middleware
    app.use(securityHeaders);
    app.use(rateLimit);
    app.use(bodyParser.json({ limit: '10mb' }));
    app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
    app.use(requestLogger);
    
    // Trust proxy for rate limiting (if behind reverse proxy)
    if (process.env.TRUST_PROXY === 'true') {
        app.set('trust proxy', 1);
    }
    
    // API routes
    app.use('/api', apiRoutes);
    
    // Serve static files from frontend directory
    const frontendPath = path.join(__dirname, '..', 'frontend');
    
    // Check if frontend directory exists
    if (!fs.existsSync(frontendPath)) {
        console.error('❌ Frontend directory not found:', frontendPath);
        console.log('📁 Creating basic frontend structure...');
        
        // Create basic frontend structure
        const dirs = [
            frontendPath,
            path.join(frontendPath, 'css'),
            path.join(frontendPath, 'js'),
            path.join(frontendPath, 'assets', 'avatars', '3d')
        ];
        
        dirs.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
                console.log(`📁 Created directory: ${dir}`);
            }
        });
        
        // Create basic index.html if it doesn't exist
        const indexPath = path.join(frontendPath, 'index.html');
        if (!fs.existsSync(indexPath)) {
            const basicHtml = `<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Avatar Chat UI - Setup Required</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #0f172a; color: white; }
        .container { max-width: 600px; margin: 0 auto; }
        h1 { color: #60a5fa; }
        .error { background: #dc2626; padding: 20px; border-radius: 8px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Avatar Chat UI v6 Enhanced</h1>
        <div class="error">
            <h2>Setup Required</h2>
            <p>Frontend files are missing. Please run the installation script:</p>
            <code>./install.sh</code>
            <p>Or check if all files are properly uploaded to the frontend directory.</p>
        </div>
    </div>
</body>
</html>`;
            fs.writeFileSync(indexPath, basicHtml, 'utf-8');
            console.log('📄 Created basic index.html');
        }
    }
    
    // Serve static files
    app.use(express.static(frontendPath, {
        maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0,
        etag: true,
        lastModified: true
    }));
    
    // Serve index.html for all non-API routes (SPA support)
    app.get('*', (req, res) => {
        if (!req.path.startsWith('/api')) {
            res.sendFile(path.join(frontendPath, 'index.html'));
        } else {
            res.status(404).json({
                error: 'API endpoint not found',
                path: req.path,
                availableEndpoints: [
                    '/api/chat',
                    '/api/config',
                    '/api/test/openwebui',
                    '/api/test/tts',
                    '/api/logs/system',
                    '/api/logs/all',
                    '/health'
                ]
            });
        }
    });
    
    // Error handling
    app.use(errorHandler);
    
    // Graceful shutdown handling
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
    process.on('uncaughtException', (error) => {
        logSystem('Uncaught Exception', error.stack);
        process.exit(1);
    });
    process.on('unhandledRejection', (reason, promise) => {
        logSystem('Unhandled Rejection', `Promise: ${promise}, Reason: ${reason}`);
    });
    
    // Start server
    const server = app.listen(port, () => {
        console.log('');
        console.log('╔════════════════════════════════════════════════════╗');
        console.log('║         🚀 Avatar Chat UI v6 Enhanced 🚀          ║');
        console.log('╚════════════════════════════════════════════════════╝');
        console.log('');
        console.log(`🌐 Server running at: http://localhost:${port}`);
        console.log(`📁 Frontend path: ${frontendPath}`);
        console.log(`⚙️  Configuration: ${configPath}`);
        console.log(`📝 Logs: ${path.join(__dirname, 'system.log')}`);
        console.log('');
        console.log('🔧 Available endpoints:');
        console.log('   • /health           - Health check');
        console.log('   • /api/chat         - Chat with AI');
        console.log('   • /api/config       - Configuration');
        console.log('   • /api/test/*       - Testing endpoints');
        console.log('   • /api/logs/*       - Log access');
        console.log('');
        console.log('📋 Next steps:');
        console.log('   1. Open http://localhost:' + port + ' in your browser');
        console.log('   2. Configure OpenWebUI and TTS settings');
        console.log('   3. Test connectivity using the test buttons');
        console.log('');
        console.log('🛑 To stop: Press Ctrl+C');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        logSystem('Server started successfully', `Port: ${port}, PID: ${process.pid}, Environment: ${process.env.NODE_ENV || 'development'}`);
    });
    
    // Set server timeout
    server.setTimeout(config.request_timeout || 30000);
    
    // Handle server errors
    server.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
            console.error(`❌ Port ${port} is already in use`);
            console.log('💡 Try a different port: PORT=3001 npm start');
            process.exit(1);
        } else {
            logSystem('Server Error', error.message);
            throw error;
        }
    });
    
    return server;
}

// Graceful shutdown
function gracefulShutdown(signal) {
    console.log('');
    console.log(`📴 Received ${signal}. Starting graceful shutdown...`);
    
    logSystem(`Graceful shutdown initiated`, `Signal: ${signal}, PID: ${process.pid}`);
    
    // Close server
    if (typeof server !== 'undefined') {
        server.close((err) => {
            if (err) {
                logSystem('Error during server shutdown', err.message);
                process.exit(1);
            }
            
            console.log('✅ HTTP server closed');
            logSystem('Server shutdown completed successfully');
            process.exit(0);
        });
        
        // Force shutdown after timeout
        setTimeout(() => {
            console.log('⚠️  Forced shutdown due to timeout');
            logSystem('Forced shutdown due to timeout');
            process.exit(1);
        }, 10000);
    } else {
        process.exit(0);
    }
}

// Development mode helpers
if (process.env.NODE_ENV === 'development') {
    // Hot reload for configuration
    if (fs.existsSync(configPath)) {
        fs.watchFile(configPath, (curr, prev) => {
            console.log('🔄 Configuration file changed, reloading...');
            loadConfig();
        });
    }
    
    // Additional development logging
    console.log('🔧 Development mode enabled');
    console.log('   • Configuration hot-reload: ON');
    console.log('   • Detailed error messages: ON');
    console.log('   • Request logging: ' + (config.logging?.log_requests ? 'ON' : 'OFF'));
}

// Production mode optimizations
if (process.env.NODE_ENV === 'production') {
    console.log('🚀 Production mode enabled');
    console.log('   • Error details: HIDDEN');
    console.log('   • Static file caching: ENABLED');
    console.log('   • Security headers: ENABLED');
    
    // Additional security in production
    app.disable('x-powered-by');
    app.set('trust proxy', 1);
}

// Export configuration and server initialization
module.exports = {
    app,
    config,
    loadConfig,
    saveConfig,
    logSystem,
    initializeServer
};

// Auto-initialize if this file is run directly
if (require.main === module) {
    try {
        initializeServer();
    } catch (error) {
        console.error('❌ Failed to initialize server:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}