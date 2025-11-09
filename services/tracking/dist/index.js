"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const init_1 = require("./db/init");
const config_1 = require("./config/config");
const trips_1 = __importDefault(require("./routes/trips"));
const telemetry_1 = __importDefault(require("./routes/telemetry"));
const views_1 = __importDefault(require("./routes/views"));
const kafkaConsumer_1 = require("./services/kafkaConsumer");
const eventProcessor_1 = require("./services/eventProcessor");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get("/", (_req, res) => res.json({ ok: true, service: config_1.SERVICE_NAME }));
app.get("/healthz", (_req, res) => res.send("ok"));
app.use("/api/trips", trips_1.default);
app.use("/api/telemetry", telemetry_1.default);
app.use("/api/views", views_1.default);
async function bootstrap() {
    try {
        await (0, init_1.runMigrations)();
        await (0, kafkaConsumer_1.startConsumer)([
            "dispatch.assigned",
            "dispatch.status.changed",
        ], eventProcessor_1.handleKafkaMessage);
        app.listen(config_1.PORT, "0.0.0.0", () => {
            console.log(`${config_1.SERVICE_NAME} listening on ${config_1.PORT}`);
        });
    }
    catch (error) {
        console.error("Failed to start tracking service", error);
        process.exit(1);
    }
}
bootstrap();
