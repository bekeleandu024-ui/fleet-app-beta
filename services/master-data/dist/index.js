"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const config_1 = require("./config/config");
const client_1 = require("./db/client");
const init_1 = require("./db/init");
const kafkaProducer_1 = require("./services/kafkaProducer");
const costing_1 = __importDefault(require("./routes/costing"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'master-data' });
});
// Costing API routes
app.use('/api/costing', costing_1.default);
async function startServer() {
    try {
        // Run database migrations
        console.log('Running database migrations...');
        await (0, init_1.runMigrations)(client_1.pool);
        console.log('Database migrations completed');
        // Connect Kafka producer
        console.log('Connecting to Kafka...');
        await (0, kafkaProducer_1.connectProducer)();
        console.log('Kafka producer connected');
        // Start HTTP server
        app.listen(config_1.config.port, () => {
            console.log(`Master-data service listening on port ${config_1.config.port}`);
            console.log(`Costing API available at http://localhost:${config_1.config.port}/api/costing`);
        });
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}
// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully...');
    await client_1.pool.end();
    process.exit(0);
});
process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully...');
    await client_1.pool.end();
    process.exit(0);
});
startServer();
