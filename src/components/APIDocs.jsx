import React from 'react';
import { ArrowLeft, Code, Database, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const APIDocs = () => {
    const navigate = useNavigate();
    const { token } = useAuth();

    const handleBack = () => {
        if (token) {
            navigate('/home');
        } else {
            navigate('/');
        }
    };
    return (
        <div className="max-w-5xl mx-auto py-12 px-6 animate-fade-in font-sans">
            <button onClick={handleBack} className="flex items-center gap-2 text-gray-400 hover:text-[#00cfff] mb-8 font-bold text-sm transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <div className="bg-engine-panel border border-engine-panel-border/30 rounded-2xl p-8 shadow-panel-neon mb-8">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-engine-button/20 border border-engine-button-border/50 rounded-xl flex items-center justify-center text-engine-neon shadow-button-neon">
                        <Code className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-extrabold text-white uppercase tracking-widest drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">Developer API</h1>
                        <p className="text-gray-400 text-sm font-bold tracking-widest uppercase">v1.0.0 Documentation</p>
                    </div>
                </div>
                <p className="text-gray-300 leading-relaxed mb-8">
                    Welcome to the TIP API. You can use our API to access Trade Income Planner API endpoints, which can get information on various users, posts, and simulation data in our database.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-engine-bg/50 border border-engine-panel-border/20 rounded-xl p-6">
                        <h3 className="text-[#00cfff] font-bold mb-2 flex items-center gap-2"><Globe className="w-4 h-4"/> Base URL</h3>
                        <code className="text-gray-300 text-sm font-mono block bg-black/50 p-3 rounded-lg border border-gray-800">
                            http://localhost:8000/api
                        </code>
                    </div>
                    <div className="bg-engine-bg/50 border border-engine-panel-border/20 rounded-xl p-6">
                        <h3 className="text-green-400 font-bold mb-2 flex items-center gap-2"><Database className="w-4 h-4"/> Authentication</h3>
                        <p className="text-gray-400 text-sm mb-2">Bearer Token Required</p>
                        <code className="text-gray-300 text-sm font-mono block bg-black/50 p-3 rounded-lg border border-gray-800">
                            Authorization: Bearer &lt;YOUR_API_KEY&gt;
                        </code>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <div className="bg-engine-panel border border-engine-panel-border/30 rounded-2xl p-6 shadow-panel-neon">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-md text-xs font-bold font-mono border border-blue-500/30">GET</span>
                        <h3 className="text-white font-bold tracking-widest uppercase text-sm">/posts</h3>
                    </div>
                    <p className="text-gray-400 text-sm mb-4">Retrieve a paginated list of public posts from the community feed. Includes user reactions, roles, and community contexts.</p>
                </div>
                
                <div className="bg-engine-panel border border-engine-panel-border/30 rounded-2xl p-6 shadow-panel-neon">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-md text-xs font-bold font-mono border border-green-500/30">POST</span>
                        <h3 className="text-white font-bold tracking-widest uppercase text-sm">/simulate</h3>
                    </div>
                    <p className="text-gray-400 text-sm mb-4">Run the Compound Growth Simulator engine. Provide an initial balance, win rate, risk percentage, and number of trades to calculate compounding projections.</p>
                </div>

                <div className="bg-engine-panel border border-engine-panel-border/30 rounded-2xl p-6 shadow-panel-neon">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="bg-purple-500/20 text-purple-400 px-3 py-1 rounded-md text-xs font-bold font-mono border border-purple-500/30">GET</span>
                        <h3 className="text-white font-bold tracking-widest uppercase text-sm">/price/{'{symbol}'}</h3>
                    </div>
                    <p className="text-gray-400 text-sm mb-4">Fetch real-time cryptocurrency market prices (e.g., BTCUSDT, ETHUSDT) directly from the platform's Binance integration.</p>
                </div>
            </div>
        </div>
    );
};

export default APIDocs;
