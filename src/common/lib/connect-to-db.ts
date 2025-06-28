import mongoose from 'mongoose';
import devLogger from '../utils/dev-logger';

declare global { // Extends the global NodeJS.Global interface, add a mongoose property. This property will hold the cached Mongoose connection details.
  var mongoose: {
    conn: mongoose.Connection | null; // Stores Mongoose connection object once established.
    promise: Promise<mongoose.Connection> | null; // Stores the promise of a connection, prevents multiple connection attempts if a connection is already in progress.
  };
}

const MONGODB_URI = process.env.MONGODB_URI;



async function connectToDB() {
  if (global.mongoose && global.mongoose.conn) { // If a connection already exists, return it.
    devLogger.info('🟢 Using cached MongoDB connection.');
    return global.mongoose.conn;
  }

  if (global.mongoose && global.mongoose.promise) { // If a connection is in progress, return the promise to avoid multiple connections.
    devLogger.info('🧪 MongoDB connection in progress, waiting for it to resolve.');
    return global.mongoose.promise;
  }

  if (!global.mongoose) { // If global.mongoose is not defined, initialize it.
    global.mongoose = { conn: null, promise: null };
  }

  try {
    devLogger.info('🟢 Attempting to establish new MongoDB connection...');
    const opts = { // Options for the Mongoose connection. Disables buffer commands as they can cause issues in some cases, especially in serverless environments.
      bufferCommands: false,
    };

    global.mongoose.promise = (mongoose.connect(MONGODB_URI as string, opts) as unknown) as Promise<mongoose.Connection>; // Connect to MongoDB using the URI from environment variables and options.

    const db = await global.mongoose.promise; // Wait for the connection promise to resolve.

    global.mongoose.conn = db; // Store the connection in global.mongoose.conn for future use.
    devLogger.info('🍃 MongoDB connected successfully.');

    mongoose.connection.on('disconnected', () => { // Listen for disconnection events and log them.
      devLogger.warn('🔌 MongoDB disconnected!');
      if (global.mongoose) {
        global.mongoose.conn = null;
        global.mongoose.promise = null;
      }
    });

    mongoose.connection.on('error', (err) => { // Listen for error events and log them.
      devLogger.error('⚠️ MongoDB connection error:', err);
      if (global.mongoose) {
        global.mongoose.conn = null;
        global.mongoose.promise = null;
      }
    });

    mongoose.connection.on('reconnected', () => { // Listen for reconnection events and log them.
      devLogger.info('♻️ MongoDB reconnected!');
    });

    return db; // Return the established connection.
  } catch (error) {
    devLogger.error('❌ Error connecting to MongoDB:', error);
    if (global.mongoose) {
      global.mongoose.conn = null;
      global.mongoose.promise = null;
    }
    throw error;
  }
}



export default connectToDB;
