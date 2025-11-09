import express from "express";
import cors from "cors";
import { runMigrations } from "./db/init";
import { PORT, SERVICE_NAME } from "./config/config";
import tripsRouter from "./routes/trips";
import telemetryRouter from "./routes/telemetry";
import viewsRouter from "./routes/views";
import { startConsumer } from "./services/kafkaConsumer";
import { handleKafkaMessage } from "./services/eventProcessor";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => res.json({ ok: true, service: SERVICE_NAME }));
app.get("/healthz", (_req, res) => res.send("ok"));

app.use("/api/trips", tripsRouter);
app.use("/api/telemetry", telemetryRouter);
app.use("/api/views", viewsRouter);

async function bootstrap() {
  try {
    await runMigrations();
    await startConsumer([
      "dispatch.assigned",
      "dispatch.status.changed",
    ], handleKafkaMessage);

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`${SERVICE_NAME} listening on ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start tracking service", error);
    process.exit(1);
  }
}

bootstrap();
