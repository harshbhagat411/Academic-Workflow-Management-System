const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userId: { type: String, unique: true, required: true },
  loginId: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
  role: { type: String, enum: ['Admin', 'Student', 'Faculty'], required: true },
  department: { type: String, required: true }, // Phase 8: Department Awareness
  status: { type: String, enum: ['Active', 'Deactivated'], default: 'Active' },
  semester: {
    type: Number,
    required: function () { return this.role === 'Student'; }
  }, // Only for Student
  maxSemesterReached: { 
    type: Number 
  }, // Tracks the highest semester reached
  specialization: {
    type: String,
    enum: ['Programming', 'Database', 'Networks', 'Artificial Intelligence', 'Mathematics', 'Web Development', 'Cloud Computing', 'Data Science', 'Software Engineering', 'Research & Projects'],
    required: function () { return this.role === 'Faculty'; }
  }, // Only for Faculty
  section: { type: String }, // Auto-assigned for Student
  isFirstLogin: { type: Boolean, default: true },
  passwordResetOtp: { type: String },
  passwordResetOtpExpiry: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
