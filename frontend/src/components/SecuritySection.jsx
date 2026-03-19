import React, { useState } from 'react';
import axios from 'axios';
import { Lock, Shield, Key, AlertTriangle, CheckCircle, Eye, EyeOff } from 'lucide-react';

const SecuritySection = () => {
    const [step, setStep] = useState(1); // 1: Old Pass, 2: OTP & New Pass
    const [oldPassword, setOldPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRequestOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:5000/api/auth/request-password-change',
                { oldPassword },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setStep(2);
            setMessage('OTP sent to your registered email (valid for 5 mins).');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to verify password');
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmChange = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:5000/api/auth/confirm-password-change',
                { otp, newPassword },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setMessage('Password changed successfully!');
            setTimeout(() => {
                setStep(1);
                setOldPassword('');
                setOtp('');
                setNewPassword('');
                setMessage('');
            }, 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to change password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mt-6">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4">
                <Shield size={20} className="text-blue-600" />
                Security Settings
            </h3>

            {message && <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded-lg flex items-center gap-2"><CheckCircle size={16} />{message}</div>}
            {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-center gap-2"><AlertTriangle size={16} />{error}</div>}

            {step === 1 ? (
                <form onSubmit={handleRequestOtp} className="max-w-md">
                    <p className="text-sm text-gray-500 mb-4">
                        To change your password, first verify your current password. We will send an OTP to your email.
                    </p>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-2.5 text-gray-400" size={18} />
                            <input
                                type={showOldPassword ? 'text' : 'password'}
                                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={oldPassword}
                                onChange={(e) => setOldPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowOldPassword(!showOldPassword)}
                                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 focus:outline-none"
                            >
                                {showOldPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition w-full disabled:opacity-70"
                    >
                        {loading ? 'Verifying...' : 'Verify & Send OTP'}
                    </button>
                </form>
            ) : (
                <form onSubmit={handleConfirmChange} className="max-w-md space-y-4">
                    <p className="text-sm text-gray-500">
                        Enter the OTP sent to your email and your new password.
                    </p>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Enter OTP</label>
                        <div className="relative">
                            <Key className="absolute left-3 top-2.5 text-gray-400" size={18} />
                            <input
                                type="text"
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="6-digit code"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-2.5 text-gray-400" size={18} />
                            <input
                                type={showNewPassword ? 'text' : 'password'}
                                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="Min 6 chars"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 focus:outline-none"
                            >
                                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() => { setStep(1); setError(''); }}
                            className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-70"
                        >
                            {loading ? 'Updating...' : 'Change Password'}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default SecuritySection;
