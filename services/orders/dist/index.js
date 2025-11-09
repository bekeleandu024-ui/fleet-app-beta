"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const orders_1 = __importDefault(require("./routes/orders"));
const init_1 = require("./db/init");
const app = (0, express_1.default)();
const PORT = Number(process.env.PORT) || 4002;
app.use(express_1.default.json());
app.get("/", (_req, res) => res.json({ ok: true, service: "orders" }));
app.get("/healthz", (_req, res) => res.send("ok"));
app.use("/api/orders", orders_1.default);
async function start() {
    try {
        await (0, init_1.runMigrations)();
        app.listen(PORT, "0.0.0.0", () => {
            console.log(`Orders service listening on ${PORT}`);
        });
    }
    catch (error) {
        console.error("Failed to start orders service:", error);
        process.exit(1);
    }
}
start();
