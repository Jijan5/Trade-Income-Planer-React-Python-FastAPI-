import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import api from '../lib/axios';
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
    }, [handleReaction, showFlash]);

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
        if (!window.confirm("Are you sure you want to delete this post?")) return { success: false };
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
        if (!window.confirm("Delete this comment?")) return { success: false };
        try {
            await api.delete(`/comments/${commentId}`);
            setCommentsData(prev => ({
                ...prev,
                [postId]: prev[postId].filter(c => c.id !== commentId)
            }));
            setActiveMenu(null);
            return { success: true, postId };
        } catch (error) {
            showFlash("Failed to delete comment", "error");
            return { success: false };
        }
    }, [showFlash]);

    const handleReportPost = useCallback(async (postId) => {
        const reason = prompt("Why are you reporting this post?");
        if (!reason) return;
        try {
            await api.post("/reports", { post_id: postId, reason });
            showFlash("Report submitted. Thank you.", "success");
            setActiveMenu(null);
        } catch (error) {
            showFlash("Failed to submit report.", "error");
        }
    }, [showFlash]);

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

    const value = {
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
    };

    return (
        <PostInteractionContext.Provider value={value}>
            {children}
        </PostInteractionContext.Provider>
    );
};
