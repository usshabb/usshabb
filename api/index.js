// Vercel serverless function entry point
// This file will be compiled by the build process and won't directly load dist/index.cjs
// Instead, Vercel will use this as the entry point and include all dependencies

import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

// Set production mode
process.env.NODE_ENV = 'production';

// Import the built server module
// After build, this will be the bundled Express app
let app;

try {
  // Try to load the built server (will work after compilation)
  app = require('../dist/index.cjs');

  // If it's a module with default export
  if (app && app.default) {
    app = app.default;
  }
} catch (error) {
  console.error('Failed to load server:', error);

  // Fallback error handler
  app = (req, res) => {
    res.status(500).json({
      error: 'Server initialization failed',
      message: process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : error.message
    });
  };
}

export default app;
