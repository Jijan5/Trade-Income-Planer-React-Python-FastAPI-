import React, { useState, useEffect, useRef, useCallback } from "react";
import api from "../lib/axios";
import { formatDistanceToNow } from 'date-fns';
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import VerifiedBadge from "./VerifiedBadge";
import { usePostInteractions } from "../contexts/PostInteractionContext";
import { getPlanLevel } from "../utils/permissions";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

// Memoized Single Post Item for Community
const CommunityPostItem = React.memo(({ post, onPostUpdate, onPostDelete, showFlash }) => {
  const { 
    currentUser, userData, reactions, getReactionEmoji, handleReaction, handlePressStart, handlePressEnd, 
    reactionModalPostId, setReactionModalPostId, toggleComments, expandedComments, commentsData, submitComment, newCommentText, 
    setNewCommentText, handleShare, handleDeletePost, handleUpdatePost, handleDeleteComment, handleUpdateComment, 
    toggleMenu, activeMenu, setActiveMenu, menuRef, editingItem, setEditingItem, startEditPost, 
    startEditComment, replyingTo, setReplyingTo, replyContent, setReplyContent, setPreviewImage 
  } = usePostInteractions();

  const isExpanded = !!expandedComments[post.id];
  const comments = commentsData[post.id];
  const commentText = newCommentText[post.id];
  // Local state for UI toggles specific to this post
  const [visibleLimit, setVisibleLimit] = useState(3);
  const [expandedReplies, setExpandedReplies] = useState({});

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [reportReason, setReportReason] = useState("Inappropriate Content");
  const [customReason, setCustomReason] = useState("");

  // Reset visible limit when comments are collapsed
  useEffect(() => { if (!isExpanded) setVisibleLimit(3); }, [isExpanded]);

  const handleLocalReaction = async (type) => {
    setReactionModalPostId(null);
    // 1. Optimized UI Update
    const oldReaction = post.user_reaction;
    const oldLikes = post.likes;
    const isSame = oldReaction === type;
    const newReaction = isSame ? null : type;
    
    let newLikes = oldLikes;
    if (isSame) newLikes = Math.max(0, newLikes - 1);
    else if (!oldReaction) newLikes += 1;

    onPostUpdate(post.id, { user_reaction: newReaction, likes: newLikes });

    // 2. send request to server
    const result = await handleReaction(post, type);
    // (Revert)
    if (!result.success) onPostUpdate(post.id, { user_reaction: oldReaction, likes: oldLikes });
  };

  const handleLocalPressEnd = async () => {
    if (reactionModalPostId === post.id) {
      await handlePressEnd(post);
      return;
  }
    const oldReaction = post.user_reaction;
    const oldLikes = post.likes;
    const isUnliking = !!oldReaction;
    const newReaction = isUnliking ? null : "like";
    const newLikes = isUnliking ? Math.max(0, oldLikes - 1) : oldLikes + 1;

    onPostUpdate(post.id, { user_reaction: newReaction, likes: newLikes });
    const result = await handlePressEnd(post);
    if (!result.success || result.isLongPress) {
      onPostUpdate(post.id, { user_reaction: oldReaction, likes: oldLikes });
    }
  };

  const handleLocalDeletePost = () => {
    setActiveMenu(null);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    const result = await handleDeletePost(post.id);
    if (result.success) onPostDelete(post.id);
    setShowDeleteModal(false);
  };

  const handleLocalUpdatePost = async () => {
    const result = await handleUpdatePost(editingItem);
    if (result.success) onPostUpdate(result.updatedPost.id, result.updatedPost);
  };

  const handleLocalToggleMenu = (type, id) => {
    setActiveMenu(activeMenu?.type === type && activeMenu?.id === id ? null : { type, id });
  };

  const handleReportClick = () => {
    setActiveMenu(null);
    setShowReportModal(true);
  };

  const submitReport = async () => {
    const finalReason = reportReason === "Other" ? customReason : reportReason;
    if (!finalReason.trim()) return showFlash("Please specify a reason.", "error");
    try {
      await api.post("/reports", { post_id: post.id, reason: finalReason });
      showFlash("Post reported successfully.", "success");
      setShowReportModal(false);
      setCustomReason("");
      setReportReason("Inappropriate Content");
    } catch (error) {
      showFlash(error.response?.data?.detail || "Failed to report post.", "error");
    }
  };

  const handleShareOption = (platform) => {
    const shareUrl = `${window.location.origin}/post/${post.id}`;
    const shareText = `Check out this post by ${post.username} on Trade Income Planner!`;

    switch (platform) {
      case 'x':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
        break;
      case 'instagram':
        navigator.clipboard.writeText(shareUrl);
        showFlash("Link copied! Paste it on Instagram.", "success");
        break;
      case 'copy':
        navigator.clipboard.writeText(shareUrl);
        showFlash("Link copied to clipboard!", "success");
        break;
      default:
        break;
    }
    
    handleShare(post.id);
    setShowShareModal(false);
  };

  return (
    <div key={post.id} id={`post-${post.id}`} className="bg-[#0a0f1c]/60 backdrop-blur-md p-6 rounded-2xl border border-[#00cfff]/20 shadow-[0_0_15px_rgba(0,207,255,0.05)] relative overflow-hidden group/post">
            {/* Ambient Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#00cfff]/5 via-transparent to-transparent opacity-0 group-hover/post:opacity-100 transition-opacity duration-700 pointer-events-none"></div>

            {/* Post Header & Menu */}
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-3">
                {post.avatar_url ? (
                  <img src={post.avatar_url.startsWith('http') ? post.avatar_url : `${API_BASE_URL}${post.avatar_url}`} alt={post.username} className="w-8 h-8 rounded-full object-cover border border-[#00cfff]/30 shadow-[0_0_10px_rgba(0,207,255,0.1)]" />
                ) : (
                  <div className="w-8 h-8 bg-[#030308] border border-[#00cfff]/30 rounded-full flex items-center justify-center text-[#00cfff] font-extrabold uppercase tracking-widest text-[10px] shadow-[0_0_10px_rgba(0,207,255,0.1)]">
                    {post.username.substring(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-sm font-bold text-white flex items-center">
                    {post.username}
                    <VerifiedBadge user={post} />
                  </p>
                  <p className="text-[10px] text-gray-500">
                    {(() => {
                      try { return formatDistanceToNow(new Date(post.created_at), { addSuffix: true }); } catch (e) { return ""; }
                    })()}
                    {post.is_edited && <span className="ml-1 italic opacity-75">(edited)</span>}
                  </p>
                </div>
              </div>
              {/* Post Menu */}
                <div className="relative">
                  <button onClick={() => handleLocalToggleMenu("post", post.id)} className="text-gray-400 hover:text-white p-1">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                    </svg>
                  </button>
                  {activeMenu?.type === "post" && activeMenu?.id === post.id && (
                    <div ref={menuRef} className="absolute right-0 mt-2 w-36 border border-[#00cfff]/30 rounded-xl shadow-[0_0_20px_rgba(0,207,255,0.15)] z-20 overflow-hidden bg-[#030308]/95 backdrop-blur-md">
                      {currentUser === post.username || userData?.role === 'admin' ? (
                        <>
                          {currentUser === post.username && (
                            <button onClick={() => startEditPost(post)} className="w-full text-left px-4 py-3 text-sm text-[#00cfff] hover:bg-[#00cfff]/10 transition-colors font-bold">Edit</button>
                          )}
                          <button onClick={handleLocalDeletePost} className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors font-bold">Delete</button>
                          </>
                      ) : (
                        <button onClick={handleReportClick} className="w-full text-left px-4 py-3 text-sm text-yellow-400 hover:bg-yellow-500/10 transition-colors font-bold">Report</button>
                      )}
                    </div>
                  )}
                </div>
            </div>
            {/* Post Content */}
            {editingItem?.type === "post" && editingItem?.id === post.id ? (
              <div className="space-y-3 relative z-10">
                <textarea value={editingItem.content} onChange={(e) => setEditingItem({ ...editingItem, content: e.target.value })} className="w-full bg-[#030308]/80 border border-[#00cfff]/30 rounded-xl p-4 text-white text-sm focus:border-[#00cfff] focus:shadow-[0_0_10px_rgba(0,207,255,0.2)] outline-none transition-all" rows={4} />
                <div className="flex justify-end gap-3">
                  <button onClick={() => setEditingItem(null)} className="text-xs text-[#00cfff]/70 hover:text-[#00cfff] px-4 py-2 border border-[#00cfff]/20 hover:bg-[#00cfff]/10 rounded-lg transition-colors font-bold">Cancel</button>
                  <button onClick={handleLocalUpdatePost} className="text-xs bg-[#00cfff] text-[#030308] px-4 py-2 rounded-lg hover:shadow-[0_0_15px_rgba(0,207,255,0.6)] hover:bg-[#00e5ff] transition-all font-extrabold tracking-wide">Save</button>
                </div>
              </div>
            ) : (
              <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                {post.content.split(/(@\w+)/g).map((part, i) =>
                  part.startsWith("@") ? (<strong key={i} className="text-blue-500 font-normal">{part}</strong>) : (part)
                )}
              </p>
            )}
            {post.image_url && (
              <div className="mt-4 rounded-xl overflow-hidden border border-[#00cfff]/10 relative z-10 group/img">
                <img src={`${API_BASE_URL}${post.image_url}`} alt="Post attachment" className="w-full h-auto max-h-[450px] object-cover cursor-pointer group-hover/img:scale-[1.02] transition-transform duration-500" onClick={() => setPreviewImage(`${API_BASE_URL}${post.image_url}`)} />
              </div>
            )}
            {post.link_url && (
              <a href={post.link_url} target="_blank" rel="noreferrer" className="block mt-4 p-4 bg-[#0a0f1c]/80 border border-[#00cfff]/20 rounded-xl text-[#00cfff] text-sm hover:bg-[#00cfff]/10 hover:shadow-[0_0_10px_rgba(0,207,255,0.1)] transition-all truncate relative z-10">🔗 {post.link_url}</a>
            )}
            {/* Actions */}
            <div className="flex items-center gap-6 mt-4 pt-4">
              <div className="relative group">
              <button onMouseDown={() => handlePressStart(post.id)} onMouseUp={handleLocalPressEnd} onTouchStart={() => handlePressStart(post.id)} onTouchEnd={handleLocalPressEnd}  className={`reaction-trigger flex items-center gap-2 transition-colors ${post.user_reaction ? "text-blue-400" : "text-gray-400 hover:text-blue-400"}`}>
                  {post.user_reaction ? <span className="text-xl">{getReactionEmoji(post.user_reaction)}</span> : <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.5c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a2.25 2.25 0 012.25 2.25V7.5h3.75a2.25 2.25 0 012.25 2.25v6.75a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 16.5v-6a2.25 2.25 0 012.25-2.25v-.003zM6.75 16.5v-6" /></svg>}
                  <span className="text-sm font-bold">{post.likes > 0 ? post.likes : ""}</span>
                </button>
                {reactionModalPostId === post.id && (
                  <div className="absolute bottom-full left-0 mb-2 flex border bg-gray-800 border-gray-600 rounded-full p-1 shadow-xl gap-1 z-10 animate-fade-in w-max reaction-modal">
                    {reactions.map((r) => (
                      <button key={r.type} onClick={() => handleLocalReaction(r.type)} className="p-2 rounded-full transition-transform hover:scale-125 text-xl" title={r.label}>{r.emoji}</button>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={() => toggleComments(post.id)} className="flex items-center gap-2 text-gray-400 hover:text-blue-400 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" /></svg>
                <span className="text-sm font-bold">{post.comments_count > 0 ? post.comments_count : ""}</span>
              </button>
              <button onClick={() => setShowShareModal(true)} className="flex items-center gap-2 text-gray-400 hover:text-blue-400 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.287.696.287 1.093 0 .397-.107.769-.287 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" /></svg>
                <span className="text-sm font-bold">{post.shares_count > 0 ? post.shares_count : ""}</span>
              </button>
            </div>
            {/* Comments Section */}
            {isExpanded && (
              <div className="mt-5 pt-5 border-t border-[#00cfff]/10 animate-fade-in relative z-10">
                {(() => {
                  const buildCommentTree = (comments) => {
                    const commentMap = {};
                    const topLevelComments = [];
                    if (!comments) return [];
                    comments.forEach((c) => { commentMap[c.id] = { ...c, children: [] }; });
                    comments.forEach((c) => { if (c.parent_id && commentMap[c.parent_id]) commentMap[c.parent_id].children.push(commentMap[c.id]); else topLevelComments.push(commentMap[c.id]); });
                    return topLevelComments;
                  };
                  const commentTree = buildCommentTree(comments || []);
                  const visibleComments = commentTree.slice(0, visibleLimit); // Use local state
                  const renderComment = (comment) => {
                    const hasReplies = comment.children && comment.children.length > 0;
                    const isRepliesExpanded = expandedReplies[comment.id];
                    return (
                      <div key={comment.id} className="mt-4" style={{ borderLeft: comment.parent_id ? "2px solid rgba(0, 207, 255, 0.2)" : "none", paddingLeft: comment.parent_id ? "1.5rem" : "0" }}>
                        <div className="bg-[#030308]/60 border border-[#00cfff]/10 p-4 rounded-xl text-sm group relative hover:border-[#00cfff]/30 hover:shadow-[0_0_15px_rgba(0,207,255,0.05)] transition-all">
                          {editingItem?.type === "comment" && editingItem?.id === comment.id ? (
                            <div className="space-y-3">
                              <input type="text" value={editingItem.content} onChange={(e) => setEditingItem({ ...editingItem, content: e.target.value })} className="w-full bg-[#0a0f1c] border border-[#00cfff]/40 rounded-lg px-3 py-2 text-white text-sm focus:border-[#00cfff] outline-none shadow-[0_0_10px_rgba(0,207,255,0.1)]" />
                              <div className="flex justify-end gap-3">
                                <button onClick={() => setEditingItem(null)} className="text-xs text-[#00cfff]/70 hover:text-[#00cfff] px-3 py-1.5 border border-[#00cfff]/20 hover:bg-[#00cfff]/10 rounded-md transition-colors font-bold">Cancel</button>
                                <button onClick={handleUpdateComment} className="text-xs bg-[#00cfff] text-[#030308] px-3 py-1.5 rounded-md hover:shadow-[0_0_10px_rgba(0,207,255,0.5)] font-bold transition-all">Save</button>
                              </div>
                            </div>
                          ) : (
                            <div className="pr-8">
                              <div className="flex items-center mb-1"><span className="font-bold text-[#00cfff] mr-2">{comment.username}</span><VerifiedBadge user={comment} /></div>
                              <p className="text-gray-300 leading-relaxed">
                                {(comment.content || "").split(/(@\w+)/g).map((part, i) =>
                                  part.startsWith("@") ? (<strong key={i} className="text-[#00cfff] font-bold drop-shadow-[0_0_5px_rgba(0,207,255,0.5)]">{part}</strong>) : (part)
                                )}
                              </p>
                              {comment.is_edited && <span className="ml-2 text-[10px] text-gray-500 italic opacity-70">(edited)</span>}
                            </div>
                          )}
                          <div className="flex items-center gap-5 mt-3 text-[11px] text-gray-500">
                            <span>{(() => { try { return formatDistanceToNow(new Date(comment.created_at), { addSuffix: true }); } catch (e) { return ""; } })()}</span>
                            <button onClick={() => { setReplyingTo({ commentId: comment.id, username: comment.username }); setReplyContent(""); }} className="hover:text-[#00cfff] font-bold transition-colors">Reply</button>
                            {(currentUser === comment.username || userData?.role === 'admin') && (
                              <div className="relative">
                                <button onClick={() => toggleMenu("comment", comment.id)} className="text-gray-500 hover:text-[#00cfff] transition-colors"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" /></svg></button>
                                {activeMenu?.type === "comment" && activeMenu?.id === comment.id && (
                                  <div ref={menuRef} className="absolute left-0 mt-2 w-28 border border-[#00cfff]/30 bg-[#030308]/95 backdrop-blur-md rounded-lg shadow-[0_0_15px_rgba(0,207,255,0.1)] z-20 overflow-hidden">
                                  {currentUser === comment.username && <button onClick={() => startEditComment(comment)} className="w-full text-left px-4 py-2 text-xs text-[#00cfff] hover:bg-[#00cfff]/10 font-bold transition-colors">Edit</button>}
                                  <button onClick={() => handleDeleteComment(comment.id, post.id)} className="w-full text-left px-4 py-2 text-xs text-red-400 hover:bg-red-500/10 font-bold transition-colors">Delete</button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        {replyingTo?.commentId === comment.id && (
                          <form onSubmit={(e) => { e.preventDefault(); submitComment(comment.post_id, replyContent, comment.id); }} className="mt-3 ml-10 flex gap-3 relative z-10">
                            <input type="text" name="replyInput" value={replyContent} onChange={(e) => setReplyContent(e.target.value)} placeholder={`Replying to ${comment.username}...`} className="flex-1 bg-[#030308] border border-[#00cfff]/30 rounded-lg px-4 py-2 text-white text-xs focus:border-[#00cfff] focus:shadow-[0_0_10px_rgba(0,207,255,0.2)] outline-none transition-all" autoFocus />
                            <button type="submit" className="text-xs bg-[#00cfff] text-[#030308] px-4 py-2 rounded-lg hover:shadow-[0_0_15px_rgba(0,207,255,0.6)] font-bold transition-all tracking-wide">Reply</button>
                            <button type="button" onClick={() => { setReplyingTo(null); setReplyContent(""); }} className="text-xs text-[#00cfff]/70 hover:text-[#00cfff] px-3 border border-transparent hover:border-[#00cfff]/20 hover:bg-[#00cfff]/10 rounded-lg transition-colors font-bold">Cancel</button>
                          </form>
                        )}
                        {hasReplies && !isRepliesExpanded && (
                          <button onClick={() => setExpandedReplies(prev => ({...prev, [comment.id]: true}))} className="text-[11px] text-[#00cfff]/70 hover:text-[#00cfff] font-bold mt-3 flex items-center gap-2 ml-4 transition-colors"><span className="transform rotate-90">↳</span> View {comment.children.length} {comment.children.length === 1 ? 'reply' : 'replies'}</button>
                        )}
                        {hasReplies && isRepliesExpanded && <div className="mt-4">{comment.children.map(renderComment)}</div>}
                      </div>
                    )
                  };
                  return (
                    <>
                      {visibleComments.length > 0 ? visibleComments.map(renderComment) : <p className="text-xs text-gray-500 italic px-2">No comments yet.</p>}
                      {commentTree.length > visibleLimit && <button onClick={() => setVisibleLimit(prev => prev + 10)} className="text-xs text-[#00cfff]/70 hover:text-[#00cfff] font-bold mt-5 w-full text-left pl-2 transition-colors">View more comments ({commentTree.length - visibleLimit})</button>}
                    </>
                  )
                })()}
                <div className="flex gap-3 mt-5 relative z-10">
                <input type="text" placeholder="Write a comment..." name={`commentInput-${post.id}`} value={commentText || ""} onChange={(e) => setNewCommentText(prev => ({ ...prev, [post.id]: e.target.value }))} className="flex-1 bg-[#030308]/80 border border-[#00cfff]/30 rounded-xl px-4 py-3 text-sm text-white focus:border-[#00cfff] focus:shadow-[0_0_15px_rgba(0,207,255,0.15)] outline-none transition-all" onKeyPress={(e) => e.key === "Enter" && submitComment(post.id, commentText)} />
                <button onClick={() => submitComment(post.id, commentText)} className="bg-[#00cfff] hover:bg-[#00e5ff] hover:shadow-[0_0_15px_rgba(0,207,255,0.6)] text-[#030308] px-6 py-2 rounded-xl text-sm font-extrabold transition-all tracking-wide">Send</button>
                </div>
              </div>
            )}
            {/* Report Modal */}
            {showReportModal && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#030308]/90 backdrop-blur-md p-4" onClick={() => setShowReportModal(false)}>
                <div className="bg-[#0a0f1c]/95 border border-[#00cfff]/30 p-8 rounded-2xl shadow-[0_0_30px_rgba(0,207,255,0.1)] max-w-sm w-full relative overflow-hidden" onClick={e => e.stopPropagation()}>
                  <h3 className="text-xl font-extrabold text-[#00cfff] mb-6 flex items-center gap-2"><span className="text-yellow-400">⚠️</span> Report Post</h3>
                  <div className="space-y-4 mb-6">
                    {["Inappropriate Content", "Spam", "Hate Speech", "Harassment", "False Information", "Other"].map((reason) => (
                      <label key={reason} className="flex items-center gap-3 cursor-pointer group">
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${reportReason === reason ? 'border-[#00cfff] bg-[#00cfff]/20' : 'border-gray-600 group-hover:border-[#00cfff]/50'}`}>
                          {reportReason === reason && <div className="w-2.5 h-2.5 rounded-full bg-[#00cfff] shadow-[0_0_5px_#00cfff]"></div>}
                        </div>
                        <input 
                          type="radio" 
                          name={`reportReason-${post.id}`}
                          value={reason} 
                          checked={reportReason === reason} 
                          onChange={(e) => setReportReason(e.target.value)}
                          className="hidden"
                        />
                        <span className={`text-sm transition-colors ${reportReason === reason ? 'text-white font-bold' : 'text-gray-400 group-hover:text-gray-200'}`}>{reason}</span>
                      </label>
                    ))}
                  </div>
                  
                  {reportReason === "Other" && (
                    <textarea
                      value={customReason}
                      onChange={(e) => setCustomReason(e.target.value)}
                      placeholder="Please describe the issue..."
                      className="w-full bg-[#030308] border border-[#00cfff]/30 rounded-xl p-3 text-white text-sm focus:border-[#00cfff] focus:shadow-[0_0_10px_rgba(0,207,255,0.2)] outline-none mb-6 h-24 resize-none transition-all"
                    />
                  )}

                  <div className="flex justify-end gap-3 pt-4 border-t border-[#00cfff]/10">
                    <button onClick={() => setShowReportModal(false)} className="px-5 py-2.5 rounded-xl border border-[#00cfff]/20 text-[#00cfff]/70 hover:text-[#00cfff] hover:bg-[#00cfff]/10 text-sm font-bold transition-all">Cancel</button>
                    <button onClick={submitReport} className="px-5 py-2.5 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500 hover:text-white hover:shadow-[0_0_15px_rgba(239,68,68,0.5)] text-sm font-bold transition-all">Report</button>
                  </div>
                </div>
              </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#030308]/90 backdrop-blur-md p-4" onClick={() => setShowDeleteModal(false)}>
                <div className="bg-[#0a0f1c]/95 border border-red-500/30 p-8 rounded-2xl shadow-[0_0_30px_rgba(239,68,68,0.15)] max-w-sm w-full text-center relative overflow-hidden" onClick={e => e.stopPropagation()}>
                  <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </div>
                  <h3 className="text-xl font-extrabold text-white mb-2">Delete Post?</h3>
                  <p className="text-gray-400 text-sm mb-8">This action cannot be undone. This will permanently delete your post and all associated comments.</p>
                  <div className="flex justify-center gap-4">
                    <button onClick={() => setShowDeleteModal(false)} className="px-6 py-2.5 rounded-xl border border-[#00cfff]/20 text-[#00cfff]/70 hover:text-[#00cfff] hover:bg-[#00cfff]/10 text-sm font-bold transition-all">Cancel</button>
                    <button onClick={confirmDelete} className="px-6 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)] hover:shadow-[0_0_25px_rgba(239,68,68,0.6)] text-sm font-bold transition-all">Delete</button>
                  </div>
                </div>
              </div>
            )}

            {/* Share Modal */}
            {showShareModal && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#030308]/90 backdrop-blur-md p-4" onClick={() => setShowShareModal(false)}>
                <div className="bg-[#0a0f1c]/95 border border-[#00cfff]/30 p-8 rounded-2xl shadow-[0_0_30px_rgba(0,207,255,0.1)] max-w-sm w-full relative overflow-hidden" onClick={e => e.stopPropagation()}>
                  <h3 className="text-xl font-extrabold text-[#00cfff] mb-8 text-center tracking-wider">Share Post</h3>
                  <div className="grid grid-cols-4 gap-4 mb-8">
                    <button onClick={() => handleShareOption('x')} className="flex flex-col items-center gap-3 group">
                      <div className="w-14 h-14 bg-[#030308] rounded-full flex items-center justify-center border border-gray-700 group-hover:border-white group-hover:shadow-[0_0_15px_rgba(255,255,255,0.2)] transition-all">
                        <span className="text-2xl text-white">𝕏</span>
                      </div>
                      <span className="text-xs font-bold text-gray-500 group-hover:text-gray-300">X</span>
                    </button>
                    <button onClick={() => handleShareOption('facebook')} className="flex flex-col items-center gap-3 group">
                      <div className="w-14 h-14 bg-[#1877F2]/10 rounded-full flex items-center justify-center border border-[#1877F2]/30 group-hover:bg-[#1877F2] group-hover:shadow-[0_0_15px_rgba(24,119,242,0.4)] transition-all">
                        <span className="text-2xl text-[#1877F2] group-hover:text-white font-serif font-bold">f</span>
                      </div>
                      <span className="text-xs font-bold text-gray-500 group-hover:text-gray-300">Facebook</span>
                    </button>
                    <button onClick={() => handleShareOption('instagram')} className="flex flex-col items-center gap-3 group">
                      <div className="w-14 h-14 bg-gradient-to-tr from-yellow-400/20 via-red-500/20 to-purple-500/20 rounded-full flex items-center justify-center border border-pink-500/30 group-hover:from-yellow-400 group-hover:via-red-500 group-hover:to-purple-500 group-hover:shadow-[0_0_15px_rgba(236,72,153,0.4)] transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-pink-500 group-hover:text-white transition-colors">
                          <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                        </svg>                      
                      </div>
                      <span className="text-xs font-bold text-gray-500 group-hover:text-gray-300">Instagram</span>
                    </button>
                    <button onClick={() => handleShareOption('copy')} className="flex flex-col items-center gap-3 group">
                      <div className="w-14 h-14 bg-[#00cfff]/10 rounded-full flex items-center justify-center border border-[#00cfff]/30 group-hover:bg-[#00cfff] group-hover:shadow-[0_0_15px_rgba(0,207,255,0.4)] transition-all">
                        <span className="text-2xl text-[#00cfff] group-hover:text-[#030308] transition-colors">🔗</span>
                      </div>
                      <span className="text-xs font-bold text-gray-500 group-hover:text-[#00cfff]">Copy Link</span>
                    </button>
                  </div>
                  <button onClick={() => setShowShareModal(false)} className="w-full py-3 bg-transparent border border-[#00cfff]/20 hover:bg-[#00cfff]/10 rounded-xl text-sm font-bold text-[#00cfff] transition-all">Cancel</button>
                </div>
              </div>
            )}
          </div>
        );
      });
      
      // Memoized Post Feed for Community
      const CommunityPostFeed = React.memo(({ posts, onPostUpdate, onPostDelete, showFlash }) => {
        return (
          <div className="space-y-4">
            {posts.length === 0 ? (
              <div className="text-center text-gray-500 py-10">
                No posts yet. Be the first to share!
              </div>
            ) : (
              posts.map((post) => (
                  <CommunityPostItem 
                      key={post.id} 
                      post={post}
                      onPostUpdate={onPostUpdate}
                      onPostDelete={onPostDelete}
                      showFlash={showFlash}
                  />
              ))
      )}
    </div>
  );
});

const Community = ({
  communities: propCommunities, // Receive communities from Ap
  highlightedPost,
  setHighlightedPost,
  showFlash,
}) => {
  const { userData } = useAuth();
  const { previewImage, setPreviewImage, mentionState, setMentionState } = usePostInteractions();
  const { id } = useParams();
  const navigate = useNavigate();
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [joinedCommunityIds, setJoinedCommunityIds] = useState([]);

  // Determine active community based on URL param
  const activeCommunity = id ? communities.find(c => c.id === parseInt(id)) : null;

  // Community Creation State
  const [showModal, setShowModal] = useState(false);
  const [newComm, setNewComm] = useState({
    name: "",
    description: "",
    bgType: "color", // color, gradient, image
    bgValue: "#1f2937",
    textColor: "#ffffff",
    fontFamily: "sans",
    hoverAnimation: "none",
    hoverColor: "#3b82f6",
    gradientStart: "#4facfe",
    gradientEnd: "#00f2fe",
    gradientDir: "to right",
  });
  const [isVip, setIsVip] = useState(false);
  const [commAvatar, setCommAvatar] = useState(null);
  const [commBgImage, setCommBgImage] = useState(null);
  const [previewCommAvatar, setPreviewCommAvatar] = useState(null);
  const [previewCommBg, setPreviewCommBg] = useState(null);

  // State join community
  const [posts, setPosts] = useState([]);
  const [newPostContent, setNewPostContent] = useState("");
  const [postImage, setPostImage] = useState({ file: null, preview: "" });
  const [newPostLink, setNewPostLink] = useState("");
  const [showLinkInput, setShowLinkInput] = useState(false);

  const fileInputRef = useRef(null);

  // Exit Modal State
  const [showExitModal, setShowExitModal] = useState(false);
  const [communityToExit, setCommunityToExit] = useState(null);

  // Members & Kick State
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [members, setMembers] = useState([]);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, message: "", onConfirm: null });

  // Fetch Communities
  const fetchCommunities = async () => {
    try {
      const response = await api.get("/communities");
      setCommunities(response.data);
    } catch (error) {
      console.error("Failed to fetch communities", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchJoinedCommunities = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await api.get("/users/me/joined_communities");
      setJoinedCommunityIds(res.data);
    } catch (e) {
      console.error("Failed to fetch joined communities", e);
    }
  };

  useEffect(() => {
    fetchCommunities();
    fetchJoinedCommunities();
  }, []);

  // Sync with prop communities if provided (optional, but good for consistency)
  useEffect(() => {
    if (propCommunities && propCommunities.length > 0) {
        setCommunities(propCommunities);
    }
  }, [propCommunities]);

  // Get Current User from Token
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setCurrentUser(payload.sub);
      } catch (error) {}
    }
  }, []);

  // Fetch Posts after join community
  useEffect(() => {
    if (activeCommunity) {
      fetchPosts(activeCommunity.id);
    }
  }, [activeCommunity]);

  // Scroll to highlighted post
  useEffect(() => {
    if (highlightedPost && posts.length > 0) {
      const element = document.getElementById(`post-${highlightedPost.postId}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        element.classList.add("ring-2", "ring-blue-500", "transition-all", "duration-500");
        setTimeout(() => {
          element.classList.remove("ring-2", "ring-blue-500");
          setHighlightedPost(null);
        }, 2000);
      }
    }
  }, [highlightedPost, posts, setHighlightedPost]);

  const fetchPosts = async (communityId) => {
    try {
      const response = await api.get(`/communities/${communityId}/posts`);

      setPosts(response.data);
    } catch (error) {
      console.error("Failed to fetch posts", error);
    }
  };

  // Handle Create Community
  const handleCreate = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    const planLevel = getPlanLevel(userData?.plan);

    const isAdmin = userData?.role === 'admin';

    if (!isAdmin) {
      if (planLevel < 2) return showFlash("Upgrade to Premium to create communities.", "error");
      // Premium limit: 3 communities. Platinum: Unlimited.
      const myOwnedCommunities = communities.filter(c => c.creator_username === currentUser);
      if (planLevel === 2 && myOwnedCommunities.length >= 3) return showFlash("Premium limit reached (3 communities). Upgrade to Platinum for unlimited.", "error");
    }
    if (!token) return showFlash("Please login first", "error");

    const formData = new FormData();
    formData.append("name", newComm.name);
    formData.append("description", newComm.description);
    formData.append("bg_type", newComm.bgType);
    formData.append("bg_value", newComm.bgValue);
    formData.append("text_color", newComm.textColor);
    formData.append("font_family", newComm.fontFamily);
    formData.append("hover_animation", newComm.hoverAnimation);
    formData.append("hover_color", newComm.hoverColor);
    if (isVip && (planLevel >= 3 || isAdmin)) formData.append("is_vip", "true");

    if (commAvatar) formData.append("avatar_file", commAvatar);
    if (commBgImage && newComm.bgType === "image")
      formData.append("bg_image_file", commBgImage);
    try {
      await api.post("/communities", formData, {
        headers: { "Content-Type": undefined },
      });
      setShowModal(false);
      // Reset form
      setNewComm({
        name: "",
        description: "",
        bgType: "color",
        bgValue: "#1f2937",
        textColor: "#ffffff",
        fontFamily: "sans",
        hoverAnimation: "none",
        hoverColor: "#3b82f6",
        gradientStart: "#4facfe",
        gradientEnd: "#00f2fe",
        gradientDir: "to right",
      });
      setIsVip(false);
      setCommAvatar(null);
      setCommBgImage(null);
      setPreviewCommAvatar(null);
      setPreviewCommBg(null);
      fetchCommunities(); // Refresh list without reload
      fetchJoinedCommunities();
    } catch (error) {
      // Reset form
      setNewComm({
        name: "",
        description: "",
        bgType: "color",
        bgValue: "#1f2937",
        textColor: "#ffffff",
        fontFamily: "sans",
        hoverAnimation: "none",
        hoverColor: "#3b82f6",
        gradientStart: "#4facfe",
        gradientEnd: "#00f2fe",
        gradientDir: "to right",
      });
      setCommAvatar(null);
      setCommBgImage(null);
      setPreviewCommAvatar(null);
      setPreviewCommBg(null);
    }
  };

  // Handle Join Community
  const handleJoinCommunity = async (e, comm) => {
    e.stopPropagation(); // Prevent entering card immediately
    const token = localStorage.getItem("token");
    if (!token) return showFlash("Please login to join.", "error");

    try {
      await api.post(`/communities/${comm.id}/join`);
      setJoinedCommunityIds([...joinedCommunityIds, comm.id]);
      setCommunities(
        communities.map((c) =>
          c.id === comm.id ? { ...c, members_count: c.members_count + 1 } : c
        )
      );
      // Optional: Auto enter after join
      navigate(`/community/${comm.id}`);
    } catch (error) {
      showFlash("Failed to join community.", "error");
    }
  };

  // Handle Exit Request
  const requestExitCommunity = (e, comm) => {
    e.stopPropagation();
    setCommunityToExit(comm);
    setShowExitModal(true);
  };

  // Handle Confirm Exit
  const confirmExitCommunity = async () => {
    if (!communityToExit) return;
    const token = localStorage.getItem("token");
    try {
      await api.post(`/communities/${communityToExit.id}/leave`);
      setJoinedCommunityIds(
        joinedCommunityIds.filter((id) => id !== communityToExit.id)
      );
      setCommunities(
        communities.map((c) =>
          c.id === communityToExit.id
            ? { ...c, members_count: Math.max(0, c.members_count - 1) }
            : c
        )
      );
      setShowExitModal(false);
      setCommunityToExit(null);
    } catch (error) {
      showFlash("Failed to leave community.", "error");
    }
  };

  // Handle Delete Community (Admin/Creator)
  const handleDeleteCommunity = async (e, communityId) => {
    e.stopPropagation();
    setConfirmModal({
      isOpen: true,
      message: "Are you sure you want to delete this community? This action cannot be undone and will delete all posts and members.",
      onConfirm: async () => {    
    const token = localStorage.getItem("token");
    try {
      await api.delete(`/communities/${communityId}`);
        setCommunities(communities.filter(c => c.id !== communityId));
        showFlash("Community deleted successfully.", "success");
    } catch (error) {
        console.error("Delete failed", error);
        showFlash(error.response?.data?.detail || "Failed to delete community.", "error");
    }
        }
      });
    };

    // Fetch Members
    const fetchMembers = async () => {
      try {
        const res = await api.get(`/communities/${activeCommunity.id}/members`);
        setMembers(res.data);
        setShowMembersModal(true);
      } catch (error) {
        showFlash("Failed to fetch members.", "error");
      }
    };

    // Handle Kick Member
    const handleKickMember = (username) => {
      setConfirmModal({
        isOpen: true,
        message: `Are you sure you want to kick ${username} from this community?`,
        onConfirm: async () => {
          try {
            await api.delete(`/communities/${activeCommunity.id}/members/${username}`);
            setMembers(members.filter(m => m.username !== username));
            showFlash(`${username} has been kicked.`, "success");
          } catch (error) {
            showFlash(error.response?.data?.detail || "Failed to kick member.", "error");
          }
      }
    });
  };

  const handlePaste = (e) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        setPostImage({ file: file, preview: URL.createObjectURL(file) });
        break; // Berhenti setelah menemukan gambar pertama
      }
    }
  };

  const handleInputChange = async (e) => {
    const val = e.target.value;
    setNewPostContent(val);

    // Mention Logic
    const selectionStart = e.target.selectionStart;
    const textBefore = val.substring(0, selectionStart);
    const lastAt = textBefore.lastIndexOf('@');

    if (lastAt !== -1) {
      const query = textBefore.substring(lastAt + 1);
      // Simple check: stop searching if space is typed
      if (!/\s/.test(query)) {
        try {
          const res = await api.get(`/users/search?q=${query}`);
          setMentionState({
            active: true,
            query,
            suggestions: res.data,
            position: { top: '100%', left: 0 } // Position handled by CSS relative to parent
          });
        } catch (err) { /* ignore */ }
      } else {
        setMentionState(prev => ({ ...prev, active: false }));
      }
    } else {
      setMentionState(prev => ({ ...prev, active: false }));
    }
  };

  const insertMention = (username) => {
    const parts = newPostContent.split('@');
    parts.pop(); // Remove the partial query
    const newValue = parts.join('@') + `@${username} `;
    setNewPostContent(newValue);
    setMentionState(prev => ({ ...prev, active: false }));
  };

  // Handle Create Post
  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!newPostContent.trim() && !postImage.file && !newPostLink.trim())
      return;

    const token = localStorage.getItem("token");
    if (!token) {
      showFlash("Please login to post.", "error");
      return;
    }

    const formData = new FormData();
    formData.append("content", newPostContent);
    if (newPostLink) {
      formData.append("link_url", newPostLink);
    }
    if (postImage.file) {
      formData.append("image_file", postImage.file);
    }

    try {
      await api.post(`/communities/${activeCommunity.id}/posts`, formData, {
        headers: { "Content-Type": undefined },
      });
      setNewPostContent("");
      setPostImage({ file: null, preview: "" });
      setNewPostLink("");
      setShowLinkInput(false);
      fetchPosts(activeCommunity.id); // Refresh feed
    } catch (error) {
      console.error("Failed to post", error);
      let msg = "Failed to post.";
      if (error.response) {
        msg = error.response.data.detail || "Server error.";
        if (error.response.status === 401)
          msg = "Session expired. Please login again.";
      }
      showFlash(msg, "error");
    }
  };

  const onPostUpdate = useCallback((postId, updatedFields) => {
    setPosts(prevPosts =>
      prevPosts.map(p =>
        p.id === postId ? { ...p, ...updatedFields } : p
      )
    );
  }, []);

  const onPostDelete = useCallback((postId) => {
    setPosts((prevPosts) => prevPosts.filter((p) => p.id !== postId));
  }, []);

  // Helper for Community Card Styles
  const getCardStyle = (comm) => {
    const style = {
      color: comm.text_color || "#ffffff",
      fontFamily:
        comm.font_family === "serif"
          ? "serif"
          : comm.font_family === "mono"
          ? "monospace"
          : "sans-serif",
      "--glow-color": comm.hover_color || "#3b82f6",
    };

    if (comm.bg_type === "image" && comm.bg_value) {
      style.backgroundImage = `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url(${API_BASE_URL}${comm.bg_value})`;
      style.backgroundSize = "cover";
      style.backgroundPosition = "center";
    } else if (comm.bg_type === "gradient") {
      style.background = comm.bg_value;
    } else {
      style.backgroundColor = comm.bg_value || "#1f2937";
    }
    if (comm.is_vip) {
      style.border = "2px solid #fbbf24"; // Gold border
    }
    return style;
  };

  // Filter Logic
  const filteredCommunities = communities.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- VIEW: COMMUNITY FEED (INSIDE GROUP) ---
  if (activeCommunity) {
    return (
      <div className="animate-fade-in space-y-6 max-w-4xl mx-auto">
        {/* Header Feed */}
        <div
          style={getCardStyle(activeCommunity)}
          className="p-8 rounded-2xl border border-[#00cfff]/20 flex items-center justify-between relative overflow-hidden transition-all shadow-[0_0_20px_rgba(0,207,255,0.1)] backdrop-blur-md"
        >
          {/* Glass overlay for when backgrounds are bright */}
          <div className="absolute inset-0 bg-[#030308]/40 backdrop-blur-sm z-0"></div>
          
          <div className="relative z-10 flex items-center gap-6">
            {activeCommunity.avatar_url ? (
              <img
                src={`${API_BASE_URL}${activeCommunity.avatar_url}`}
                alt={activeCommunity.name}
                className="w-20 h-20 rounded-full object-cover border-2 border-white/20 shadow-[0_0_15px_rgba(0,0,0,0.5)]"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center text-3xl font-extrabold border-2 border-white/20 shadow-[0_0_15px_rgba(0,0,0,0.5)] backdrop-blur-md">
                {activeCommunity.name.substring(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <button
                onClick={() => navigate("/community")}
                className="opacity-100 hover:opacity-100 text-sm mb-2 flex items-center gap-2 font-bold text-white hover:text-[#00cfff] transition-colors drop-shadow-md"
              >
                ← Back to Communities
              </button>
              <h2 className="text-3xl font-extrabold drop-shadow-lg tracking-wide">{activeCommunity.name}</h2>
              <p className="opacity-90 text-sm mt-1 max-w-lg drop-shadow-md font-medium">
                {activeCommunity.description}
              </p>
            </div>
          </div>
          <div className="text-right flex flex-col items-end gap-3 relative z-10">
            <button className="bg-[#030308]/80 text-white px-5 py-2 rounded-full text-xs font-bold border border-white/20 cursor-pointer hover:bg-white/20 hover:border-white/40 transition-all backdrop-blur-md shadow-lg" onClick={fetchMembers}>
              👥 {activeCommunity.members_count} Members
            </button>
            {(currentUser === activeCommunity.creator_username || userData?.role === 'admin') && (
               <span className="text-[10px] bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-3 py-1 rounded-full uppercase font-bold tracking-wider backdrop-blur-md">Creator View</span>
            )}
          </div>
        </div>

        {/* Create Post Box */}
        <div className="bg-[#0a0f1c]/60 p-6 rounded-2xl border border-[#00cfff]/20 shadow-[0_0_15px_rgba(0,207,255,0.05)] backdrop-blur-md mb-6">
          <form onSubmit={handlePostSubmit}>
            <div className="flex gap-4 sm:gap-5">
              <div className="flex-1 min-w-0">
                <div className="relative">
                  <textarea
                    value={newPostContent}
                    onChange={handleInputChange}
                    name="mainPostContent"
                    onPaste={handlePaste}
                    placeholder={`What's on your mind? Share a strategy or crypto news...`}
                    className="w-full bg-[#030308] border border-[#00cfff]/30 rounded-xl p-4 text-white focus:outline-none focus:border-[#00cfff] focus:shadow-[0_0_15px_rgba(0,207,255,0.15)] min-h-[120px] transition-all resize-none"
                  />
                  {/* Mention Box */}
                  {mentionState.active && mentionState.suggestions.length > 0 && (
                    <div className="absolute z-50 bg-[#030308]/95 backdrop-blur-md border border-[#00cfff]/30 rounded-xl shadow-[0_0_20px_rgba(0,207,255,0.2)] overflow-hidden mt-2 w-56 left-0 top-full">
                      {mentionState.suggestions.map((user) => (
                        <button
                          key={user.username}
                          onClick={() => insertMention(user.username)}
                          className="w-full text-left px-4 py-3 text-sm font-bold text-gray-300 hover:bg-[#00cfff]/20 hover:text-[#00cfff] transition-colors"
                        >
                          {user.username}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Image Preview */}
                {postImage.preview && (
                  <div className="mt-4 relative w-fit group">
                    <img
                      src={postImage.preview}
                      alt="Preview"
                      className="max-h-48 rounded-xl border border-[#00cfff]/30 shadow-[0_0_15px_rgba(0,207,255,0.1)]"
                    />
                    <button
                      type="button"
                      onClick={() => setPostImage({ file: null, preview: "" })}
                      className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm shadow-lg hover:bg-red-400 hover:scale-110 transition-all border border-red-400/50"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* Link Input */}
                {showLinkInput && (
                  <input
                    type="text"
                    placeholder="Paste a link URL..."
                    value={newPostLink}
                    onChange={(e) => setNewPostLink(e.target.value)}
                    className="w-full bg-[#030308] border border-[#00cfff]/30 rounded-xl px-4 py-3 text-sm text-white focus:border-[#00cfff] focus:shadow-[0_0_15px_rgba(0,207,255,0.15)] outline-none mt-4 transition-all"
                  />
                )}

                <div className="flex justify-between items-center mt-4">
                  {/* Media Buttons */}
                  <div className="flex gap-5">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current.click()}
                      className="text-gray-400 hover:text-[#00cfff] text-sm flex items-center gap-2 font-bold transition-colors"
                    >
                      <span className="text-lg">📷</span> Upload
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      hidden
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files[0])
                          setPostImage({
                            file: e.target.files[0],
                            preview: URL.createObjectURL(e.target.files[0]),
                          });
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowLinkInput(!showLinkInput)}
                      className="text-gray-400 hover:text-[#00cfff] text-sm flex items-center gap-2 font-bold transition-colors"
                    >
                      <span className="text-lg">🔗</span> Add Link
                    </button>
                  </div>

                  {/* Post Button */}
                  <button
                    type="submit"
                    className="bg-[#00cfff] hover:bg-[#00e5ff] text-[#030308] px-8 py-2.5 rounded-xl font-extrabold transition-all tracking-wide hover:shadow-[0_0_20px_rgba(0,207,255,0.5)] hover:-translate-y-0.5"
                  >
                    Post
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Posts Feed */}
        <CommunityPostFeed 
          posts={posts}
          onPostUpdate={onPostUpdate}
          onPostDelete={onPostDelete}
          showFlash={showFlash}
        />
        
        {/* Image Preview Modal */}
        {previewImage && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-[#030308]/95 backdrop-blur-md p-4"
            onClick={() => setPreviewImage(null)}
          >
            <button
              className="absolute top-6 right-6 text-[#00cfff]/70 hover:text-[#00cfff] hover:scale-110 transition-all bg-[#0a0f1c]/50 p-2 rounded-full border border-[#00cfff]/20"
              onClick={() => setPreviewImage(null)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <img
              src={previewImage}
              alt="Full Preview"
              className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-[0_0_30px_rgba(0,207,255,0.15)] border border-[#00cfff]/20"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
        {/* Members Modal */}
        {showMembersModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#030308]/90 backdrop-blur-md p-4 animate-fade-in">
            <div className="bg-[#0a0f1c]/95 border border-[#00cfff]/30 p-6 rounded-2xl shadow-[0_0_30px_rgba(0,207,255,0.1)] max-w-md w-full max-h-[80vh] overflow-y-auto custom-scrollbar">
              <div className="flex justify-between items-center mb-6 border-b border-[#00cfff]/10 pb-4">
                <h3 className="text-xl font-extrabold text-white flex items-center gap-2"><span className="text-[#00cfff]">👥</span> Community Members</h3>
                <button onClick={() => setShowMembersModal(false)} className="text-[#00cfff]/50 hover:text-[#00cfff] transition-colors text-xl font-bold">✕</button>
              </div>
              <div className="space-y-3">
                {members.map(member => (
                  <div key={member.user_id} className="flex items-center justify-between bg-[#030308]/60 p-4 rounded-xl border border-[#00cfff]/10 hover:border-[#00cfff]/30 transition-all group">
                    <div className="flex items-center gap-4">
                      {member.avatar_url ? (
                        <img src={`${API_BASE_URL}${member.avatar_url}`} alt={member.username} className="w-10 h-10 rounded-full object-cover shadow-[0_0_10px_rgba(0,207,255,0.1)]" />
                      ) : (
                        <div className="w-10 h-10 bg-[#00cfff]/10 rounded-full flex items-center justify-center text-sm font-bold text-[#00cfff] border border-[#00cfff]/20">
                          {member.username.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-bold text-gray-200 group-hover:text-white transition-colors">{member.username}</p>
                        <p className="text-[10px] text-gray-500 font-mono">Joined {new Date(member.joined_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    {(currentUser === activeCommunity.creator_username || userData?.role === 'admin') && member.username !== activeCommunity.creator_username && (
                      <button onClick={() => handleKickMember(member.username)} className="text-xs bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 px-3 py-1.5 rounded-lg transition-all font-bold shadow-[0_0_10px_rgba(239,68,68,0.1)]">
                        Kick
                      </button>
                    )}
                    {member.username === activeCommunity.creator_username && (
                      <span className="text-[10px] bg-[#00cfff]/10 text-[#00cfff] px-3 py-1.5 rounded-lg border border-[#00cfff]/20 font-bold tracking-wide">OWNER</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Generic Confirmation Modal */}
        {confirmModal.isOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#030308]/90 backdrop-blur-md p-4 animate-fade-in">
            <div className="bg-[#0a0f1c]/95 border border-[#00cfff]/30 p-8 rounded-2xl shadow-[0_0_30px_rgba(0,207,255,0.15)] max-w-sm w-full text-center relative overflow-hidden">
              <div className="w-16 h-16 bg-[#00cfff]/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#00cfff]/20 shadow-[0_0_15px_rgba(0,207,255,0.1)]">
                <span className="text-3xl text-[#00cfff]">?</span>
              </div>
              <h3 className="text-xl font-extrabold text-white mb-2">Are you sure?</h3>
              <p className="text-gray-400 text-sm mb-8 leading-relaxed">{confirmModal.message}</p>
              <div className="flex gap-4 justify-center">
                <button onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })} className="px-6 py-2.5 rounded-xl border border-[#00cfff]/20 text-[#00cfff]/70 hover:text-[#00cfff] hover:bg-[#00cfff]/10 text-sm font-bold transition-all">Cancel</button>
                <button onClick={() => { confirmModal.onConfirm(); setConfirmModal({ ...confirmModal, isOpen: false }); }} className="px-6 py-2.5 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500 hover:text-white hover:shadow-[0_0_15px_rgba(239,68,68,0.5)] text-sm font-bold transition-all">Confirm</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- VIEW: COMMUNITY LIST ---

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-[#0a0f1c]/60 p-8 rounded-2xl border border-[#00cfff]/20 shadow-[0_0_20px_rgba(0,207,255,0.05)] backdrop-blur-md">
        <div>
          <h2 className="text-3xl font-extrabold text-white flex items-center gap-3 drop-shadow-md">
            <span className="text-[#00cfff] drop-shadow-[0_0_10px_rgba(0,207,255,0.5)]">👥</span> Trader Communities
          </h2>
          <p className="text-gray-300 text-sm mt-2 font-medium opacity-90">
            Join discussions, share signals, and grow together in a cyberpunk ecosystem.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto relative z-10">
          <div className="relative w-full sm:w-72 group">
            <input
              type="text"
              placeholder="Search community..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#030308] border border-[#00cfff]/30 text-white pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:border-[#00cfff] focus:shadow-[0_0_15px_rgba(0,207,255,0.2)] transition-all"
            />
            <span className="absolute left-4 top-3.5 text-xl opacity-50 group-focus-within:opacity-100 transition-opacity">🔍</span>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-[#00cfff] hover:bg-[#00e5ff] text-[#030308] px-6 py-3 rounded-xl font-extrabold transition-all whitespace-nowrap shadow-[0_0_15px_rgba(0,207,255,0.4)] hover:shadow-[0_0_25px_rgba(0,207,255,0.6)] hover:-translate-y-0.5 tracking-wide"
          >
            + Create
          </button>
        </div>
      </div>

      {/* Community Cards Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-32">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-[#00cfff]/20 rounded-full"></div>
              <div className="w-16 h-16 border-4 border-[#00cfff] border-t-transparent rounded-full animate-spin absolute top-0 left-0 shadow-[0_0_15px_rgba(0,207,255,0.5)]"></div>
            </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCommunities.map((comm) => {
            const isCreator = currentUser === comm.creator_username;
            const isAdmin = userData?.role === 'admin';
            return (
              <div
                key={comm.id}
                style={getCardStyle(comm)}
                onClick={() => {
                  if (isAdmin || isCreator || joinedCommunityIds.includes(comm.id)) {
                    navigate(`/community/${comm.id}`);
                  }
                }}
                className={`rounded-2xl border border-[#00cfff]/20 p-8 transition-all duration-300 group relative overflow-hidden cursor-pointer
                ${comm.hover_animation === "scale" ? "hover:scale-[1.02]" : ""}
                ${
                  comm.hover_animation === "glow"
                    ? "hover:shadow-[0_0_30px_var(--glow-color)] hover:border-[#00cfff]/50"
                    : "hover:shadow-[0_0_20px_rgba(0,207,255,0.15)] hover:border-[#00cfff]/40"
                }
                ${comm.hover_animation === "none" ? "hover:-translate-y-1 hover:border-[#00cfff]/40" : ""}
              `}
              >
                {/* Glass overlay */}
                <div className="absolute inset-0 bg-[#030308]/60 group-hover:bg-[#030308]/40 backdrop-blur-sm transition-all duration-500 z-0"></div>

                {comm.is_vip && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black text-[10px] font-extrabold px-3 py-1 rounded-bl-xl z-10 flex items-center gap-1 shadow-[0_0_10px_rgba(234,179,8,0.5)] tracking-widest">
                    <span className="drop-shadow-sm">✨</span> VIP
                  </div>
                )}
                <div className="flex items-center gap-4 mb-6 relative z-10">
                  {comm.avatar_url ? (
                    <img
                    src={`${API_BASE_URL}${comm.avatar_url}`}
                    alt={comm.name}
                      className="w-16 h-16 rounded-full object-cover border-2 border-white/20 group-hover:border-white/40 transition-all shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-2xl font-extrabold border-2 border-white/20 group-hover:border-white/40 transition-all shadow-[0_0_10px_rgba(0,0,0,0.5)] backdrop-blur-md">
                      {comm.name.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3
                      className="text-2xl font-extrabold truncate drop-shadow-md"
                      style={{ color: comm.text_color }}
                    >
                      {comm.name}
                    </h3>
                    <p className="text-sm opacity-80 font-medium">
                      by <span className="text-[#00cfff]">{comm.creator_username}</span>
                    </p>
                  </div>
                  <span className="bg-[#10B981]/20 text-[#10B981] text-xs px-3 py-1 rounded-full border border-[#10B981]/40 flex items-center gap-2 font-bold backdrop-blur-md shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                    <span className="w-2 h-2 bg-[#10B981] rounded-full animate-pulse shadow-[0_0_5px_#10B981]"></span>
                    {comm.active_count} Online
                  </span>
                </div>

                <p
                  className="text-sm mb-8 line-clamp-2 h-10 opacity-90 relative z-10 font-medium leading-relaxed drop-shadow-sm"
                  style={{ color: comm.text_color }}
                >
                  {comm.description}
                </p>

                <div className="flex items-center justify-between border-t border-white/10 pt-5 relative z-10">
                  <div
                    className="flex items-center gap-2 text-sm opacity-90 font-bold"
                    style={{ color: comm.text_color }}
                  >
                    <span className="text-lg">👥</span>
                    <span className="font-mono text-base">
                      {comm.members_count.toLocaleString()}
                    </span>{" "}
                    Members
                  </div>
                  {isAdmin ? (
                    <div className="flex items-center gap-3">
                    <span
                      className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-1 rounded-full font-bold uppercase tracking-wider backdrop-blur-md"
                    >
                      Admin View
                    </span>
                    <button
                      onClick={(e) => handleDeleteCommunity(e, comm.id)}
                      className="text-red-400 hover:text-white p-2 rounded-lg bg-red-500/10 border border-red-500/20 hover:bg-red-500 hover:shadow-[0_0_15px_rgba(239,68,68,0.5)] transition-all"
                      title="Delete Community"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  </div>
                  ) : isCreator ? (
                    <div className="flex items-center gap-3">
                      <span
                        className="text-[10px] bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-3 py-1 rounded-full font-bold uppercase tracking-wider backdrop-blur-md"
                      >
                        Creator
                      </span>
                      <button
                        onClick={(e) => handleDeleteCommunity(e, comm.id)}
                        className="text-red-400 hover:text-white p-2 rounded-lg bg-red-500/10 border border-red-500/20 hover:bg-red-500 hover:shadow-[0_0_15px_rgba(239,68,68,0.5)] transition-all"
                        title="Delete Community"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                      </button>
                    </div>
                  ) : joinedCommunityIds.includes(comm.id) ? (
                    <button
                      onClick={(e) => requestExitCommunity(e, comm)}
                      className="text-sm font-extrabold hover:underline opacity-80 hover:opacity-100 hover:drop-shadow-[0_0_5px_currentColor] transition-all"
                      style={{ color: comm.text_color }}
                    >
                      Exit Group
                    </button>
                  ) : (
                    <button
                      onClick={(e) => handleJoinCommunity(e, comm)}
                      className="text-sm font-bold hover:underline"
                      style={{ color: comm.text_color }}
                    >
                      Join Group →
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#030308]/90 backdrop-blur-md p-4 overflow-y-auto custom-scrollbar">
          <div className="bg-[#0a0f1c]/95 border border-[#00cfff]/30 p-8 rounded-2xl shadow-[0_0_30px_rgba(0,207,255,0.1)] max-w-3xl w-full animate-fade-in my-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#00cfff] to-transparent opacity-50"></div>
            
            <h3 className="text-2xl font-extrabold text-white mb-6 flex items-center gap-3">
              <span className="text-[#00cfff] drop-shadow-[0_0_5px_#00cfff]">✨</span> Create New Community
            </h3>
            
            <form onSubmit={handleCreate} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Column: Basic Info */}
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-[#00cfff] mb-2 uppercase tracking-wider">
                      Avatar <span className="text-gray-500 normal-case font-normal">(Optional)</span>
                    </label>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-[#030308] overflow-hidden border-2 border-[#00cfff]/30 shadow-[0_0_10px_rgba(0,207,255,0.1)]">
                        {previewCommAvatar ? (
                          <img
                            src={previewCommAvatar}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="flex items-center justify-center h-full text-gray-500 text-xs font-bold">
                            No Img
                          </span>
                        )}
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            setCommAvatar(file);
                            setPreviewCommAvatar(URL.createObjectURL(file));
                          }
                        }}
                        className="text-xs text-[#00cfff]/70 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[#00cfff]/10 file:text-[#00cfff] hover:file:bg-[#00cfff]/20 transition-all cursor-pointer"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#00cfff] mb-2 uppercase tracking-wider">
                      Name
                    </label>
                    <input
                      type="text"
                      required
                      value={newComm.name}
                      onChange={(e) =>
                        setNewComm({ ...newComm, name: e.target.value })
                      }
                      className="w-full bg-[#030308] border border-[#00cfff]/30 rounded-xl text-white p-3 focus:border-[#00cfff] focus:shadow-[0_0_15px_rgba(0,207,255,0.2)] outline-none transition-all"
                      placeholder="e.g. Bitcoin Whales Indonesia"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#00cfff] mb-2 uppercase tracking-wider">
                      Description
                    </label>
                    <textarea
                      required
                      value={newComm.description}
                      onChange={(e) =>
                        setNewComm({ ...newComm, description: e.target.value })
                      }
                      className="w-full bg-[#030308] border border-[#00cfff]/30 rounded-xl text-white p-3 focus:border-[#00cfff] focus:shadow-[0_0_15px_rgba(0,207,255,0.2)] outline-none h-28 resize-none transition-all"
                      placeholder="Describe your community goal..."
                    />
                  </div>
                </div>

                {/* Right Column: Appearance */}
                <div className="space-y-6 md:border-l md:border-[#00cfff]/10 md:pl-8">
                  <h4 className="text-sm font-extrabold text-gray-300 uppercase tracking-widest border-b border-[#00cfff]/10 pb-2">
                    Appearance Config
                  </h4>

                  {/* Background Type */}
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">
                      Background Type
                    </label>
                    <select
                      value={newComm.bgType}
                      onChange={(e) =>
                        setNewComm({ ...newComm, bgType: e.target.value })
                      }
                      className="w-full bg-[#030308] border border-[#00cfff]/30 rounded-xl text-white p-3 text-sm focus:border-[#00cfff] outline-none transition-all"
                    >
                      <option value="color">Solid Color</option>
                      <option value="gradient">Gradient</option>
                      <option value="image">Upload Image</option>
                    </select>
                  </div>

                  {/* Background Value */}
                  {newComm.bgType === "image" ? (
                    <div>
                      <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">
                        Upload Background
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            setCommBgImage(file);
                            setPreviewCommBg(URL.createObjectURL(file));
                          }
                        }}
                        className="text-xs text-[#00cfff]/70 w-full file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[#00cfff]/10 file:text-[#00cfff] hover:file:bg-[#00cfff]/20 transition-all cursor-pointer"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">
                        {newComm.bgType === "color"
                          ? "Color Hex"
                          : "Gradient CSS"}
                      </label>
                      {newComm.bgType === "gradient" ? (
                        <div className="space-y-3 p-4 bg-[#030308]/50 rounded-xl border border-[#00cfff]/10">
                          <div className="flex gap-4">
                            <div className="flex-1">
                              <label className="text-[10px] text-gray-500 uppercase font-bold mb-1 block">
                                Start Color
                              </label>
                              <div className="flex items-center gap-2 bg-[#0a0f1c] border border-[#00cfff]/20 rounded-lg p-1.5 focus-within:border-[#00cfff] transition-colors">
                                <input
                                  type="color"
                                  value={newComm.gradientStart}
                                  onChange={(e) => {
                                    const newVal = e.target.value;
                                    setNewComm((prev) => ({
                                      ...prev,
                                      gradientStart: newVal,
                                      bgValue: `linear-gradient(${prev.gradientDir}, ${newVal}, ${prev.gradientEnd})`,
                                    }));
                                  }}
                                  className="h-6 w-6 bg-transparent border-0 cursor-pointer rounded"
                                />
                                <span className="text-xs text-[#00cfff] font-mono">
                                  {newComm.gradientStart}
                                </span>
                              </div>
                            </div>
                            <div className="flex-1">
                              <label className="text-[10px] text-gray-500 uppercase font-bold mb-1 block">
                                End Color
                              </label>
                              <div className="flex items-center gap-2 bg-[#0a0f1c] border border-[#00cfff]/20 rounded-lg p-1.5 focus-within:border-[#00cfff] transition-colors">
                                <input
                                  type="color"
                                  value={newComm.gradientEnd}
                                  onChange={(e) => {
                                    const newVal = e.target.value;
                                    setNewComm((prev) => ({
                                      ...prev,
                                      gradientEnd: newVal,
                                      bgValue: `linear-gradient(${prev.gradientDir}, ${prev.gradientStart}, ${newVal})`,
                                    }));
                                  }}
                                  className="h-6 w-6 bg-transparent border-0 cursor-pointer rounded"
                                />
                                <span className="text-xs text-[#00cfff] font-mono">
                                  {newComm.gradientEnd}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div>
                            <label className="text-[10px] text-gray-500 uppercase font-bold mb-1 block">
                              Direction
                            </label>
                            <select
                              value={newComm.gradientDir}
                              onChange={(e) => {
                                const newVal = e.target.value;
                                setNewComm((prev) => ({
                                  ...prev,
                                  gradientDir: newVal,
                                  bgValue: `linear-gradient(${newVal}, ${prev.gradientStart}, ${prev.gradientEnd})`,
                                }));
                              }}
                              className="w-full bg-[#0a0f1c] border border-[#00cfff]/20 rounded-lg text-white p-2 text-xs focus:border-[#00cfff] outline-none transition-colors"
                            >
                              <option value="to right">To Right →</option>
                              <option value="to left">To Left ←</option>
                              <option value="to bottom">To Bottom ↓</option>
                              <option value="to top">To Top ↑</option>
                              <option value="45deg">Diagonal ↗</option>
                              <option value="135deg">Diagonal ↘</option>
                            </select>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 bg-[#030308]/50 border border-[#00cfff]/20 rounded-xl p-2 w-fit">
                          <input
                            type="color"
                            value={newComm.bgValue}
                            onChange={(e) =>
                              setNewComm({
                                ...newComm,
                                bgValue: e.target.value,
                              })
                            }
                            className={`bg-transparent border-0 cursor-pointer rounded h-8 w-10`}
                          />
                          <span className="text-xs font-mono text-[#00cfff] pr-2">{newComm.bgValue}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">
                        Text Color
                      </label>
                      <div className="flex items-center gap-3 bg-[#030308]/50 border border-[#00cfff]/20 rounded-xl p-2 focus-within:border-[#00cfff] transition-colors">
                        <input
                          type="color"
                          value={newComm.textColor}
                          onChange={(e) =>
                            setNewComm({
                              ...newComm,
                              textColor: e.target.value,
                            })
                          }
                          className="h-6 w-8 bg-transparent border-0 cursor-pointer rounded"
                        />
                        <span className="text-xs text-[#00cfff] font-mono">
                          {newComm.textColor}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">
                        Font
                      </label>
                      <select
                        value={newComm.fontFamily}
                        onChange={(e) =>
                          setNewComm({ ...newComm, fontFamily: e.target.value })
                        }
                        className="w-full bg-[#030308]/50 border border-[#00cfff]/20 rounded-xl text-white p-2.5 text-sm focus:border-[#00cfff] outline-none transition-colors"
                      >
                        <option value="sans">Sans Serif</option>
                        <option value="serif">Serif</option>
                        <option value="mono">Monospace</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">
                      Hover Animation
                    </label>
                    <select
                      value={newComm.hoverAnimation}
                      onChange={(e) =>
                        setNewComm({
                          ...newComm,
                          hoverAnimation: e.target.value,
                        })
                      }
                      className="w-full bg-[#030308]/50 border border-[#00cfff]/20 rounded-xl text-white p-3 text-sm focus:border-[#00cfff] outline-none transition-colors"
                    >
                      <option value="none">None (Lift)</option>
                      <option value="scale">Scale Up</option>
                      <option value="glow">Glow</option>
                    </select>
                  </div>
                  {newComm.hoverAnimation === "glow" && (
                    <div className="animate-fade-in">
                      <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">
                        Glow Color
                      </label>
                      <div className="flex items-center gap-3 bg-[#030308]/50 border border-[#00cfff]/20 rounded-xl p-2 w-fit focus-within:border-[#00cfff] transition-colors">
                        <input
                          type="color"
                          value={newComm.hoverColor}
                          onChange={(e) =>
                            setNewComm({
                              ...newComm,
                              hoverColor: e.target.value,
                            })
                          }
                          className="h-6 w-8 bg-transparent border-0 cursor-pointer rounded"
                        />
                        <span className="text-xs text-[#00cfff] font-mono pr-2">
                          {newComm.hoverColor}
                        </span>
                      </div>
                    </div>
                  )}
                  {/* VIP Style Toggle (Platinum Only) */}
                  {(getPlanLevel(userData?.plan) >= 3 || userData?.role === 'admin') && (
                    <div className="pt-4 border-t border-[#00cfff]/10 mt-2">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${isVip ? 'bg-yellow-500 border-yellow-500' : 'bg-[#030308] border-gray-600 group-hover:border-yellow-500/50'}`}>
                          {isVip && <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                        </div>
                        <input type="checkbox" checked={isVip} onChange={(e) => setIsVip(e.target.checked)} className="hidden" />
                        <span className={`text-xs font-extrabold uppercase flex items-center gap-1 transition-colors ${isVip ? 'text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]' : 'text-gray-500 group-hover:text-yellow-500/70'}`}>
                          ✨ Enable VIP Style (Animated)
                        </span>
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Live Preview */}
              <div className="border-t border-[#00cfff]/20 pt-6">
                <label className="block text-sm font-extrabold text-[#00cfff] mb-4 uppercase tracking-widest text-center">
                  Live Preview
                </label>
                <div
                  style={{
                    color: newComm.textColor,
                    fontFamily:
                      newComm.fontFamily === "serif"
                        ? "serif"
                        : newComm.fontFamily === "mono"
                        ? "monospace"
                        : "sans-serif",
                    background:
                      newComm.bgType === "image" && previewCommBg
                        ? `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url(${previewCommBg})`
                        : newComm.bgType === "gradient"
                        ? newComm.bgValue
                        : newComm.bgValue,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundColor: newComm.bg_type === "color" ? newComm.bgValue : 'transparent',
                    "--glow-color": newComm.hoverColor,
                    border: isVip ? "3px solid #fbbf24" : "1px solid rgba(0, 207, 255, 0.3)",
                  }}
                  className={`rounded-2xl p-8 relative overflow-hidden transition-all duration-300 w-full max-w-md mx-auto group cursor-default
                  ${newComm.hoverAnimation === "scale" ? "hover:scale-[1.02]" : ""}
                  ${newComm.hoverAnimation === "glow"
                      ? "hover:shadow-[0_0_30px_var(--glow-color)]"
                      : "hover:shadow-[0_0_15px_rgba(0,0,0,0.5)]"
                  }
                  ${
                    newComm.hoverAnimation === "none"
                      ? "hover:-translate-y-1"
                      : ""
                  }
                  ${isVip ? "animate-pulse-slow shadow-[0_0_30px_rgba(251,191,36,0.2)]" : ""}
                `}
                >
                  <div className="absolute inset-0 bg-[#030308]/30 backdrop-blur-[2px] group-hover:bg-transparent transition-all duration-500 z-0"></div>

                  <div className="flex items-center gap-4 mb-6 relative z-10">
                    {previewCommAvatar ? (
                      <img
                        src={previewCommAvatar}
                        className="w-16 h-16 rounded-full object-cover border-2 border-white/20 shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-2xl font-extrabold border-2 border-white/20 shadow-[0_0_10px_rgba(0,0,0,0.5)] backdrop-blur-md">
                        {newComm.name
                          ? newComm.name.substring(0, 2).toUpperCase()
                          : "NA"}
                      </div>
                    )}
                    <div>
                      <h3 className="text-2xl font-extrabold drop-shadow-md">
                        {newComm.name || "Community Name"}
                      </h3>
                      <p className="text-sm opacity-80 font-medium">by <span className="text-[#00cfff]">You</span></p>
                    </div>
                  </div>
                  <p className="text-sm mb-8 opacity-90 leading-relaxed font-medium drop-shadow-sm relative z-10">
                    {newComm.description ||
                      "Community description will appear here..."}
                  </p>
                  <div className="flex items-center justify-between border-t border-white/20 pt-5 opacity-90 font-bold relative z-10">
                    <span className="text-sm flex items-center gap-2"><span className="text-lg">👥</span> 1 Member</span>
                    <span className="text-sm">Join Group →</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-transparent border border-[#00cfff]/30 hover:bg-[#00cfff]/10 text-[#00cfff] py-3 rounded-xl font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#00cfff] hover:bg-[#00e5ff] text-[#030308] py-3 rounded-xl font-extrabold transition-all hover:shadow-[0_0_20px_rgba(0,207,255,0.5)] tracking-wide"
                >
                  Create Community
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Exit Confirmation Modal */}
      {showExitModal && communityToExit && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#030308]/90 backdrop-blur-md p-4">
          <div className="bg-[#0a0f1c]/95 border border-[#00cfff]/30 p-8 rounded-2xl shadow-[0_0_30px_rgba(0,207,255,0.1)] max-w-sm w-full animate-fade-in text-center relative overflow-hidden">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
              <span className="text-3xl text-red-500">🚪</span>
            </div>
            <h3 className="text-xl font-extrabold text-white mb-2">
              Exit Community?
            </h3>
            <p className="text-gray-400 text-sm mb-8 leading-relaxed">
              Are you sure you want to leave{" "}
              <span className="text-[#00cfff] font-bold">
                {communityToExit.name}
              </span>
              ?
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setShowExitModal(false)}
                className="px-6 py-2.5 rounded-xl border border-[#00cfff]/20 text-[#00cfff]/70 hover:text-[#00cfff] hover:bg-[#00cfff]/10 text-sm font-bold transition-all"
              >
                No, Cancel
              </button>
              <button
                onClick={confirmExitCommunity}
                className="px-6 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)] text-sm font-bold transition-all"
              >
                Yes, Exit
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Generic Confirmation Modal for List View (Delete Community) */}
      {confirmModal.isOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#030308]/90 backdrop-blur-md p-4 animate-fade-in">
            <div className="bg-[#0a0f1c]/95 border border-[#00cfff]/30 p-8 rounded-2xl shadow-[0_0_30px_rgba(0,207,255,0.15)] max-w-sm w-full text-center relative overflow-hidden">
              <div className="w-16 h-16 bg-[#00cfff]/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#00cfff]/20 shadow-[0_0_15px_rgba(0,207,255,0.1)]">
                <span className="text-3xl text-[#00cfff]">?</span>
              </div>
              <h3 className="text-xl font-extrabold text-white mb-2">Are you sure?</h3>
              <p className="text-gray-400 text-sm mb-8 leading-relaxed">{confirmModal.message}</p>
              <div className="flex gap-4 justify-center">
                <button onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })} className="px-6 py-2.5 rounded-xl border border-[#00cfff]/20 text-[#00cfff]/70 hover:text-[#00cfff] hover:bg-[#00cfff]/10 text-sm font-bold transition-all">Cancel</button>
                <button onClick={() => { confirmModal.onConfirm(); setConfirmModal({ ...confirmModal, isOpen: false }); }} className="px-6 py-2.5 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500 hover:text-white hover:shadow-[0_0_15px_rgba(239,68,68,0.5)] text-sm font-bold transition-all">Confirm</button>
              </div>
            </div>
          </div>
      )}
    </div>
  );
};

export default Community;
