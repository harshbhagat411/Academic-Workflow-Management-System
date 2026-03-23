const Settings = require('../models/Settings');

exports.getSettings = async (req, res) => {
    try {
        const userId = req.user.id;
        let settings = await Settings.findOne({ userId });

        if (!settings) {
            // Prevent duplicate creation with upsert logic or finding again just in case
            try {
                settings = await Settings.create({
                    userId,
                    themeMode: 'system',
                    colorMode: 'dark',
                    emailNotifications: true,
                    marksNotifications: true
                });
            } catch (err) {
                if (err.code === 11000) {
                    // Duplicate key error, means settings were created concurrently
                    settings = await Settings.findOne({ userId });
                } else {
                    throw err;
                }
            }
        }

        res.json(settings);
    } catch (error) {
        console.error('getSettings error:', error);
        res.status(500).json({ message: 'Server error fetching settings' });
    }
};

exports.updateSettings = async (req, res) => {
    try {
        const userId = req.user.id;
        const { themeMode, colorMode, emailNotifications, marksNotifications } = req.body;

        // Use findOneAndUpdate with upsert to guarantee it exists and updates safely
        const updatedSettings = await Settings.findOneAndUpdate(
            { userId },
            { 
                $set: { 
                    ...(themeMode !== undefined && { themeMode }),
                    ...(colorMode !== undefined && { colorMode }),
                    ...(emailNotifications !== undefined && { emailNotifications }),
                    ...(marksNotifications !== undefined && { marksNotifications })
                }
            },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        res.json(updatedSettings);
    } catch (error) {
        console.error('updateSettings error:', error);
        res.status(500).json({ message: 'Server error updating settings' });
    }
};
