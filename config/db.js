const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);

    console.log(`[MongoDB Connected]: ${conn.connection.host}`);

    // Drop legacy id_1 indexes if they exist to prevent E11000 null duplicate key errors
    const collections = ['users', 'lectures', 'departments', 'attendances'];
    for (const colName of collections) {
      try {
        const collection = conn.connection.collection(colName);
        const indexes = await collection.indexes();
        if (indexes.some(idx => idx.name === 'id_1')) {
          await collection.dropIndex('id_1');
          console.log(`[Index Cleanup]: Dropped legacy id_1 index from ${colName} collection.`);
        }
      } catch (e) {
        // Index might not exist, ignore
      }
    }
  } catch (error) {
    console.error(`[MongoDB Connection Error]: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
