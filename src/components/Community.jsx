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

  return (
    <div key={post.id} id={`post-${post.id}`} className="bg-gray-800 p-5 rounded-lg border border-gray-700">
            {/* Post Header & Menu */}
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-3">
                {post.user_avatar_url ? (
                  <img src={`${API_BASE_URL}${post.user_avatar_url}`} alt={post.username} className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
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
                    <div ref={menuRef} className="absolute right-0 mt-1 w-32 border border-gray-700 rounded-lg shadow-xl z-20 overflow-hidden">
                      {currentUser === post.username || userData?.role === 'admin' ? (
                        <>
                          {currentUser === post.username && (
                            <button onClick={() => startEditPost(post)} className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:text-white">Edit</button>
                          )}
                          <button onClick={handleLocalDeletePost} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:text-red-300">Delete</button>
                          </>
                      ) : (
                        <button onClick={handleReportClick} className="w-full text-left px-4 py-2 text-sm text-yellow-400 hover:text-yellow-300">Report</button>
                      )}
                    </div>
                  )}
                </div>
            </div>
            {/* Post Content */}
            {editingItem?.type === "post" && editingItem?.id === post.id ? (
              <div className="space-y-2">
                <textarea value={editingItem.content} onChange={(e) => setEditingItem({ ...editingItem, content: e.target.value })} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white text-sm focus:border-blue-500 outline-none" rows={3} />
                <div className="flex justify-end gap-2">
                  <button onClick={() => setEditingItem(null)} className="text-xs text-gray-400 hover:text-white px-3 py-1">Cancel</button>
                  <button onClick={handleLocalUpdatePost} className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-500">Save</button>
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
              <div className="mt-3 rounded-lg overflow-hidden border border-gray-700">
                <img src={`${API_BASE_URL}${post.image_url}`} alt="Post attachment" className="w-full h-auto max-h-[400px] object-cover cursor-pointer hover:opacity-90 transition-opacity" onClick={() => setPreviewImage(`${API_BASE_URL}${post.image_url}`)} />
              </div>
            )}
            {post.link_url && (
              <a href={post.link_url} target="_blank" rel="noreferrer" className="block mt-3 p-3 bg-gray-900/50 border border-gray-700 rounded text-blue-400 text-sm hover:underline truncate">🔗 {post.link_url}</a>
            )}
            {/* Actions */}
            <div className="flex items-center gap-6 mt-4 pt-4">
              <div className="relative group">
              <button onMouseDown={() => handlePressStart(post.id)} onMouseUp={handleLocalPressEnd} onTouchStart={() => handlePressStart(post.id)} onTouchEnd={handleLocalPressEnd}  className={`reaction-trigger flex items-center gap-2 transition-colors ${post.user_reaction ? "text-blue-400" : "text-gray-400 hover:text-blue-400"}`}>
                  {post.user_reaction ? <span className="text-xl">{getReactionEmoji(post.user_reaction)}</span> : <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.5c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a2.25 2.25 0 012.25 2.25V7.5h3.75a2.25 2.25 0 012.25 2.25v6.75a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 16.5v-6a2.25 2.25 0 012.25-2.25v-.003zM6.75 16.5v-6" /></svg>}
                  <span className="text-sm font-bold">{post.likes > 0 ? post.likes : ""}</span>
                </button>
                {reactionModalPostId === post.id && (
                  <div className="absolute bottom-full left-0 mb-2 flex border border-gray-600 rounded-full p-1 shadow-xl gap-1 z-10 animate-fade-in w-max reaction-modal">
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
              <button onClick={() => handleShare(post.id)} className="flex items-center gap-2 text-gray-400 hover:text-blue-400 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.287.696.287 1.093 0 .397-.107.769-.287 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" /></svg>
                <span className="text-sm font-bold">{post.shares_count > 0 ? post.shares_count : ""}</span>
              </button>
            </div>
            {/* Comments Section */}
            {isExpanded && (
              <div className="mt-4 pt-4 border-t border-gray-700/50 animate-fade-in">
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
                      <div key={comment.id} className="mt-3" style={{ borderLeft: comment.parent_id ? "2px solid #374151" : "none", paddingLeft: comment.parent_id ? "1rem" : "0" }}>
                        <div className="bg-gray-900/50 p-3 rounded text-sm group relative">
                          {editingItem?.type === "comment" && editingItem?.id === comment.id ? (
                            <div className="space-y-2">
                              <input type="text" value={editingItem.content} onChange={(e) => setEditingItem({ ...editingItem, content: e.target.value })} className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm focus:border-blue-500 outline-none" />
                              <div className="flex justify-end gap-2">
                                <button onClick={() => setEditingItem(null)} className="text-xs text-gray-400 hover:text-white px-2 py-0.5">Cancel</button>
                                <button onClick={handleUpdateComment} className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded hover:bg-blue-500">Save</button>
                              </div>
                            </div>
                          ) : (
                            <div className="pr-6">
                              <div className="flex items-center"><span className="font-bold text-blue-400 mr-1">{comment.username}</span><VerifiedBadge user={comment} /></div>
                              <p className="text-gray-300">
                                {(comment.content || "").split(/(@\w+)/g).map((part, i) =>
                                  part.startsWith("@") ? (<strong key={i} className="text-blue-500 font-normal">{part}</strong>) : (part)
                                )}
                              </p>
                              {comment.is_edited && <span className="ml-2 text-[10px] text-gray-500 italic">(edited)</span>}
                            </div>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-[10px] text-gray-400">
                            <span>{(() => { try { return formatDistanceToNow(new Date(comment.created_at), { addSuffix: true }); } catch (e) { return ""; } })()}</span>
                            <button onClick={() => { setReplyingTo({ commentId: comment.id, username: comment.username }); setReplyContent(""); }} className="hover:text-white font-bold">Reply</button>
                            {(currentUser === comment.username || userData?.role === 'admin') && (
                              <div className="relative">
                                <button onClick={() => toggleMenu("comment", comment.id)} className="text-gray-500 hover:text-white"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" /></svg></button>
                                {activeMenu?.type === "comment" && activeMenu?.id === comment.id && (
                                  <div ref={menuRef} className="absolute left-0 mt-1 w-24 border border-gray-600 rounded shadow-xl z-20">
                                  {currentUser === comment.username && <button onClick={() => startEditComment(comment)} className="w-full text-left px-3 py-1.5 text-xs text-gray-300">Edit</button>}
                                  <button onClick={() => handleDeleteComment(comment.id, post.id)} className="w-full text-left px-3 py-1.5 text-xs text-red-400">Delete</button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        {replyingTo?.commentId === comment.id && (
                          <form onSubmit={(e) => { e.preventDefault(); submitComment(comment.post_id, replyContent, comment.id); }} className="mt-2 ml-8 flex gap-2">
                            <input type="text" name="replyInput" value={replyContent} onChange={(e) => setReplyContent(e.target.value)} placeholder={`Replying to ${comment.username}...`} className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-xs focus:border-blue-500 outline-none" autoFocus />
                            <button type="submit" className="text-xs bg-blue-600 text-white px-3 rounded hover:bg-blue-500">Reply</button>
                            <button type="button" onClick={() => { setReplyingTo(null); setReplyContent(""); }} className="text-xs text-gray-400 hover:text-white">Cancel</button>
                          </form>
                        )}
                        {hasReplies && !isRepliesExpanded && (
                          <button onClick={() => setExpandedReplies(prev => ({...prev, [comment.id]: true}))} className="text-[11px] text-gray-400 hover:text-blue-400 font-bold mt-2 flex items-center gap-1 ml-2"><span className="transform rotate-90">↳</span> View {comment.children.length} {comment.children.length === 1 ? 'reply' : 'replies'}</button>
                        )}
                        {hasReplies && isRepliesExpanded && <div className="mt-3">{comment.children.map(renderComment)}</div>}
                      </div>
                    )
                  };
                  return (
                    <>
                      {visibleComments.length > 0 ? visibleComments.map(renderComment) : <p className="text-xs text-gray-500 italic">No comments yet.</p>}
                      {commentTree.length > visibleLimit && <button onClick={() => setVisibleLimit(prev => prev + 10)} className="text-xs text-gray-400 hover:text-white font-bold mt-4 w-full text-left pl-1">View more comments ({commentTree.length - visibleLimit})</button>}
                    </>
                  )
                })()}
                <div className="flex gap-2 mt-3">
                <input type="text" placeholder="Write a comment..." name={`commentInput-${post.id}`} value={commentText || ""} onChange={(e) => setNewCommentText(prev => ({ ...prev, [post.id]: e.target.value }))} className="flex-1 bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white focus:border-blue-500 outline-none" onKeyPress={(e) => e.key === "Enter" && submitComment(post.id, commentText)} />
                <button onClick={() => submitComment(post.id, commentText)} className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded text-sm font-bold">Send</button>
                </div>
              </div>
            )}
            {/* Report Modal */}
            {showReportModal && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setShowReportModal(false)}>
                <div className="bg-gray-800 border border-gray-600 p-6 rounded-xl shadow-2xl max-w-sm w-full" onClick={e => e.stopPropagation()}>
                  <h3 className="text-lg font-bold text-white mb-4">Report Post</h3>
                  <div className="space-y-3 mb-4">
                    {["Inappropriate Content", "Spam", "Hate Speech", "Harassment", "False Information", "Other"].map((reason) => (
                      <label key={reason} className="flex items-center gap-3 cursor-pointer group">
                        <input 
                          type="radio" 
                          name={`reportReason-${post.id}`}
                          value={reason} 
                          checked={reportReason === reason} 
                          onChange={(e) => setReportReason(e.target.value)}
                          className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-500 focus:ring-blue-500"
                        />
                        <span className="text-gray-300 text-sm group-hover:text-white">{reason}</span>
                      </label>
                    ))}
                  </div>
                  
                  {reportReason === "Other" && (
                    <textarea
                      value={customReason}
                      onChange={(e) => setCustomReason(e.target.value)}
                      placeholder="Please describe the issue..."
                      className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white text-sm focus:border-blue-500 outline-none mb-4 h-24 resize-none"
                    />
                  )}

                  <div className="flex justify-end gap-3">
                    <button onClick={() => setShowReportModal(false)} className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 text-white text-sm font-bold">Cancel</button>
                    <button onClick={submitReport} className="px-4 py-2 rounded bg-red-600 hover:bg-red-500 text-white text-sm font-bold">Report</button>
                  </div>
                </div>
              </div>
            )}
            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setShowDeleteModal(false)}>
                <div className="bg-gray-800 border border-gray-600 p-6 rounded-xl shadow-2xl max-w-sm w-full text-center" onClick={e => e.stopPropagation()}>
                  <h3 className="text-lg font-bold text-white mb-2">Delete Post?</h3>
                  <p className="text-gray-400 text-sm mb-6">Are you sure you want to delete this post? This action cannot be undone.</p>
                  <div className="flex justify-center gap-3">
                    <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 text-white text-sm font-bold">Cancel</button>
                    <button onClick={confirmDelete} className="px-4 py-2 rounded bg-red-600 hover:bg-red-500 text-white text-sm font-bold">Delete</button>
                  </div>
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
          className="p-6 rounded-lg border border-gray-700 flex items-center justify-between relative overflow-hidden transition-all shadow-xl"
        >
          <div className="relative z-10 flex items-center gap-4">
            {activeCommunity.avatar_url ? (
              <img
                src={`${API_BASE_URL}${activeCommunity.avatar_url}`}
                alt={activeCommunity.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-white/20"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-2xl font-bold border-2 border-white/20">
                {activeCommunity.name.substring(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <button
                onClick={() => navigate("/community")}
                className="opacity-100 hover:opacity-100 text-sm mb-1 flex items-center gap-1 font-bold text-white"
              >
                ← Back to Communities
              </button>
              <h2 className="text-2xl font-bold">{activeCommunity.name}</h2>
              <p className="opacity-80 text-sm">
                {activeCommunity.description}
              </p>
            </div>
          </div>
          <div className="text-right flex flex-col items-end gap-2">
            <span className="bg-blue-900/30 text-blue-400 px-3 py-1 rounded-full text-xs font-bold border border-blue-500/30 cursor-pointer hover:bg-blue-900/50 transition-colors" onClick={fetchMembers}>
              {activeCommunity.members_count} Members
            </span>
            {(currentUser === activeCommunity.creator_username || userData?.role === 'admin') && (
               <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Creator View</span>
            )}
          </div>
        </div>

        {/* Create Post Box */}
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <form onSubmit={handlePostSubmit}>
          <div className="relative">
              <textarea
                value={newPostContent}
                onChange={handleInputChange}
                name="mainPostContent"
                onPaste={handlePaste}
                placeholder={`What's on your mind? Share a strategy or crypto news...`}
                className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 min-h-[100px]"
              />
              {/* Mention Box */}
              {mentionState.active && mentionState.suggestions.length > 0 && (
                <div className="absolute z-50 bg-gray-800 border border-gray-600 rounded-lg shadow-xl overflow-hidden mt-1 w-48 left-0 top-full">
                  {mentionState.suggestions.map((user) => (
                    <button
                      key={user.username}
                      onClick={() => insertMention(user.username)}
                      className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-blue-600 hover:text-white"
                    >
                      {user.username}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Image Preview */}
            {postImage.preview && (
              <div className="mt-3 relative w-fit">
                <img
                  src={postImage.preview}
                  alt="Preview"
                  className="max-h-40 rounded-lg border border-gray-600"
                />
                <button
                  type="button"
                  onClick={() => setPostImage({ file: null, preview: "" })}
                  className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 leading-none text-xs"
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
                className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white focus:border-blue-500 outline-none mt-3"
              />
            )}

            <div className="flex justify-between items-center mt-2">
              {/* Media Buttons */}
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => fileInputRef.current.click()}
                  className="text-gray-400 hover:text-blue-400 text-sm flex items-center gap-1"
                >
                  📷 Upload
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
                  className="text-gray-400 hover:text-blue-400 text-sm flex items-center gap-1"
                >
                  🔗 Add Link
                </button>
              </div>

              {/* Post Button */}
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-bold transition-colors"
              >
                Post
              </button>
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
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
            onClick={() => setPreviewImage(null)}
          >
            <button
              className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
              onClick={() => setPreviewImage(null)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-8 h-8"
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
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
        {/* Members Modal */}
        {showMembersModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-gray-800 border border-gray-600 p-6 rounded-xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
                <h3 className="text-lg font-bold text-white">Community Members</h3>
                <button onClick={() => setShowMembersModal(false)} className="text-gray-400 hover:text-white">✕</button>
              </div>
              <div className="space-y-3">
                {members.map(member => (
                  <div key={member.user_id} className="flex items-center justify-between bg-gray-900/50 p-3 rounded border border-gray-700">
                    <div className="flex items-center gap-3">
                      {member.avatar_url ? (
                        <img src={`${API_BASE_URL}${member.avatar_url}`} alt={member.username} className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-xs font-bold text-white">
                          {member.username.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-bold text-white">{member.username}</p>
                        <p className="text-[10px] text-gray-500">Joined {new Date(member.joined_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    {(currentUser === activeCommunity.creator_username || userData?.role === 'admin') && member.username !== activeCommunity.creator_username && (
                      <button onClick={() => handleKickMember(member.username)} className="text-xs bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-900/50 px-2 py-1 rounded transition-colors">
                        Kick
                      </button>
                    )}
                    {member.username === activeCommunity.creator_username && (
                      <span className="text-[10px] bg-blue-900/30 text-blue-400 px-2 py-1 rounded border border-blue-900/50">Owner</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Generic Confirmation Modal */}
        {confirmModal.isOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-gray-800 border border-gray-600 p-6 rounded-xl shadow-2xl max-w-sm w-full text-center">
              <h3 className="text-lg font-bold text-white mb-2">Are you sure?</h3>
              <p className="text-gray-400 text-sm mb-6">{confirmModal.message}</p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })} className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 text-white text-sm font-bold">Cancel</button>
                <button onClick={() => { confirmModal.onConfirm(); setConfirmModal({ ...confirmModal, isOpen: false }); }} className="px-4 py-2 rounded bg-red-600 hover:bg-red-500 text-white text-sm font-bold">Confirm</button>
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
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-lg">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <span className="text-blue-500">👥</span> Trader Communities
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Join discussions, share signals, and grow together.
          </p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <input
            type="text"
            placeholder="Search community..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-gray-900 border border-gray-600 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-blue-500 w-full md:w-64"
          />
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold transition-colors whitespace-nowrap"
          >
            + Create
          </button>
        </div>
      </div>

      {/* Community Cards Grid */}
      {loading ? (
        <div className="text-center text-gray-500 py-10">
          Loading communities...
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
                className={`rounded-xl border border-gray-700 p-6 transition-all group relative overflow-hidden cursor-pointer
                ${comm.hover_animation === "scale" ? "hover:scale-105" : ""}
                ${
                  comm.hover_animation === "glow"
                    ? "hover:shadow-[0_0_20px_var(--glow-color)]"
                    : "hover:shadow-xl"
                }
                ${comm.hover_animation === "none" ? "hover:-translate-y-1" : ""}
              `}
              >
                {comm.is_vip && (
                  <div className="absolute top-0 right-0 bg-yellow-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-bl-lg z-10 flex items-center gap-1">
                    <span>✨</span> VIP
                  </div>
                )}
                <div className="flex items-center gap-3 mb-4">
                  {comm.avatar_url ? (
                    <img
                    src={`${API_BASE_URL}${comm.avatar_url}`}
                    alt={comm.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-white/20"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-xl font-bold border-2 border-white/20">
                      {comm.name.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3
                      className="text-xl font-bold truncate"
                      style={{ color: comm.text_color }}
                    >
                      {comm.name}
                    </h3>
                    <p className="text-xs opacity-70">
                      by {comm.creator_username}
                    </p>
                  </div>
                  <span className="bg-green-900/30 text-green-400 text-xs px-2 py-1 rounded-full border border-green-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                    {comm.active_count} Online
                  </span>
                </div>

                <p
                  className="text-sm mb-6 line-clamp-2 h-10 opacity-80"
                  style={{ color: comm.text_color }}
                >
                  {comm.description}
                </p>

                <div className="flex items-center justify-between border-t border-gray-700 pt-4">
                  <div
                    className="flex items-center gap-2 text-sm opacity-80"
                    style={{ color: comm.text_color }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 opacity-70"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                    </svg>
                    <span className="font-mono font-bold">
                      {comm.members_count.toLocaleString()}
                    </span>{" "}
                    Members
                  </div>
                  {isAdmin ? (
                    <div className="flex items-center gap-2">
                    <span
                      className="text-sm font-bold opacity-70"
                      style={{ color: comm.text_color }}
                    >
                      Admin Oversight
                    </span>
                    <button
                      onClick={(e) => handleDeleteCommunity(e, comm.id)}
                      className="text-red-500 hover:text-red-400 p-1.5 rounded hover:bg-red-900/30 transition-colors"
                      title="Delete Community"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  </div>
                  ) : isCreator ? (
                    <div className="flex items-center gap-2">
                      <span
                        className="text-sm font-bold opacity-70"
                        style={{ color: comm.text_color }}
                      >
                        Creator
                      </span>
                      <button
                        onClick={(e) => handleDeleteCommunity(e, comm.id)}
                        className="text-red-500 hover:text-red-400 p-1.5 rounded hover:bg-red-900/30 transition-colors"
                        title="Delete Community"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                      </button>
                    </div>
                  ) : joinedCommunityIds.includes(comm.id) ? (
                    <button
                      onClick={(e) => requestExitCommunity(e, comm)}
                      className="text-sm font-bold hover:underline opacity-80 hover:opacity-100"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-gray-800 border border-gray-600 p-6 rounded-xl shadow-2xl max-w-2xl w-full animate-fade-in my-8">
            <h3 className="text-xl font-bold text-white mb-4">
              Create New Community
            </h3>
            <form onSubmit={handleCreate} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column: Basic Info */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">
                      Avatar (Optional)
                    </label>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gray-700 overflow-hidden border border-gray-600">
                        {previewCommAvatar ? (
                          <img
                            src={previewCommAvatar}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="flex items-center justify-center h-full text-gray-500 text-xs">
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
                        className="text-xs text-gray-400"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">
                      Name
                    </label>
                    <input
                      type="text"
                      required
                      value={newComm.name}
                      onChange={(e) =>
                        setNewComm({ ...newComm, name: e.target.value })
                      }
                      className="w-full bg-gray-900 border border-gray-600 rounded text-white p-2 focus:border-blue-500 outline-none"
                      placeholder="e.g. Bitcoin Whales Indonesia"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">
                      Description
                    </label>
                    <textarea
                      required
                      value={newComm.description}
                      onChange={(e) =>
                        setNewComm({ ...newComm, description: e.target.value })
                      }
                      className="w-full bg-gray-900 border border-gray-600 rounded text-white p-2 focus:border-blue-500 outline-none h-24 resize-none"
                      placeholder="Describe your community goal..."
                    />
                  </div>
                </div>

                {/* Right Column: Appearance */}
                <div className="space-y-4 border-l border-gray-700 pl-6">
                  <h4 className="text-sm font-bold text-blue-400 uppercase">
                    Appearance
                  </h4>

                  {/* Background Type */}
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">
                      Background Type
                    </label>
                    <select
                      value={newComm.bgType}
                      onChange={(e) =>
                        setNewComm({ ...newComm, bgType: e.target.value })
                      }
                      className="w-full bg-gray-900 border border-gray-600 rounded text-white p-2 text-sm"
                    >
                      <option value="color">Solid Color</option>
                      <option value="gradient">Gradient</option>
                      <option value="image">Upload Image</option>
                    </select>
                  </div>

                  {/* Background Value */}
                  {newComm.bgType === "image" ? (
                    <div>
                      <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">
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
                        className="text-xs text-gray-400 w-full"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">
                        {newComm.bgType === "color"
                          ? "Color Hex"
                          : "Gradient CSS"}
                      </label>
                      {newComm.bgType === "gradient" ? (
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <div className="flex-1">
                              <label className="text-[10px] text-gray-500 uppercase">
                                Start Color
                              </label>
                              <div className="flex items-center gap-2 bg-gray-900 border border-gray-600 rounded p-1">
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
                                  className="h-6 w-6 bg-transparent border-0 cursor-pointer"
                                />
                                <span className="text-xs text-gray-400">
                                  {newComm.gradientStart}
                                </span>
                              </div>
                            </div>
                            <div className="flex-1">
                              <label className="text-[10px] text-gray-500 uppercase">
                                End Color
                              </label>
                              <div className="flex items-center gap-2 bg-gray-900 border border-gray-600 rounded p-1">
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
                                  className="h-6 w-6 bg-transparent border-0 cursor-pointer"
                                />
                                <span className="text-xs text-gray-400">
                                  {newComm.gradientEnd}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div>
                            <label className="text-[10px] text-gray-500 uppercase">
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
                              className="w-full bg-gray-900 border border-gray-600 rounded text-white p-1 text-xs"
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
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={newComm.bgValue}
                            onChange={(e) =>
                              setNewComm({
                                ...newComm,
                                bgValue: e.target.value,
                              })
                            }
                            className={`bg-gray-900 border border-gray-600 rounded text-white p-1 h-9 ${
                              newComm.bgType === "color"
                                ? "w-16"
                                : "w-full text-xs"
                            }`}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">
                        Text Color
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={newComm.textColor}
                          onChange={(e) =>
                            setNewComm({
                              ...newComm,
                              textColor: e.target.value,
                            })
                          }
                          className="h-8 w-8 bg-transparent border-0 cursor-pointer"
                        />
                        <span className="text-xs text-gray-400">
                          {newComm.textColor}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">
                        Font
                      </label>
                      <select
                        value={newComm.fontFamily}
                        onChange={(e) =>
                          setNewComm({ ...newComm, fontFamily: e.target.value })
                        }
                        className="w-full bg-gray-900 border border-gray-600 rounded text-white p-1 text-xs"
                      >
                        <option value="sans">Sans Serif</option>
                        <option value="serif">Serif</option>
                        <option value="mono">Monospace</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">
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
                      className="w-full bg-gray-900 border border-gray-600 rounded text-white p-2 text-sm"
                    >
                      <option value="none">None (Lift)</option>
                      <option value="scale">Scale Up</option>
                      <option value="glow">Glow</option>
                    </select>
                  </div>
                  {newComm.hoverAnimation === "glow" && (
                    <div>
                      <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">
                        Glow Color
                      </label>
                      <div className="flex items-center gap-2 bg-gray-900 border border-gray-600 rounded p-1">
                        <input
                          type="color"
                          value={newComm.hoverColor}
                          onChange={(e) =>
                            setNewComm({
                              ...newComm,
                              hoverColor: e.target.value,
                            })
                          }
                          className="h-6 w-6 bg-transparent border-0 cursor-pointer"
                        />
                        <span className="text-xs text-gray-400">
                          {newComm.hoverColor}
                        </span>
                      </div>
                    </div>
                  )}
                  {/* VIP Style Toggle (Platinum Only) */}
                  {(getPlanLevel(userData?.plan) >= 3 || userData?.role === 'admin') && (
                    <div className="pt-2 border-t border-gray-700">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={isVip} onChange={(e) => setIsVip(e.target.checked)} className="w-4 h-4 text-yellow-500 rounded focus:ring-yellow-500" />
                        <span className="text-xs font-bold text-yellow-400 uppercase flex items-center gap-1">
                          ✨ Enable VIP Style (Animated)
                        </span>
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Live Preview */}
              <div className="border-t border-gray-700 pt-4">
                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">
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
                    "--glow-color": newComm.hoverColor,
                    border: isVip ? "3px solid #fbbf24" : "1px solid #4b5563",
                  }}
                  className={`rounded-xl border border-gray-600 p-6 relative overflow-hidden transition-all duration-300 w-full max-w-sm mx-auto
                  ${newComm.hoverAnimation === "scale" ? "hover:scale-105" : ""}
                  ${
                    newComm.hoverAnimation === "glow"
                      ? "hover:shadow-[0_0_20px_var(--glow-color)]"
                      : "hover:shadow-xl"
                  }
                  ${
                    newComm.hoverAnimation === "none"
                      ? "hover:-translate-y-1"
                      : ""
                  }
                  ${isVip ? "animate-pulse-slow shadow-[0_0_30px_rgba(251,191,36,0.2)]" : ""}
                `}
                >
                  <div className="flex items-center gap-3 mb-4">
                    {previewCommAvatar ? (
                      <img
                        src={previewCommAvatar}
                        className="w-12 h-12 rounded-full object-cover border-2 border-white/20"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-xl font-bold border-2 border-white/20">
                        {newComm.name
                          ? newComm.name.substring(0, 2).toUpperCase()
                          : "NA"}
                      </div>
                    )}
                    <div>
                      <h3 className="text-xl font-bold">
                        {newComm.name || "Community Name"}
                      </h3>
                      <p className="text-xs opacity-70">by You</p>
                    </div>
                  </div>
                  <p className="text-sm mb-6 opacity-80">
                    {newComm.description ||
                      "Community description will appear here..."}
                  </p>
                  <div className="flex items-center justify-between border-t border-white/10 pt-4 opacity-80">
                    <span className="text-sm">1 Member</span>
                    <span className="text-sm font-bold">Join Group →</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded font-bold"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Exit Confirmation Modal */}
      {showExitModal && communityToExit && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-gray-800 border border-gray-600 p-6 rounded-xl shadow-2xl max-w-sm w-full animate-fade-in text-center">
            <h3 className="text-lg font-bold text-white mb-2">
              Exit Community?
            </h3>
            <p className="text-gray-400 text-sm mb-6">
              Are you sure you want to leave{" "}
              <span className="text-white font-bold">
                {communityToExit.name}
              </span>
              ?
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowExitModal(false)}
                className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 text-white text-sm font-bold"
              >
                No, Cancel
              </button>
              <button
                onClick={confirmExitCommunity}
                className="px-4 py-2 rounded bg-red-600 hover:bg-red-500 text-white text-sm font-bold"
              >
                Yes, Exit
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Generic Confirmation Modal for List View (Delete Community) */}
      {confirmModal.isOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-gray-800 border border-gray-600 p-6 rounded-xl shadow-2xl max-w-sm w-full text-center">
              <h3 className="text-lg font-bold text-white mb-2">Are you sure?</h3>
              <p className="text-gray-400 text-sm mb-6">{confirmModal.message}</p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })} className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 text-white text-sm font-bold">Cancel</button>
                <button onClick={() => { confirmModal.onConfirm(); setConfirmModal({ ...confirmModal, isOpen: false }); }} className="px-4 py-2 rounded bg-red-600 hover:bg-red-500 text-white text-sm font-bold">Confirm</button>
              </div>
            </div>
          </div>
      )}
    </div>
  );
};

export default Community;
