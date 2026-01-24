import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../lib/axios";
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from "../contexts/AuthContext";
import VerifiedBadge from "./VerifiedBadge";

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

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Delete comment?")) return;
    try {
      await api.delete(`/comments/${commentId}`);
      setComments(comments.filter(c => c.id !== commentId));
      setPost({ ...post, comments_count: Math.max(0, post.comments_count - 1) });
    } catch (error) {
      showFlash("Failed to delete comment.", "error");
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
    <div key={comment.id} className="mt-4" style={{ paddingLeft: comment.parent_id ? "1.5rem" : "0", borderLeft: comment.parent_id ? "2px solid #374151" : "none" }}>
      <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <span className="font-bold text-blue-400 text-sm">{comment.username}</span>
            <VerifiedBadge user={comment} />
            <span className="text-xs text-gray-500">
              {(() => {
                try {
                  return formatDistanceToNow(new Date(comment.created_at), { addSuffix: true });
                } catch (e) { return ""; }
              })()}
            </span>
          </div>
          {(currentUser === comment.username || userData?.role === 'admin') && (
            <button onClick={() => handleDeleteComment(comment.id)} className="text-gray-500 hover:text-red-400 text-xs">Delete</button>
          )}
        </div>
        <p className="text-gray-300 text-sm mt-1">{comment.content}</p>
        <button 
          onClick={() => { setReplyingTo(comment.id); setReplyContent(""); }}
          className="text-xs text-gray-400 hover:text-white mt-2 font-bold"
        >
          Reply
        </button>
      </div>
      
      {replyingTo === comment.id && (
        <div className="mt-2 ml-4 flex gap-2">
          <input 
            type="text" 
            value={replyContent} 
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder={`Reply to ${comment.username}...`}
            className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-1 text-sm text-white focus:outline-none"
            autoFocus
          />
          <button onClick={() => submitComment(replyContent, comment.id)} className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-bold">Reply</button>
          <button onClick={() => setReplyingTo(null)} className="text-gray-400 text-xs">Cancel</button>
        </div>
      )}

      {comment.children && comment.children.length > 0 && (
        <div className="mt-2">
          {comment.children.map(renderComment)}
        </div>
      )}
    </div>
  );

  if (loading) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Loading post...</div>;
  if (error) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-red-400">{error}</div>;
  if (!post) return null;

  return (
    <div className="max-w-3xl mx-auto animate-fade-in pb-20">
      <button onClick={() => navigate(-1)} className="mb-4 text-gray-400 hover:text-white flex items-center gap-1 text-sm font-bold">
        ← Back
      </button>

      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-xl">
        {/* Post Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            {post.user_avatar_url ? (
              <img src={`${API_BASE_URL}${post.user_avatar_url}`} alt={post.username} className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                {post.username.substring(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-base font-bold text-white flex items-center gap-1">
                {post.username}
                <VerifiedBadge user={post} />
              </p>
              <p className="text-xs text-gray-500">
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
              <button onClick={() => setActiveMenu(activeMenu ? null : 'post')} className="text-gray-400 hover:text-white">
                •••
              </button>
              {activeMenu === 'post' && (
                <div ref={menuRef} className="absolute right-0 mt-2 w-32 bg-gray-900 border border-gray-700 rounded shadow-xl z-10">
                  <button onClick={handleDeleteClick} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-800">Delete</button>
                  </div>
              )}
            </div>
          )}
        </div>

        {/* Post Content */}
        <p className="text-gray-200 text-lg whitespace-pre-wrap leading-relaxed mb-4">{post.content}</p>
        
        {post.image_url && (
          <img src={`${API_BASE_URL}${post.image_url}`} alt="Post attachment" className="w-full rounded-lg border border-gray-700 mb-4" />
        )}
        
        {post.link_url && (
          <a href={post.link_url} target="_blank" rel="noreferrer" className="block p-3 bg-gray-900/50 border border-gray-700 rounded text-blue-400 text-sm hover:underline mb-4">
            🔗 {post.link_url}
          </a>
        )}

        {/* Actions */}
        <div className="flex items-center gap-6 border-t border-gray-700 pt-4">
          <button 
            onClick={() => handleReaction(post.user_reaction ? post.user_reaction : 'like')}
            className={`flex items-center gap-2 font-bold ${post.user_reaction ? 'text-blue-400' : 'text-gray-400 hover:text-white'}`}
          >
            <span>👍</span> {post.likes} Likes
          </button>
          <div className="flex items-center gap-2 text-gray-400">
            <span>💬</span> {comments.length} Comments
          </div>
        </div>
      </div>

      {/* Comments Section */}
      <div className="mt-6">
        <h3 className="text-lg font-bold text-white mb-4">Comments</h3>
        
        {/* Add Comment */}
        <div className="flex gap-3 mb-6">
          <input 
            type="text" 
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none"
            onKeyPress={(e) => e.key === 'Enter' && submitComment(newComment)}
          />
          <button 
            onClick={() => submitComment(newComment)}
            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-bold"
          >
            Send
          </button>
        </div>

        {/* Comment List */}
        <div className="space-y-2">
          {buildCommentTree(comments).map(renderComment)}
          {comments.length === 0 && <p className="text-gray-500 text-center py-4">No comments yet.</p>}
        </div>
      </div>
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setShowDeleteModal(false)}>
          <div className="bg-gray-800 border border-gray-600 p-6 rounded-xl shadow-2xl max-w-sm w-full text-center" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white mb-2">Delete Post?</h3>
            <p className="text-gray-400 text-sm mb-6">Are you sure you want to delete this post? This action cannot be undone.</p>
            <div className="flex justify-center gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 text-white text-sm font-bold">Cancel</button>
              <button onClick={confirmDeletePost} className="px-4 py-2 rounded bg-red-600 hover:bg-red-500 text-white text-sm font-bold">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostDetail;
