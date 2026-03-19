const mongoose = require('mongoose');
require('dotenv').config();

const renameCollection = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;

        // Check if old collection exists
        const collections = await db.listCollections({ name: 'guideallocations' }).toArray();
        if (collections.length > 0) {
            console.log('Found guideallocations collection. Renaming...');
            await db.renameCollection('guideallocations', 'mentorallocations');
            console.log('Successfully renamed to mentorallocations.');
        } else {
            console.log('guideallocations collection not found. Checking if mentorallocations exists...');
            const newCols = await db.listCollections({ name: 'mentorallocations' }).toArray();
            if (newCols.length > 0) {
                console.log('mentorallocations already exists. Skipping rename.');
            } else {
                console.log('Neither collection found. Starting fresh (no data needs migration).');
            }
        }

        process.exit(0);

    } catch (error) {
        console.error('Rename Error:', error);
        process.exit(1);
    }
};

renameCollection();
