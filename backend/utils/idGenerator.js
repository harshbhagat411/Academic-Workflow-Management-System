const User = require('../models/User');

// Reverted to "Older Format" as requested by User
// Logic: RolePrefix + Year + Batch(S/W) + Sequence
// Example: ST2026S001
const generateLoginId = async (role, semester, year) => {
    const rolePrefix = role === 'Student' ? 'ST' : 'FC';
    const date = new Date();
    const currentYear = year || date.getFullYear();
    const month = date.getMonth() + 1; // 1-12
    const batch = month <= 6 ? 'S' : 'W'; // Jan-Jun: Summer (S), Jul-Dec: Winter (W)

    const prefix = `${rolePrefix}${currentYear}${batch}`;

    // Find last user strictly matching this prefix followed by digits
    // We want to avoid matching the "new format" IDs (e.g., ST2026S06-001) if they exist
    const lastUser = await User.findOne({ loginId: { $regex: `^${prefix}\\d+$` } })
        .sort({ loginId: -1 })
        .collation({ locale: "en_US", numericOrdering: true });

    let sequence = 1;
    if (lastUser) {
        const lastLoginId = lastUser.loginId;
        const lastSeqStr = lastLoginId.replace(prefix, '');
        const lastSeq = parseInt(lastSeqStr, 10);
        if (!isNaN(lastSeq)) {
            sequence = lastSeq + 1;
        }
    }

    return `${prefix}${String(sequence).padStart(3, '0')}`;
};

module.exports = { generateLoginId };
