export const config = {
  port: parseInt(process.env.PORT || '4001', 10),
  databaseUrl: process.env.DATABASE_URL || 'postgresql://fleet_user:fleet_pass@localhost:5432/fleet_db',
  kafkaBroker: process.env.KAFKA_BROKER || 'localhost:9092',
  nodeEnv: process.env.NODE_ENV || 'development',
};
