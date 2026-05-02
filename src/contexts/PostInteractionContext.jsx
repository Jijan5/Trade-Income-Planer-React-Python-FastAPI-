import React, { createContext, useContext, useState, useRef, useCallback, useEffect, useMemo } from 'react';
import api from '../lib/axios';
import { TriangleAlert, Flag } from 'lucide-react';
import { useAuth } from './AuthContext';

const PostInteractionContext = createContext();

export const usePostInteractions = () => useContext(PostInteractionContext);

export const PostInteractionProvider = ({ children, showFlash }) => {
    const { userData } = useAuth();
    const currentUser = userData?.username;

    // Interaction States
    const [reactionModalPostId, setReactionModalPostId] = useState(null);
    const longPressTimer = useRef(null);
    const isLongPress = useRef(false);
    const [expandedComments, setExpandedComments] = useState({});
    const [commentsData, setCommentsData] = useState({});
    const [newCommentText, setNewCommentText] = useState({});
    const [previewImage, setPreviewImage] = useState(null);

    // Reply & Mention States
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyContent, setReplyContent] = useState("");
    const [mentionState, setMentionState] = useState({ active: false, query: "", suggestions: [], target: null, position: { top: 0, left: 0 } });
    const mentionDebounceTimer = useRef(null);
    const [activeMenu, setActiveMenu] = useState(null);
    const [editingItem, setEditingItem] = useState(null);
    const menuRef = useRef(null);

    // Custom Modal States
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, commentId: null, postId: null });
    const [reportModal, setReportModal] = useState({ isOpen: false, postId: null, reason: "" });

    const reactions = [
        { emoji: "👍", label: "Like", type: "like" },
        { emoji: "❤️", label: "Love", type: "love" },
        { emoji: "😮", label: "Shock", type: "shock" },
        { emoji: "🚀", label: "Rocket", type: "rocket" },
        { emoji: "📈", label: "Bullish", type: "chart_up" },
        { emoji: "👏", label: "Clap", type: "clap" },
    ];

    const getReactionEmoji = (type) => reactions.find((r) => r.type === type)?.emoji || "👍";

    // Handle Click Outside to close Reaction Modal
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (reactionModalPostId) {
                // Close if click is NOT inside .reaction-modal AND NOT on the trigger button
                if (!event.target.closest('.reaction-modal') && !event.target.closest('.reaction-trigger')) {
                    setReactionModalPostId(null);
                }
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [reactionModalPostId]);

    // Handle Click Outside to close Active Menu (Dropdown)
    useEffect(() => {
        const handleClickOutsideMenu = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setActiveMenu(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutsideMenu);
        return () => document.removeEventListener('mousedown', handleClickOutsideMenu);
    }, [activeMenu]);

    const handleReaction = useCallback(async (post, type, isFromLongPress = false) => {
        const token = localStorage.getItem("token");
        if (!token) return showFlash("Please login to react.", "error");

        // The update logic will be handled by the component that fetches the posts
        // This context only provides the API call
        try {
            if (post.user_reaction === type) {
                await api.delete(`/posts/${post.id}/react`);
            } else {
                await api.post(`/posts/${post.id}/react`, { type });
            }
            return { success: true, postId: post.id, reactionType: type, isLongPress: isFromLongPress };
        } catch (error) {
            console.error("Reaction failed", error);
            showFlash("Reaction failed. Please try again.", "error");
            return { success: false };
        } finally {
            setReactionModalPostId(null);
        }
    }, [showFlash]);

    const handlePressStart = useCallback((postId) => {
        if (longPressTimer.current) clearTimeout(longPressTimer.current);
        isLongPress.current = false;
        longPressTimer.current = setTimeout(() => {
            isLongPress.current = true;
            setReactionModalPostId(postId);
        }, 500);
    }, []);

    const handlePressEnd = useCallback(async (post) => {
        clearTimeout(longPressTimer.current);
        if (isLongPress.current) {
            return { success: false, isLongPress: true }; // Return status long press
        }    
        return await handleReaction(post, post.user_reaction || "like", false);
    }, [handleReaction]);

    const toggleComments = useCallback(async (postId) => {
        const isExpanded = !!expandedComments[postId];
        setExpandedComments(prev => ({ ...prev, [postId]: !isExpanded  }));
        if (!isExpanded && !commentsData[postId]) {
            try {
                const res = await api.get(`/posts/${postId}/comments`);
                setCommentsData(prev => ({ ...prev, [postId]: res.data }));
            } catch (error) { console.error("Fetch comments failed", error); }
        }
    }, [expandedComments, commentsData]);

    const submitComment = useCallback(async (postId, content, parentId = null) => {
        const token = localStorage.getItem("token");
        if (!content || !content.trim()) return;
        if (!token) return showFlash("Please login to comment.", "error");

        try {
            const res = await api.post(`/posts/${postId}/comments`, { content, parent_id: parentId });
            setCommentsData(prev => ({ ...prev, [postId]: [...(prev[postId] || []), res.data] }));
            if (parentId) { setReplyingTo(null); setReplyContent(""); }
            else { setNewCommentText(prev => ({ ...prev, [postId]: "" })); }
            return { success: true, postId }; // Return success to update post count
        } catch (error) {
            console.error("Comment failed", error);
            showFlash("Failed to submit comment.", "error");
            return { success: false };
        }
    }, [showFlash]);

    const handleShare = useCallback(async (postId) => {
        try {
            await api.post(`/posts/${postId}/share`);
            showFlash("Post shared!", "success");
            return { success: true, postId };
        } catch (error) {
            console.error("Share failed", error);
            showFlash("Failed to share post.", "error");
            return { success: false };
        }
    }, [showFlash]);

    const handleDeletePost = useCallback(async (postId) => {
        try {
            await api.delete(`/posts/${postId}`);
            setActiveMenu(null);
            return { success: true, postId };
        } catch (error) {
            showFlash("Failed to delete post", "error");
            return { success: false };
        }
    }, [showFlash]);

    const handleUpdatePost = useCallback(async (postData) => {
        if (!postData || !postData.content.trim()) return { success: false };
        try {
            const res = await api.put(`/posts/${postData.id}`, { content: postData.content });
            setEditingItem(null);
            return { success: true, updatedPost: res.data };
        } catch (error) {
            showFlash("Failed to update post", "error");
            return { success: false };
        }
    }, [showFlash]);

    const handleUpdateComment = useCallback(async (commentData) => {
        if (!commentData || !commentData.content.trim()) return { success: false };
        try {
            const res = await api.put(`/comments/${commentData.id}`, { content: commentData.content });
            const postId = res.data.post_id;
            setCommentsData(prev => ({
                ...prev,
                [postId]: prev[postId].map(c => c.id === commentData.id ? res.data : c)
            }));
            setEditingItem(null);
            return { success: true };
        } catch (error) {
            showFlash("Failed to update comment", "error");
            return { success: false };
        }
    }, [showFlash]);

    const handleDeleteComment = useCallback(async (commentId, postId) => {
        setConfirmModal({ isOpen: true, commentId, postId });
        return { success: false }; // Handled async in modal
    }, []);

    const confirmDeleteComment = useCallback(async () => {
        const { commentId, postId } = confirmModal;
        if (!commentId) return;
        try {
            await api.delete(`/comments/${commentId}`);
            setCommentsData(prev => ({
                ...prev,
                [postId]: prev[postId].filter(c => c.id !== commentId)
            }));
            setActiveMenu(null);
            showFlash("Comment deleted", "success");
        } catch (error) {
            showFlash("Failed to delete comment", "error");
        } finally {
            setConfirmModal({ isOpen: false, commentId: null, postId: null });
        }
    }, [confirmModal, showFlash]);

    const handleReportPost = useCallback((postId) => {
        setReportModal({ isOpen: true, postId, reason: "" });
    }, []);

    const confirmReportPost = useCallback(async () => {
        const { postId, reason } = reportModal;
        if (!reason.trim()) { showFlash("Reason is required.", "error"); return; }
        try {
            await api.post("/reports", { post_id: postId, reason });
            showFlash("Report submitted. Thank you.", "success");
            setActiveMenu(null);
        } catch (error) {
            showFlash("Failed to submit report.", "error");
        } finally {
            setReportModal({ isOpen: false, postId: null, reason: "" });
        }
    }, [reportModal, showFlash]);

    const toggleMenu = useCallback((type, id) => {
        setActiveMenu(prev => (prev && prev.type === type && prev.id === id) ? null : { type, id });
    }, []);

    const startEditPost = useCallback((post) => {
        setEditingItem({ type: "post", id: post.id, content: post.content });
        setActiveMenu(null);
    }, []);

    const startEditComment = useCallback((comment) => {
        setEditingItem({ type: "comment", id: comment.id, content: comment.content });
        setActiveMenu(null);
    }, []);

    const value = useMemo(() => ({
        currentUser,
        userData,
        reactions,
        getReactionEmoji,
        handleReaction,
        handlePressStart,
        handlePressEnd,
        reactionModalPostId,
        setReactionModalPostId,
        toggleComments,
        expandedComments,
        commentsData,
        submitComment,
        newCommentText,
        setNewCommentText,
        handleShare,
        handleDeletePost,
        handleUpdatePost,
        handleDeleteComment,
        handleUpdateComment,
        handleReportPost,
        toggleMenu,
        activeMenu,
        setActiveMenu,
        menuRef,
        editingItem,
        setEditingItem,
        startEditPost,
        startEditComment,
        replyingTo,
        setReplyingTo,
        replyContent,
        setReplyContent,
        mentionState,
        setMentionState,
        mentionDebounceTimer,
        previewImage,
        setPreviewImage,
    }), [
        currentUser, userData, reactions, getReactionEmoji,
        handleReaction, handlePressStart, handlePressEnd,
        reactionModalPostId, toggleComments, expandedComments,
        commentsData, submitComment, newCommentText,
        handleShare, handleDeletePost, handleUpdatePost,
        handleDeleteComment, handleUpdateComment, handleReportPost,
        toggleMenu, activeMenu, editingItem,
        startEditPost, startEditComment,
        replyingTo, replyContent,
        mentionState, previewImage,
    ]);

    return (
        <PostInteractionContext.Provider value={value}>
            {children}
            
            {/* Context-Level Delete Comment Modal */}
            {confirmModal.isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-engine-bg/90 backdrop-blur-md p-4 animate-fade-in" onClick={() => setConfirmModal({ isOpen: false, commentId: null, postId: null })}>
                    <div className="bg-engine-panel/95 border border-red-500/30 p-8 rounded-2xl shadow-[0_0_30px_rgba(239,68,68,0.2)] max-w-sm w-full text-center" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-extrabold text-red-400 mb-4 uppercase tracking-widest drop-shadow-[0_0_5px_rgba(239,68,68,0.5)] flex flex-col items-center gap-3">
                            <TriangleAlert className="w-10 h-10" /> DELETE COMMENT?
                        </h3>
                        <p className="text-gray-400 text-sm mb-8 font-medium">ARE YOU SURE YOU WANT TO DELETE THIS COMMENT? THIS ACTION CANNOT BE UNDONE.</p>
                        <div className="flex justify-center gap-4">
                            <button onClick={() => setConfirmModal({ isOpen: false, commentId: null, postId: null })} className="px-6 py-2.5 rounded-xl bg-engine-bg border border-engine-neon/30 hover:bg-engine-button/10 text-engine-neon text-[11px] font-extrabold uppercase tracking-widest transition-all">CANCEL</button>
                            <button onClick={confirmDeleteComment} className="px-6 py-2.5 rounded-xl bg-red-600/20 border border-red-500/50 hover:bg-red-600 text-red-400 hover:text-white text-[11px] font-extrabold uppercase tracking-widest shadow-[0_0_15px_rgba(239,68,68,0.2)] hover:shadow-[0_0_25px_rgba(239,68,68,0.5)] transition-all">DELETE</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Context-Level Report Post Modal */}
            {reportModal.isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-engine-bg/90 backdrop-blur-md p-4 animate-fade-in" onClick={() => setReportModal({ isOpen: false, postId: null, reason: "" })}>
                    <div className="bg-engine-panel/95 border border-engine-neon/30 p-8 rounded-2xl shadow-[0_0_30px_rgba(var(--engine-neon-rgb),0.2)] max-w-sm w-full text-center" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-extrabold mb-4 uppercase tracking-widest flex flex-col items-center gap-3 text-engine-neon drop-shadow-[0_0_5px_rgba(var(--engine-neon-rgb),0.5)]">
                            <Flag className="w-10 h-10" /> REPORT POST
                        </h3>
                        <p className="text-gray-400 text-sm mb-4 font-medium">Please let us know why you are reporting this post:</p>
                        <input 
                            type="text" 
                            value={reportModal.reason} 
                            onChange={(e) => setReportModal({...reportModal, reason: e.target.value})} 
                            className="w-full bg-engine-bg border border-engine-neon/30 rounded-xl px-4 py-3 text-white text-xs font-mono focus:border-engine-neon focus:shadow-[0_0_15px_rgba(var(--engine-neon-rgb),0.2)] outline-none transition-all mb-8 placeholder:text-engine-neon/30"
                            placeholder="Reason for reporting..."
                            autoFocus
                            onKeyDown={(e) => { if (e.key === 'Enter') confirmReportPost(); if (e.key === 'Escape') setReportModal({...reportModal, isOpen: false}); }}
                        />
                        <div className="flex justify-center gap-4">
                            <button onClick={() => setReportModal({ isOpen: false, postId: null, reason: "" })} className="flex-1 py-2.5 rounded-xl bg-engine-bg border border-engine-neon/30 hover:bg-engine-button/10 text-engine-neon text-[11px] font-extrabold uppercase tracking-widest transition-all">CANCEL</button>
                            <button onClick={confirmReportPost} className="flex-1 py-2.5 rounded-xl bg-engine-button hover:bg-[#00e5ff] text-engine-bg shadow-[0_0_15px_rgba(var(--engine-neon-rgb),0.4)] hover:shadow-[0_0_25px_rgba(var(--engine-neon-rgb),0.6)] text-[11px] font-extrabold uppercase tracking-widest transition-all">REPORT</button>
                        </div>
                    </div>
                </div>
            )}
        </PostInteractionContext.Provider>
    );
};
