import "dotenv/config";

import app from "./app.js";
import { env } from "./config/env.js";

/*
 * Railway's free plan runs this project as one service. Starting the queue
 * worker in the same process keeps scheduled emails processing in production.
 */
import "./workers/email.worker.js";

app.listen(env.PORT, () => {
  console.log(`🚀 Server running on http://localhost:${env.PORT}`);
});
