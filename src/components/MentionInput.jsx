import React, { useState, useEffect, useRef } from 'react';
import api from '../lib/axios';

const MentionInput = ({ value, onChange, placeholder, className, rows = 3, onKeyPress, autoFocus, name, ...props }) => {
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [cursorPos, setCursorPos] = useState(null);
    const [matchIndex, setMatchIndex] = useState(null);
    const textareaRef = useRef(null);

    // Sync external autoFocus
    useEffect(() => {
        if (autoFocus && textareaRef.current) {
            textareaRef.current.focus();
        }
    }, [autoFocus]);

    const handleChange = async (e) => {
        const val = e.target.value;
        onChange(e); // Trigger external change handler immediately

        const selectionStart = e.target.selectionStart;
        setCursorPos(selectionStart);

        // Get text up to cursor
        const textBeforeCursor = val.slice(0, selectionStart);
        // Regex to match @ followed by word characters right before cursor
        const match = /(?:^|\s)@(\w*)$/.exec(textBeforeCursor);

        if (match) {
            const query = match[1];
            setMatchIndex(match.index + (match[0].startsWith(' ') ? 1 : 0)); // index of the '@'
            
            try {
                // Search API
                const res = await api.get(`/users/search?q=${query}`);
                if (res.data.length > 0) {
                    setSuggestions(res.data);
                    setShowSuggestions(true);
                } else {
                    setShowSuggestions(false);
                }
            } catch (err) {
                console.error("Failed to fetch user suggestions", err);
                setShowSuggestions(false);
            }
        } else {
            setShowSuggestions(false);
        }
    };

    const handleSuggestionClick = (username) => {
        if (matchIndex === null) return;
        
        const val = value || "";
        const beforeMention = val.slice(0, matchIndex);
        const afterMention = val.slice(cursorPos);
        const newValue = `${beforeMention}@${username} ${afterMention}`;
        
        // Create synthetic event
        const syntheticEvent = {
            target: {
                name,
                value: newValue
            }
        };
        
        onChange(syntheticEvent);
        setShowSuggestions(false);
        
        // Restore focus
        if (textareaRef.current) {
            textareaRef.current.focus();
        }
    };

    const handleKeyDown = (e) => {
        if (showSuggestions && suggestions.length > 0) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSuggestionClick(suggestions[0].username);
                return;
            } else if (e.key === 'Escape') {
                setShowSuggestions(false);
            }
        } 
        
        if (onKeyPress && e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onKeyPress(e);
        }
    };

    // Close suggestions on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (textareaRef.current && !textareaRef.current.contains(event.target)) {
                // Timeout to allow suggestion click to register first
                setTimeout(() => setShowSuggestions(false), 200);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

    return (
        <div className="relative w-full">
            <textarea
                ref={textareaRef}
                value={value}
                name={name}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className={`resize-none ${className}`}
                rows={rows}
                {...props}
            />
            
            {showSuggestions && (
                <div className="absolute z-[100] mt-1 w-64 max-h-64 overflow-y-auto bg-[#0a0f1c]/95 backdrop-blur-xl border border-[#00cfff]/50 rounded-xl shadow-[0_10px_50px_rgba(0,207,255,0.3)] custom-scrollbar">
                    <div className="px-3 py-2 border-b border-[#00cfff]/20 text-[10px] text-[#00cfff] font-extrabold uppercase tracking-widest bg-[#030308]/50">
                        Select a User
                    </div>
                    {suggestions.map((user, idx) => (
                        <div
                            key={user.username}
                            onClick={() => handleSuggestionClick(user.username)}
                            className={`flex items-center gap-3 p-3 cursor-pointer transition-colors hover:bg-[#00cfff]/20 ${idx !== suggestions.length - 1 ? 'border-b border-[#00cfff]/10' : ''}`}
                        >
                            {user.avatar_url ? (
                                <img src={`${user.avatar_url.startsWith('http') ? '' : API_BASE_URL}${user.avatar_url}`} alt={user.username} className="w-8 h-8 rounded-full border border-[#00cfff]/50 shadow-[0_0_10px_rgba(0,207,255,0.2)] object-cover" />
                            ) : (
                                <div className="w-8 h-8 bg-[#030308] rounded-full border border-[#00cfff]/50 shadow-[0_0_10px_rgba(0,207,255,0.2)] flex items-center justify-center text-[#00cfff] text-xs font-bold">
                                    {user.username.substring(0, 2).toUpperCase()}
                                </div>
                            )}
                            <span className="text-white font-bold text-sm drop-shadow-[0_0_2px_rgba(255,255,255,0.5)]">{user.username}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MentionInput;
