import React, { useState, useEffect, useRef } from 'react';
import api from '../lib/axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

const MentionInput = ({ value, onChange, placeholder, className, rows = 3, onKeyPress, autoFocus, name, ...props }) => {
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [cursorPos, setCursorPos] = useState(null);
    const [matchIndex, setMatchIndex] = useState(null);
    const textareaRef = useRef(null);
    const containerRef = useRef(null);

    // Sync external autoFocus
    useEffect(() => {
        if (autoFocus && textareaRef.current) {
            textareaRef.current.focus();
        }
    }, [autoFocus]);

    const handleChange = async (e) => {
        const val = e.target.value;
        onChange(e);

        const selectionStart = e.target.selectionStart;
        setCursorPos(selectionStart);

        const textBeforeCursor = val.slice(0, selectionStart);
        const match = /(?:^|\s)@(\w*)$/.exec(textBeforeCursor);

        if (match) {
            const query = match[1];
            setMatchIndex(match.index + (match[0].startsWith(' ') ? 1 : 0));
            try {
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

        onChange({ target: { name, value: newValue } });
        setShowSuggestions(false);
        setSuggestions([]);

        // Restore focus and position cursor after the inserted mention
        setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.focus();
                const newCursor = matchIndex + username.length + 2;
                textareaRef.current.setSelectionRange(newCursor, newCursor);
            }
        }, 0);
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

        if (!showSuggestions && onKeyPress && e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onKeyPress(e);
        }
    };

    // Close when clicking OUTSIDE the entire wrapper (textarea + dropdown)
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div ref={containerRef} className="relative w-full">
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

            {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-[100] mt-1 w-64 max-h-64 overflow-y-auto bg-engine-panel backdrop-blur-engine border border-engine-panel-border/50 rounded-xl shadow-[0_10px_50px_rgba(var(--engine-neon-rgb),0.3)] custom-scrollbar">
                    <div className="px-3 py-2 border-b border-engine-panel-border/20 text-[10px] text-engine-neon font-extrabold uppercase tracking-widest bg-engine-bg/50">
                        Select a User
                    </div>
                    {suggestions.map((user, idx) => (
                        <div
                            key={user.username}
                            // onMouseDown + preventDefault prevents the textarea from blurring
                            // before the selection registers — this was the root cause of the bug.
                            onMouseDown={(e) => {
                                e.preventDefault();
                                handleSuggestionClick(user.username);
                            }}
                            className={`flex items-center gap-3 p-3 cursor-pointer transition-colors hover:bg-engine-button/20 ${idx !== suggestions.length - 1 ? 'border-b border-engine-button-border/10' : ''}`}
                        >
                            {user.avatar_url ? (
                                <img
                                    src={`${user.avatar_url.startsWith('http') ? '' : API_BASE_URL}${user.avatar_url}`}
                                    alt={user.username}
                                    className="w-8 h-8 rounded-full border border-engine-panel-border/50 shadow-panel-neon object-cover"
                                />
                            ) : (
                                <div className="w-8 h-8 bg-engine-bg rounded-full border border-engine-panel-border/50 shadow-panel-neon flex items-center justify-center text-engine-neon text-xs font-bold">
                                    {user.username.substring(0, 2).toUpperCase()}
                                </div>
                            )}
                            <span className="text-white font-bold text-sm drop-shadow-[0_0_2px_rgba(255,255,255,0.5)]">
                                {user.username}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MentionInput;
