"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
exports.withTransaction = withTransaction;
const pg_1 = require("pg");
const config_1 = require("../config/config");
exports.pool = new pg_1.Pool({
    connectionString: config_1.DATABASE_URL,
    application_name: config_1.SERVICE_NAME,
});
async function withTransaction(work) {
    const client = await exports.pool.connect();
    try {
        await client.query("BEGIN");
        const txClient = createTransactionClient(client);
        const result = await work(txClient);
        await client.query("COMMIT");
        return result;
    }
    catch (error) {
        await client.query("ROLLBACK");
        throw error;
    }
    finally {
        client.release();
    }
}
function createTransactionClient(client) {
    return {
        query: (text, params) => client.query(text, params),
    };
}
