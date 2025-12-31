import app from './app.js';
import { config } from './config/index.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';

async function main() {
  // Connect to database
  await connectDatabase();

  // Start server
  const server = app.listen(config.port, () => {
    console.log(`Server running on port ${config.port} in ${config.env} mode`);
    console.log(`Health check: http://localhost:${config.port}/health`);
    console.log(`API base: http://localhost:${config.port}/api/v1`);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);

    server.close(async () => {
      console.log('HTTP server closed');
      await disconnectDatabase();
      process.exit(0);
    });

    // Force exit after 10 seconds
    setTimeout(() => {
      console.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
