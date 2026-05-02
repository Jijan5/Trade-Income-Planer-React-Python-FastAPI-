import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../lib/axios";
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from "../contexts/AuthContext";
import VerifiedBadge from "./VerifiedBadge";
import MentionInput from "./MentionInput";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

const PostDetail = ({ showFlash }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userData } = useAuth();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);
  // Interaction States
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyContent, setReplyContent] = useState("");
  const [activeMenu, setActiveMenu] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const menuRef = useRef(null);

  const currentUser = userData?.username;

  useEffect(() => {
    fetchPostAndComments();
  }, [id]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeMenu]);

  const fetchPostAndComments = async () => {
    setLoading(true);
    try {
      const [postRes, commentsRes] = await Promise.all([
        api.get(`/posts/${id}`),
        api.get(`/posts/${id}/comments`)
      ]);
      setPost(postRes.data);
      setComments(commentsRes.data);
    } catch (err) {
      console.error("Failed to fetch post", err);
      setError("Post not found or deleted.");
    } finally {
      setLoading(false);
    }
  };

  const handleReaction = async (type) => {
    if (!post) return;
    // Optimistic update
    const isSame = post.user_reaction === type;
    const isNew = !post.user_reaction;
    let newLikes = post.likes;
    let newReaction = type;
    
    if (isSame) { newLikes = Math.max(0, newLikes - 1); newReaction = null; }
    else if (isNew) { newLikes += 1; }
    
    setPost({ ...post, likes: newLikes, user_reaction: newReaction });

    try {
      if (isSame) {
        await api.delete(`/posts/${post.id}/react`);
      } else {
        await api.post(`/posts/${post.id}/react`, { type });
      }
    } catch (error) {
      console.error("Reaction failed", error);
      fetchPostAndComments(); // Revert on error
    }
  };

  const submitComment = async (content, parentId = null) => {
    if (!content.trim()) return;
    try {
      const res = await api.post(`/posts/${post.id}/comments`, { content, parent_id: parentId });
      setComments([...comments, res.data]);
      if (parentId) { setReplyingTo(null); setReplyContent(""); }
      else { setNewComment(""); }
      setPost({ ...post, comments_count: post.comments_count + 1 });
    } catch (error) {
      showFlash("Failed to comment.", "error");
    }
  };

  const handleDeleteClick = () => {
    setActiveMenu(null);
    setShowDeleteModal(true);
  };

  const confirmDeletePost = async () => {
    try {
      await api.delete(`/posts/${post.id}`);
      navigate("/home");
    } catch (error) {
      showFlash("Failed to delete post.", "error");
    }
  };

  const handleDeleteComment = (commentId) => {
    setCommentToDelete(commentId);
  };

  const confirmDeleteComment = async () => {
    if (!commentToDelete) return;
    try {
      await api.delete(`/comments/${commentToDelete}`);
      setComments(comments.filter(c => c.id !== commentToDelete));
      setPost({ ...post, comments_count: Math.max(0, post.comments_count - 1) });
      setCommentToDelete(null);
    } catch (error) {
      showFlash("Failed to delete comment.", "error");
      setCommentToDelete(null);
    }
  };

  const buildCommentTree = (flatComments) => {
    const commentMap = {};
    const topLevel = [];
    flatComments.forEach(c => commentMap[c.id] = { ...c, children: [] });
    flatComments.forEach(c => {
      if (c.parent_id && commentMap[c.parent_id]) {
        commentMap[c.parent_id].children.push(commentMap[c.id]);
      } else {
        topLevel.push(commentMap[c.id]);
      }
    });
    return topLevel;
  };

  const renderComment = (comment) => (
    <div key={comment.id} className="mt-4" style={{ paddingLeft: comment.parent_id ? "1.5rem" : "0", borderLeft: comment.parent_id ? "2px solid rgba(var(--engine-neon-rgb),0.2)" : "none" }}>
      <div className="bg-engine-panel/60 p-4 rounded-xl border border-engine-neon/10 hover:border-engine-neon/30 transition-all shadow-[0_0_15px_rgba(0,0,0,0.5)]">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <span className="font-extrabold text-engine-neon text-xs uppercase tracking-widest drop-shadow-[0_0_2px_#00cfff]">{comment.username}</span>
            <VerifiedBadge user={comment} />
            <span className="text-[9px] text-engine-neon/50 font-mono uppercase tracking-widest">
              {(() => {
                try {
                  return formatDistanceToNow(new Date(comment.created_at), { addSuffix: true });
                } catch (e) { return ""; }
              })()}
            </span>
          </div>
          {(currentUser === comment.username || userData?.role === 'admin') && (
            <button onClick={() => handleDeleteComment(comment.id)} className="text-red-400/50 hover:text-red-400 text-[9px] font-extrabold uppercase tracking-widest transition-colors">DEL</button>
          )}
        </div>
        <p className="text-gray-200 text-sm mt-2 leading-relaxed">{comment.content}</p>
        <button 
          onClick={() => { setReplyingTo(comment.id); setReplyContent(""); }}
          className="text-[9px] text-engine-neon/70 hover:text-engine-neon mt-3 font-extrabold uppercase tracking-widest transition-colors drop-shadow-[0_0_3px_currentColor]"
        >
          REPLY
        </button>
      </div>
      
      {replyingTo === comment.id && (
        <div className="mt-3 ml-4 flex gap-3 animate-fade-in">
          <MentionInput 
            value={replyContent} 
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder={`REPLY TO @${comment.username}...`}
            className="flex-1 bg-engine-bg border border-engine-neon/30 rounded-xl px-4 py-2 text-[10px] text-white focus:outline-none focus:border-engine-neon focus:shadow-[0_0_10px_rgba(var(--engine-neon-rgb),0.2)] font-mono placeholder:text-engine-neon/30 transition-all"
            autoFocus
            rows={1}
          />
          <button onClick={() => submitComment(replyContent, comment.id)} className="bg-engine-button hover:bg-[#00e5ff] text-engine-bg px-4 py-2 rounded-xl text-[10px] font-extrabold uppercase tracking-widest shadow-[0_0_10px_rgba(var(--engine-neon-rgb),0.3)] transition-all">REPLY</button>
          <button onClick={() => setReplyingTo(null)} className="text-engine-neon/50 hover:text-engine-neon text-[10px] font-extrabold uppercase tracking-widest transition-colors">CANCEL</button>
        </div>
      )}

      {comment.children && comment.children.length > 0 && (
        <div className="mt-3">
          {comment.children.map(renderComment)}
        </div>
      )}
    </div>
  );

  if (loading) return <div className="min-h-screen bg-engine-bg flex items-center justify-center text-engine-neon/50 font-extrabold uppercase tracking-widest text-xs">LOADING POST...</div>;
  if (error) return <div className="min-h-screen bg-engine-bg flex items-center justify-center text-red-400 font-extrabold uppercase tracking-widest text-xs">{error}</div>;
  if (!post) return null;

  return (
    <div className="max-w-3xl mx-auto animate-fade-in pb-20 mt-8 px-4">
      <button onClick={() => navigate(-1)} className="mb-6 text-engine-neon/70 hover:text-engine-neon flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-widest transition-colors drop-shadow-[0_0_3px_currentColor]">
        ← BACK
      </button>

      <div className="bg-engine-panel/80 backdrop-blur-md p-8 rounded-2xl border border-engine-neon/30 shadow-[0_0_30px_rgba(var(--engine-neon-rgb),0.05)]">
        {/* Post Header */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-4">
            {post.user_avatar_url ? (
              <img src={`${API_BASE_URL}${post.user_avatar_url}`} alt={post.username} className="w-12 h-12 rounded-xl object-cover border border-engine-neon/30 shadow-[0_0_10px_rgba(var(--engine-neon-rgb),0.2)]" />
            ) : (
              <div className="w-12 h-12 bg-engine-bg border border-engine-neon/30 rounded-xl flex items-center justify-center text-engine-neon font-extrabold uppercase tracking-widest shadow-[0_0_10px_rgba(var(--engine-neon-rgb),0.2)]">
                {post.username.substring(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-sm font-extrabold text-engine-neon flex items-center gap-2 uppercase tracking-widest drop-shadow-[0_0_2px_#00cfff]">
                {post.username}
                <VerifiedBadge user={post} />
              </p>
              <p className="text-[9px] text-engine-neon/50 font-mono uppercase tracking-widest mt-1">
                {(() => {
                  try {
                    return formatDistanceToNow(new Date(post.created_at), { addSuffix: true });
                  } catch (e) { return ""; }
                })()}
              </p>
            </div>
          </div>
          
          {(currentUser === post.username || userData?.role === 'admin') && (
            <div className="relative">
              <button onClick={() => setActiveMenu(activeMenu ? null : 'post')} className="text-engine-neon/50 hover:text-engine-neon transition-colors p-2 text-xl drop-shadow-[0_0_3px_currentColor]">
                •••
              </button>
              {activeMenu === 'post' && (
                <div ref={menuRef} className="absolute right-0 mt-2 w-40 bg-engine-panel/95 backdrop-blur-md border border-engine-neon/30 rounded-xl shadow-[0_0_20px_rgba(var(--engine-neon-rgb),0.2)] z-10 overflow-hidden">
                  <button onClick={handleDeleteClick} className="w-full text-left px-5 py-3 text-[10px] font-extrabold uppercase tracking-widest text-red-400 hover:bg-red-900/20 transition-colors">DELETE</button>
                  </div>
              )}
            </div>
          )}
        </div>

        {/* Post Content */}
        <p className="text-white text-base whitespace-pre-wrap leading-relaxed mb-6">{post.content}</p>
        
        {post.image_url && (
          <img src={`${API_BASE_URL}${post.image_url}`} alt="Post attachment" className="w-full rounded-xl border border-engine-neon/20 shadow-[0_0_15px_rgba(var(--engine-neon-rgb),0.1)] mb-6" />
        )}
        
        {post.link_url && (
          <a href={post.link_url} target="_blank" rel="noreferrer" className="block p-4 bg-engine-bg/60 border border-engine-neon/20 rounded-xl text-engine-neon text-xs font-mono hover:bg-engine-button/10 transition-colors mb-6 break-all">
            🔗 {post.link_url}
          </a>
        )}

        {/* Actions */}
        <div className="flex items-center gap-8 border-t border-engine-neon/20 pt-6">
          <button 
            onClick={() => handleReaction(post.user_reaction ? post.user_reaction : 'like')}
            className={`flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-widest transition-all ${post.user_reaction ? 'text-engine-neon drop-shadow-[0_0_3px_#00cfff]' : 'text-engine-neon/50 hover:text-engine-neon'}`}
          >
            <span className="text-lg">👍</span> {post.likes} LIKES
          </button>
          <div className="flex items-center gap-2 text-engine-neon/50 text-[11px] font-extrabold uppercase tracking-widest">
            <span className="text-lg">💬</span> {comments.length} COMMENTS
          </div>
        </div>
      </div>

      {/* Comments Section */}
      <div className="mt-8 px-4 md:px-0">
        <h3 className="text-[11px] font-extrabold text-engine-neon mb-6 uppercase tracking-widest drop-shadow-[0_0_3px_#00cfff] flex items-center gap-3">
          <span className="w-2 h-2 bg-engine-button rounded-full shadow-[0_0_5px_var(--engine-neon)]"></span>
          COMMENTS ({comments.length})
        </h3>
        
        {/* Add Comment */}
        <div className="flex gap-4 mb-8">
          <MentionInput 
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="WRITE A COMMENT..."
            className="flex-1 bg-engine-panel/80 backdrop-blur-md border border-engine-neon/30 rounded-xl px-5 py-4 text-white text-xs font-mono placeholder:text-engine-neon/30 focus:border-engine-neon focus:shadow-[0_0_15px_rgba(var(--engine-neon-rgb),0.2)] outline-none transition-all"
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                submitComment(newComment);
              }
            }}
            rows={1}
          />
          <button 
            onClick={() => submitComment(newComment)}
            className="bg-engine-button hover:bg-[#00e5ff] text-engine-bg px-8 py-4 rounded-xl text-[11px] font-extrabold uppercase tracking-widest shadow-[0_0_15px_rgba(var(--engine-neon-rgb),0.4)] hover:shadow-[0_0_25px_rgba(var(--engine-neon-rgb),0.6)] hover:-translate-y-0.5 transition-all whitespace-nowrap"
          >
            SEND
          </button>
        </div>

        {/* Comment List */}
        <div className="space-y-4">
          {buildCommentTree(comments).map(renderComment)}
          {comments.length === 0 && <p className="text-engine-neon/50 text-center py-8 text-[10px] font-extrabold uppercase tracking-widest bg-engine-panel/60 border border-engine-neon/10 rounded-2xl">NO COMMENTS YET.</p>}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-engine-bg/90 backdrop-blur-md p-4 animate-fade-in" onClick={() => setShowDeleteModal(false)}>
          <div className="bg-engine-panel/95 border border-red-500/30 p-8 rounded-2xl shadow-[0_0_30px_rgba(239,68,68,0.2)] max-w-sm w-full text-center" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-extrabold text-red-400 mb-4 uppercase tracking-widest drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]">DELETE POST?</h3>
            <p className="text-gray-400 text-sm mb-8 font-medium">ARE YOU SURE YOU WANT TO DELETE THIS POST? THIS ACTION CANNOT BE UNDONE.</p>
            <div className="flex justify-center gap-4">
              <button onClick={() => setShowDeleteModal(false)} className="px-6 py-2.5 rounded-xl bg-engine-bg border border-engine-neon/30 hover:bg-engine-button/10 text-engine-neon text-[11px] font-extrabold uppercase tracking-widest transition-all">CANCEL</button>
              <button onClick={confirmDeletePost} className="px-6 py-2.5 rounded-xl bg-red-600/20 border border-red-500/50 hover:bg-red-600 text-red-400 hover:text-white text-[11px] font-extrabold uppercase tracking-widest shadow-[0_0_15px_rgba(239,68,68,0.2)] hover:shadow-[0_0_25px_rgba(239,68,68,0.5)] transition-all">DELETE</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Comment Modal */}
      {commentToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-engine-bg/90 backdrop-blur-md p-4 animate-fade-in" onClick={() => setCommentToDelete(null)}>
          <div className="bg-engine-panel/95 border border-red-500/30 p-8 rounded-2xl shadow-[0_0_30px_rgba(239,68,68,0.2)] max-w-sm w-full text-center" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-extrabold text-red-400 mb-4 uppercase tracking-widest drop-shadow-[0_0_5px_rgba(239,68,68,0.5)] flex flex-col items-center gap-3">
              <span className="text-4xl">⚠</span> DELETE COMMENT?
            </h3>
            <p className="text-gray-400 text-sm mb-8 font-medium">ARE YOU SURE YOU WANT TO DELETE THIS COMMENT? THIS ACTION CANNOT BE UNDONE.</p>
            <div className="flex justify-center gap-4">
              <button onClick={() => setCommentToDelete(null)} className="px-6 py-2.5 rounded-xl bg-engine-bg border border-engine-neon/30 hover:bg-engine-button/10 text-engine-neon text-[11px] font-extrabold uppercase tracking-widest transition-all">CANCEL</button>
              <button onClick={confirmDeleteComment} className="px-6 py-2.5 rounded-xl bg-red-600/20 border border-red-500/50 hover:bg-red-600 text-red-400 hover:text-white text-[11px] font-extrabold uppercase tracking-widest shadow-[0_0_15px_rgba(239,68,68,0.2)] hover:shadow-[0_0_25px_rgba(239,68,68,0.5)] transition-all">DELETE</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostDetail;
