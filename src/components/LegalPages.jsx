import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const TermsOfService = () => {
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
        <div className="max-w-4xl mx-auto py-12 px-6 animate-fade-in">
            <button onClick={handleBack} className="flex items-center gap-2 text-gray-400 hover:text-[#00cfff] mb-8 font-bold text-sm transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <div className="bg-engine-panel border border-engine-panel-border/30 rounded-2xl p-8 shadow-panel-neon">
                <h1 className="text-3xl font-extrabold text-white mb-6 uppercase tracking-widest drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">Terms of Service</h1>
                <div className="space-y-6 text-gray-300 leading-relaxed text-sm">
                    <p>Last Updated: {new Date().toLocaleDateString()}</p>
                    <p>Welcome to Trade Income Planner (TIP). These Terms of Service outline the rules and regulations for the use of our platform.</p>
                    <h2 className="text-xl font-bold text-[#00cfff] mt-8">1. Terms</h2>
                    <p>By accessing this website, we assume you accept these terms and conditions. Do not continue to use TIP if you do not agree to take all of the terms and conditions stated on this page.</p>
                    <h2 className="text-xl font-bold text-[#00cfff] mt-8">2. Use License</h2>
                    <p>Permission is granted to temporarily download one copy of the materials on TIP's website for personal, non-commercial transitory viewing only.</p>
                    <h2 className="text-xl font-bold text-[#00cfff] mt-8">3. Disclaimer</h2>
                    <p>The materials on TIP's website are provided on an 'as is' basis. TIP makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.</p>
                    <p className="mt-8 text-xs text-gray-500 font-mono text-center">END OF DOCUMENT</p>
                </div>
            </div>
        </div>
    );
};

export const PrivacyPolicy = () => {
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
        <div className="max-w-4xl mx-auto py-12 px-6 animate-fade-in">
            <button onClick={handleBack} className="flex items-center gap-2 text-gray-400 hover:text-[#00cfff] mb-8 font-bold text-sm transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <div className="bg-engine-panel border border-engine-panel-border/30 rounded-2xl p-8 shadow-panel-neon">
                <h1 className="text-3xl font-extrabold text-white mb-6 uppercase tracking-widest drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">Privacy Policy</h1>
                <div className="space-y-6 text-gray-300 leading-relaxed text-sm">
                    <p>Last Updated: {new Date().toLocaleDateString()}</p>
                    <p>Your privacy is critically important to us. At TIP, we have a few fundamental principles:</p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>We don’t ask you for personal information unless we truly need it.</li>
                        <li>We don’t share your personal information with anyone except to comply with the law, develop our products, or protect our rights.</li>
                        <li>We don’t store personal information on our servers unless required for the on-going operation of one of our services.</li>
                    </ul>
                    <h2 className="text-xl font-bold text-[#00cfff] mt-8">Information We Collect</h2>
                    <p>We only collect information about you if we have a reason to do so—for example, to provide our Services, to communicate with you, or to make our Services better.</p>
                    <p className="mt-8 text-xs text-gray-500 font-mono text-center">END OF DOCUMENT</p>
                </div>
            </div>
        </div>
    );
};

export const CookiePolicy = () => {
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
        <div className="max-w-4xl mx-auto py-12 px-6 animate-fade-in">
            <button onClick={handleBack} className="flex items-center gap-2 text-gray-400 hover:text-[#00cfff] mb-8 font-bold text-sm transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <div className="bg-engine-panel border border-engine-panel-border/30 rounded-2xl p-8 shadow-panel-neon">
                <h1 className="text-3xl font-extrabold text-white mb-6 uppercase tracking-widest drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">Cookie Policy</h1>
                <div className="space-y-6 text-gray-300 leading-relaxed text-sm">
                    <p>Last Updated: {new Date().toLocaleDateString()}</p>
                    <p>This Cookie Policy explains what cookies are and how we use them. You should read this policy so you can understand what type of cookies we use, or the information we collect using cookies and how that information is used.</p>
                    <h2 className="text-xl font-bold text-[#00cfff] mt-8">What are Cookies?</h2>
                    <p>Cookies are small pieces of text sent by your web browser by a website you visit. A cookie file is stored in your web browser and allows the Service or a third-party to recognize you and make your next visit easier and the Service more useful to you.</p>
                    <h2 className="text-xl font-bold text-[#00cfff] mt-8">How TIP uses Cookies</h2>
                    <p>When you use and access the Service, we may place a number of cookies files in your web browser. We use cookies for the following purposes: to enable certain functions of the Service, to provide analytics, to store your preferences, to enable advertisements delivery.</p>
                    <p className="mt-8 text-xs text-gray-500 font-mono text-center">END OF DOCUMENT</p>
                </div>
            </div>
        </div>
    );
};
