import React from 'react';
import { ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const StatusPage = () => {
    const navigate = useNavigate();
    const { token } = useAuth();

    const handleBack = () => {
        if (token) {
            navigate('/home');
        } else {
            navigate('/');
        }
    };
    
    const services = [
        { name: "Authentication & User Service", status: "operational" },
        { name: "Platform Dashboard", status: "operational" },
        { name: "Custom Platform Engine", status: "operational" },
        { name: "Trading Engine Simulator", status: "operational" },
        { name: "Real-time Market Data", status: "operational" },
        { name: "Goal Planner & Tracker", status: "operational" },
        { name: "Community Feed & Interaction", status: "operational" },
        { name: "ChatBot AI Mentor", status: "operational" },
        { name: "Learning Modules API", status: "operational" },
        { name: "Notifications Service", status: "operational" },
    ];

    return (
        <div className="max-w-4xl mx-auto py-12 px-6 animate-fade-in font-sans">
            <button onClick={handleBack} className="flex items-center gap-2 text-gray-400 hover:text-[#00cfff] mb-8 font-bold text-sm transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <div className="bg-engine-panel border border-engine-panel-border/30 rounded-2xl p-8 shadow-panel-neon mb-8">
                <div className="flex items-center justify-between mb-8 pb-8 border-b border-engine-panel-border/20">
                    <div>
                        <h1 className="text-3xl font-extrabold text-white uppercase tracking-widest drop-shadow-[0_0_5px_rgba(255,255,255,0.3)] mb-2">System Status</h1>
                        <p className="text-gray-400 text-sm tracking-widest uppercase">Last checked: {new Date().toLocaleTimeString()}</p>
                    </div>
                    <div className="bg-green-500/20 border border-green-500/50 text-green-400 px-6 py-3 rounded-xl flex items-center gap-3 font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(34,197,94,0.3)]">
                        <CheckCircle2 className="w-6 h-6" /> All Systems Operational
                    </div>
                </div>

                <div className="space-y-4">
                    {services.map((s, i) => (
                        <div key={i} className="flex justify-between items-center bg-engine-bg/50 p-4 rounded-xl border border-engine-panel-border/20">
                            <span className="text-white font-bold tracking-widest uppercase text-sm">{s.name}</span>
                            <span className="flex items-center gap-2 text-green-400 text-xs font-bold uppercase tracking-widest">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_5px_rgba(34,197,94,0.8)]"></span>
                                {s.status}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default StatusPage;
