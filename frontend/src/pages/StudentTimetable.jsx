import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Typography } from '@mui/material';
import { Clock } from 'lucide-react';
import Layout from '../components/Layout';

const ACADEMIC_SLOTS = [
    { start: '08:30', end: '09:30', type: 'lecture' },
    { start: '09:30', end: '10:30', type: 'lecture' },
    { start: '10:30', end: '11:15', type: 'break', label: 'MORNING BREAK' },
    { start: '11:15', end: '12:15', type: 'lecture' },
    { start: '12:15', end: '13:15', type: 'lecture' },
    { start: '13:15', end: '13:30', type: 'break', label: 'LUNCH BREAK' },
    { start: '13:30', end: '14:30', type: 'lecture' },
    { start: '14:30', end: '15:30', type: 'lecture' }
];

const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':');
    let hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12 || 12;
    return `${hour}:${m} ${ampm}`;
};

const StudentTimetable = () => {
    const [timetable, setTimetable] = useState([]);
    const [loading, setLoading] = useState(true);
    const [studentInfo, setStudentInfo] = useState({ semester: '', section: '' });
    const token = localStorage.getItem('token');

    // Fetch user profile to get semester and section
    useEffect(() => {
        const fetchStudentInfo = async () => {
            try {
                const res = await axios.get('http://localhost:5000/api/users/me', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                // Assuming the student profile has 'semester' and 'section' fields
                setStudentInfo({
                    semester: res.data.semester || '',
                    section: res.data.section?.name || res.data.section || ''
                });
            } catch (err) {
                console.error('Error fetching student info:', err);
            } finally {
                // If the user's semester/section could not be fetched, loading shouldn't block
                setLoading(false);
            }
        };

        fetchStudentInfo();
    }, [token]);

    // Fetch Timetable once semester and section are known
    useEffect(() => {
        if (!studentInfo.semester || !studentInfo.section) return;

        const fetchTimetable = async () => {
            setLoading(true);
            try {
                const res = await axios.get(`http://localhost:5000/api/timetable?semester=${studentInfo.semester}&section=${studentInfo.section}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setTimetable(res.data || []);
            } catch (err) {
                console.error('Error fetching timetable:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchTimetable();
    }, [studentInfo, token]);

    return (
        <Layout role="Student" activeTab="timetable">
            <Box sx={{ width: '100%', p: { xs: 2, md: 4 }, animation: 'fadeInUp 0.5s ease-out' }}>
                <Typography variant="h4" fontWeight="bold" display="flex" alignItems="center" gap={2} mb={4}>
                    <Box component="span" sx={{ p: 1, bgcolor: 'primary.50', borderRadius: 2, display: 'flex' }}>
                        <Clock size={28} className="text-primary-600" />
                    </Box>
                    Weekly Timetable
                </Typography>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
                        <Typography color="text.secondary">Loading timetable...</Typography>
                    </Box>
                ) : !studentInfo.semester || !studentInfo.section ? (
                    <Box sx={{ textAlign: 'center', py: 10, bgcolor: 'action.hover', borderRadius: 3, border: '1px dashed', borderColor: 'divider' }}>
                        <Typography color="text.secondary">We couldn't determine your assigned semester and section from your profile.</Typography>
                    </Box>
                ) : (
                    <div className="bg-slate-800/50 rounded-2xl shadow-xl border border-slate-700/50 overflow-hidden backdrop-blur-sm">
                        <div className="p-6 border-b border-slate-700/50 bg-slate-900/30 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <Clock size={20} className="text-blue-400" />
                                Weekly Schedule (Semester {studentInfo.semester} - Section {studentInfo.section})
                            </h3>
                            <span className="text-sm font-semibold text-slate-400 bg-slate-700/50 px-3 py-1 rounded-full">{timetable.length} Lectures</span>
                        </div>

                        {timetable.length === 0 ? (
                            <Box sx={{ p: 10, textAlign: 'center' }}>
                                <Typography color="text.secondary" variant="h6">No timetable available for your section.</Typography>
                            </Box>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-center border-collapse">
                                    <thead>
                                        <tr>
                                            <th className="p-4 bg-gray-900 text-white border-r border-gray-800 w-32 min-w-[140px]">
                                                <div className="flex flex-col items-center">
                                                    <Clock size={16} className="mb-1 text-blue-400" />
                                                    <span className="text-xs uppercase tracking-wider font-bold">Time Slot</span>
                                                </div>
                                            </th>
                                            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
                                                <th key={day} className="p-4 bg-slate-900 text-white border-r border-slate-700 last:border-r-0 min-w-[160px]">
                                                    <span className="text-sm font-bold uppercase tracking-wide">{day}</span>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-700/50">
                                        {ACADEMIC_SLOTS.map((slot, idx) => {
                                            if (slot.type === 'break') {
                                                return (
                                                    <tr key={idx} className="bg-amber-900/20">
                                                        <td colSpan="7" className="p-3 text-center border-y-2 border-amber-900/30">
                                                            <span className="text-xs font-black text-amber-500 tracking-[0.2em] uppercase bg-amber-900/40 px-4 py-1 rounded-full border border-amber-800/50 shadow-sm">
                                                                {slot.label} ({formatTime(slot.start)} - {formatTime(slot.end)})
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            }

                                            return (
                                                <tr key={idx} className="hover:bg-slate-800/30 transition-colors h-24">
                                                    {/* Time Column */}
                                                    <td className="p-4 border-r border-slate-700 bg-slate-800/30 font-mono text-xs font-bold text-slate-400">
                                                        <div className="flex flex-col gap-1 items-center justify-center h-full">
                                                            <span className="text-sm text-white">{formatTime(slot.start)}</span>
                                                            <span className="text-slate-500 text-[10px] font-bold">⬇</span>
                                                            <span className="text-sm text-white">{formatTime(slot.end)}</span>
                                                        </div>
                                                    </td>

                                                    {/* Days Columns */}
                                                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => {
                                                        const lecture = timetable.find(t => t.day === day && t.startTime === slot.start);
                                                        const isOccupied = timetable.some(t => t.day === day && t.startTime < slot.start && t.endTime > slot.start);

                                                        if (isOccupied) return null;

                                                        let rowSpan = 1;
                                                        if (lecture) {
                                                            const startHour = parseInt(lecture.startTime.split(':')[0]);
                                                            const startMin = parseInt(lecture.startTime.split(':')[1]);
                                                            const endHour = parseInt(lecture.endTime.split(':')[0]);
                                                            const endMin = parseInt(lecture.endTime.split(':')[1]);
                                                            const durationMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
                                                            rowSpan = Math.ceil(durationMinutes / 60);
                                                        }

                                                        return (
                                                            <td key={day} rowSpan={rowSpan} className={`p-4 border-r border-slate-700 relative group transition-all hover:bg-slate-800/50 align-top ${rowSpan > 1 ? 'z-10' : ''}`}>
                                                                {lecture ? (
                                                                    <div className={`absolute inset-2 border rounded-lg p-2 flex flex-col justify-between transition-all ${lecture.type === 'Lab' ? 'bg-pink-900/10 border-pink-500/30' :
                                                                        lecture.type === 'Project' ? 'bg-purple-900/10 border-purple-500/30' : 'bg-blue-900/20 border-blue-800/30'
                                                                        } h-[calc(100%-16px)]`}>
                                                                        <div className="flex-1 flex flex-col justify-center">
                                                                            <div className={`font-bold text-sm leading-tight mb-1 line-clamp-2 ${lecture.type === 'Lab' ? 'text-pink-100' :
                                                                                lecture.type === 'Project' ? 'text-purple-100' : 'text-blue-100'
                                                                                }`}>
                                                                                {lecture.subjectId?.name || 'Unknown Subject'}
                                                                            </div>
                                                                            <div className={`text-[10px] font-mono uppercase rounded px-1 w-max mx-auto ${lecture.type === 'Lab' ? 'text-pink-300 bg-pink-900/50' :
                                                                                lecture.type === 'Project' ? 'text-purple-300 bg-purple-900/50' : 'text-blue-300 bg-blue-900/50'
                                                                                }`}>
                                                                                {lecture.subjectId?.code || 'No Code'} ({lecture.type || 'Theory'})
                                                                            </div>
                                                                        </div>

                                                                        <div className="mt-2 flex items-center gap-1.5 justify-center bg-slate-800/80 rounded-md py-1 px-2 border border-blue-800/30">
                                                                            <div className="w-4 h-4 rounded-full bg-indigo-900/50 text-indigo-300 flex items-center justify-center text-[9px] font-bold">
                                                                                {lecture.facultyId?.name?.charAt(0) || 'F'}
                                                                            </div>
                                                                            <span className="text-[10px] text-slate-300 truncate max-w-[80px] font-medium">{lecture.facultyId?.name || 'Unknown Faculty'}</span>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <div className="min-h-[96px]"></div>
                                                                )}
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </Box>
        </Layout>
    );
};

export default StudentTimetable;
