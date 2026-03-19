const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const Assessment = require('../models/Assessment');
const StudentMark = require('../models/StudentMark');
const AssessmentType = require('../models/AssessmentType');

const checkProgress = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const types = await AssessmentType.countDocuments();
        const assessments = await Assessment.countDocuments();
        const marks = await StudentMark.countDocuments();

        console.log(`Assessment Types: ${types}`);
        console.log(`Assessments: ${assessments}`);
        console.log(`Student Marks: ${marks}`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkProgress();
