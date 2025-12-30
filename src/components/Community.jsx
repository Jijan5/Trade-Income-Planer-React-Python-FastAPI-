import React, { useState, useEffect } from "react";
import axios from "axios";

const Community = () => {
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [newComm, setNewComm] = useState({ name: "", description: "" });

  // State join community
  const [activeCommunity, setActiveCommunity] = useState(null);
  const [posts, setPosts] = useState([]);
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostMedia, setNewPostMedia] = useState({ image: "", link: "" });
  const [showMediaInput, setShowMediaInput] = useState(false);

  // Interaction States
  const [expandedComments, setExpandedComments] = useState({}); // { postId: boolean }
  const [commentsData, setCommentsData] = useState({}); // { postId: [comments] }
  const [newCommentText, setNewCommentText] = useState({}); // { postId: string }

  // Fetch Communities
  const fetchCommunities = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:8000/api/communities");
      setCommunities(response.data);
    } catch (error) {
      console.error("Failed to fetch communities", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommunities();
  }, []);

  // Fetch Posts ketika masuk ke komunitas
  useEffect(() => {
    if (activeCommunity) {
      fetchPosts(activeCommunity.id);
    }
  }, [activeCommunity]);

  const fetchPosts = async (communityId) => {
    try {
      const response = await axios.get(`http://127.0.0.1:8000/api/communities/${communityId}/posts`);
      setPosts(response.data);
    } catch (error) {
      console.error("Failed to fetch posts", error);
    }
  };

  // Handle Create Community
  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://127.0.0.1:8000/api/communities", newComm);
      setShowModal(false);
      setNewComm({ name: "", description: "" });
      fetchCommunities(); // Refresh list
    } catch (error) {
      alert("Failed to make community");
    }
  };

  // Handle Create Post
  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login to post.");
      return;
    }

    try {
      await axios.post(
        `http://127.0.0.1:8000/api/communities/${activeCommunity.id}/posts`,
        { 
          content: newPostContent,
          image_url: newPostMedia.image || null,
          link_url: newPostMedia.link || null
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewPostContent("");
      setNewPostMedia({ image: "", link: "" });
      setShowMediaInput(false);
      fetchPosts(activeCommunity.id); // Refresh feed
    } catch (error) {
      console.error("Failed to post", error);
      let msg = "Failed to post.";
      if (error.response) {
        msg = error.response.data.detail || "Server error.";
        if (error.response.status === 401) msg = "Session expired. Please login again.";
      }
      alert(msg);
    }
  };

  // --- INTERACTION HANDLERS ---

  const handleReaction = async (postId, type) => {
    const token = localStorage.getItem("token");
    if (!token) return alert("Please login to react.");

    try {
      await axios.post(
        `http://127.0.0.1:8000/api/posts/${postId}/react`,
        { type },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Optimistic update (simple increment for demo, real app would refetch or use complex state)
      setPosts(posts.map(p => p.id === postId ? { ...p, likes: p.likes + 1 } : p));
    } catch (error) {
      console.error("Reaction failed", error);
    }
  };

  const toggleComments = async (postId) => {
    const isExpanded = !!expandedComments[postId];
    setExpandedComments({ ...expandedComments, [postId]: !isExpanded });

    if (!isExpanded && !commentsData[postId]) {
      // Fetch comments if opening and not loaded yet
      try {
        const res = await axios.get(`http://127.0.0.1:8000/api/posts/${postId}/comments`);
        setCommentsData({ ...commentsData, [postId]: res.data });
      } catch (error) {
        console.error("Fetch comments failed", error);
      }
    }
  };

  const submitComment = async (postId) => {
    const content = newCommentText[postId];
    const token = localStorage.getItem("token");
    if (!content || !content.trim()) return;
    if (!token) return alert("Please login to comment.");

    try {
      const res = await axios.post(
        `http://127.0.0.1:8000/api/posts/${postId}/comments`,
        { content },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update local state
      const currentComments = commentsData[postId] || [];
      setCommentsData({ ...commentsData, [postId]: [...currentComments, res.data] });
      setNewCommentText({ ...newCommentText, [postId]: "" });
      
      // Update comment count on post
      setPosts(posts.map(p => p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p));
    } catch (error) {
      console.error("Comment failed", error);
    }
  };

  const handleShare = async (postId) => {
    try {
      await axios.post(`http://127.0.0.1:8000/api/posts/${postId}/share`);
      setPosts(posts.map(p => p.id === postId ? { ...p, shares_count: p.shares_count + 1 } : p));
      alert("Post shared to your timeline! (Simulated)");
    } catch (error) {
      console.error("Share failed", error);
    }
  };

  const reactions = [
    { emoji: "👍", label: "Like", type: "like" },
    { emoji: "😮", label: "Shock", type: "shock" },
    { emoji: "🚀", label: "Rocket", type: "rocket" },
    { emoji: "📈", label: "Bullish", type: "chart_up" },
    { emoji: "👏", label: "Clap", type: "clap" },
  ];

  // Filter Logic
  const filteredCommunities = communities.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- VIEW: COMMUNITY FEED (INSIDE GROUP) ---
  if (activeCommunity) {
    return (
      <div className="animate-fade-in space-y-6 max-w-4xl mx-auto">
        {/* Header Feed */}
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 flex items-center justify-between">
          <div>
            <button 
              onClick={() => setActiveCommunity(null)}
              className="text-gray-400 hover:text-white text-sm mb-2 flex items-center gap-1"
            >
              ← Back to Communities
            </button>
            <h2 className="text-2xl font-bold text-white">{activeCommunity.name}</h2>
            <p className="text-gray-400 text-sm">{activeCommunity.description}</p>
          </div>
          <div className="text-right">
             <span className="bg-blue-900/30 text-blue-400 px-3 py-1 rounded-full text-xs font-bold border border-blue-500/30">
               {activeCommunity.members_count} Members
             </span>
          </div>
        </div>

        {/* Create Post Box */}
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <form onSubmit={handlePostSubmit}>
            <textarea
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              placeholder={`What's on your mind? Share a strategy or crypto news...`}
              className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 min-h-[100px]"
            />

{showMediaInput && (
              <div className="mt-3 space-y-2 animate-fade-in">
                <input 
                  type="text" 
                  placeholder="Image URL (https://...)" 
                  value={newPostMedia.image}
                  onChange={(e) => setNewPostMedia({...newPostMedia, image: e.target.value})}
                  className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
                />
                <input 
                  type="text" 
                  placeholder="Link URL (https://...)" 
                  value={newPostMedia.link}
                  onChange={(e) => setNewPostMedia({...newPostMedia, link: e.target.value})}
                  className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
                />
              </div>
            )}

            <div className="flex justify-end mt-2">
            <button 
                type="button"
                onClick={() => setShowMediaInput(!showMediaInput)}
                className="mr-auto text-gray-400 hover:text-blue-400 text-sm flex items-center gap-1"
              >
                📷 🔗 Add Media
              </button>
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
        <div className="space-y-4">
          {posts.length === 0 ? (
            <div className="text-center text-gray-500 py-10">No posts yet. Be the first to share!</div>
          ) : (
            posts.map((post) => (
              <div key={post.id} className="bg-gray-800 p-5 rounded-lg border border-gray-700">
                {/* Post Header */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                    {post.username.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{post.username}</p>
                    <p className="text-[10px] text-gray-500">{new Date(post.created_at).toLocaleString()}</p>
                  </div>
                </div>
                {/* Post Content */}
                <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">{post.content}</p>

                {/* Post Media */}
                {post.image_url && (
                  <div className="mt-3 rounded-lg overflow-hidden border border-gray-700">
                    <img src={post.image_url} alt="Post attachment" className="w-full h-auto max-h-[400px] object-cover" />
                  </div>
                )}
                {post.link_url && (
                  <a href={post.link_url} target="_blank" rel="noreferrer" className="block mt-3 p-3 bg-gray-900/50 border border-gray-700 rounded text-blue-400 text-sm hover:underline truncate">
                    🔗 {post.link_url}
                  </a>
                )}

                {/* Post Actions (Like, Comment, Share) */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-700">
                  {/* Like / Reaction Button with Hover Menu */}
                  <div className="relative group">
                    <button className="flex items-center gap-2 text-gray-400 hover:text-blue-400 transition-colors">
                      <span>👍</span> 
                      <span className="text-sm font-bold">{post.likes}</span>
                    </button>
                    
                    {/* Reaction Popup */}
                    <div className="absolute bottom-full left-0 mb-2 hidden group-hover:flex bg-gray-900 border border-gray-600 rounded-full p-1 shadow-xl gap-1 z-10 animate-fade-in">
                      {reactions.map((r) => (
                        <button 
                          key={r.type}
                          onClick={() => handleReaction(post.id, r.type)}
                          className="p-2 hover:bg-gray-700 rounded-full transition-transform hover:scale-125 text-xl"
                          title={r.label}
                        >
                          {r.emoji}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button 
                    onClick={() => toggleComments(post.id)}
                    className="flex items-center gap-2 text-gray-400 hover:text-blue-400 transition-colors"
                  >
                    <span>💬</span>
                    <span className="text-sm font-bold">{post.comments_count}</span>
                  </button>

                  <button 
                    onClick={() => handleShare(post.id)}
                    className="flex items-center gap-2 text-gray-400 hover:text-blue-400 transition-colors"
                  >
                    <span>↗️</span>
                    <span className="text-sm font-bold">{post.shares_count}</span>
                  </button>
                </div>

                {/* Comments Section */}
                {expandedComments[post.id] && (
                  <div className="mt-4 pt-4 border-t border-gray-700/50 animate-fade-in">
                    {/* Comment List */}
                    <div className="space-y-3 mb-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                      {commentsData[post.id]?.length > 0 ? (
                        commentsData[post.id].map((comment) => (
                          <div key={comment.id} className="bg-gray-900/50 p-3 rounded text-sm">
                            <span className="font-bold text-blue-400 mr-2">{comment.username}</span>
                            <span className="text-gray-300">{comment.content}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-gray-500 italic">No comments yet.</p>
                      )}
                    </div>

                    {/* Add Comment Input */}
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Write a comment..." 
                        value={newCommentText[post.id] || ""}
                        onChange={(e) => setNewCommentText({...newCommentText, [post.id]: e.target.value})}
                        className="flex-1 bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
                        onKeyPress={(e) => e.key === 'Enter' && submitComment(post.id)}
                      />
                      <button 
                        onClick={() => submitComment(post.id)}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded text-sm font-bold"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
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
        <div className="text-center text-gray-500 py-10">Loading communities...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCommunities.map((comm) => (
            <div
              key={comm.id}
              className="bg-gray-800 rounded-xl border border-gray-700 p-6 hover:border-blue-500 transition-all hover:shadow-xl group relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
              
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
                  {comm.name}
                </h3>
                <span className="bg-green-900/30 text-green-400 text-xs px-2 py-1 rounded-full border border-green-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                  {comm.active_count} Online
                </span>
              </div>
              
              <p className="text-gray-400 text-sm mb-6 line-clamp-2 h-10">
                {comm.description}
              </p>

              <div className="flex items-center justify-between border-t border-gray-700 pt-4">
                <div className="flex items-center gap-2 text-gray-300 text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                  </svg>
                  <span className="font-mono font-bold">{comm.members_count.toLocaleString()}</span> Members
                </div>
                <button 
                  onClick={() => setActiveCommunity(comm)}
                  className="text-blue-400 hover:text-white text-sm font-bold hover:underline"
                >
                  Join Group →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-gray-800 border border-gray-600 p-6 rounded-xl shadow-2xl max-w-md w-full animate-fade-in">
            <h3 className="text-xl font-bold text-white mb-4">Create New Community</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Name</label>
                <input
                  type="text"
                  required
                  value={newComm.name}
                  onChange={(e) => setNewComm({ ...newComm, name: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-600 rounded text-white p-2 focus:border-blue-500 outline-none"
                  placeholder="e.g. Bitcoin Whales Indonesia"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Description</label>
                <textarea
                  required
                  value={newComm.description}
                  onChange={(e) => setNewComm({ ...newComm, description: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-600 rounded text-white p-2 focus:border-blue-500 outline-none h-24 resize-none"
                  placeholder="Describe your community goal..."
                />
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
    </div>
  );
};

export default Community;
