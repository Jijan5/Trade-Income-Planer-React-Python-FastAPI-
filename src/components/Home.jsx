import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

const Home = ({ setActiveView, setActiveCommunity, communities, highlightedPost, setHighlightedPost }) => {
  const [posts, setPosts] = useState([]);
  const [marketPrices, setMarketPrices] = useState([]);
  const [news, setNews] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  // Post State
  const [newPostContent, setNewPostContent] = useState("");
  const [postImage, setPostImage] = useState({ file: null, preview: "" });
  const fileInputRef = useRef(null);

  // Carousel State
  const [currentPriceIndex, setCurrentPriceIndex] = useState(0);
  const [currentNewsIndex, setCurrentNewsIndex] = useState(0);

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

  // Close popups when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (reactionModalPostId && !event.target.closest(".reaction-modal")) {
        setReactionModalPostId(null);
      }
      if (mentionState.active && !event.target.closest(".mention-box")) {
        setMentionState((prev) => ({ ...prev, active: false }));
      }
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [reactionModalPostId, mentionState.active, activeMenu]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setCurrentUser(payload.sub);
      } catch (error) {}
    }
    fetchGlobalPosts();
    fetchMarketPrices();
    fetchNews();
  }, []);

  // Carousel Auto-scroll
  useEffect(() => {
    const priceInterval = setInterval(() => {
      setMarketPrices((prev) => {
        if (prev.length === 0) return prev;
        setCurrentPriceIndex((idx) => (idx + 1) % prev.length);
        return prev;
      });
    }, 3000);

    const newsInterval = setInterval(() => {
      setNews((prev) => {
        if (prev.length === 0) return prev;
        setCurrentNewsIndex((idx) => (idx + 1) % prev.length);
        return prev;
      });
    }, 5000);

    return () => {
      clearInterval(priceInterval);
      clearInterval(newsInterval);
    };
  }, []);

  const fetchGlobalPosts = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/api/posts");
      setPosts(res.data);
    } catch (error) {
      console.error("Failed to fetch posts", error);
    }
  };

  const fetchMarketPrices = async () => {
    const symbols = ["BTC-USD", "ETH-USD", "SOL-USD", "BNB-USD", "XRP-USD", "PEPE24478-USD"];
    const prices = [];
    for (const sym of symbols) {
      try {
        const res = await axios.get(`http://127.0.0.1:8000/api/price/${sym}`);
        if (res.data.status === "success") {
          prices.push(res.data);
        }
      } catch (e) {}
    }
    setMarketPrices(prices);
  };

  const fetchNews = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/api/news");
      if (res.data.Data) {
        setNews(res.data.Data.slice(0, 5)); // Ambil 5 berita teratas
      }
    } catch (error) {
      console.error("Failed to fetch news", error);
    }
  };

  const handlePaste = (e) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        setPostImage({ file: file, preview: URL.createObjectURL(file) });
        break;
      }
    }
  };

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!newPostContent.trim() && !postImage.file) return;

    const token = localStorage.getItem("token");
    if (!token) return alert("Please login to post.");

    const formData = new FormData();
    formData.append("content", newPostContent);
    if (postImage.file) {
      formData.append("image_file", postImage.file);
    }

    try {
      await axios.post("http://127.0.0.1:8000/api/posts", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      setNewPostContent("");
      setPostImage({ file: null, preview: "" });
      fetchGlobalPosts();
    } catch (error) {
      alert("Failed to post.");
    }
  };

  // --- INTERACTION HANDLERS ---
  const reactions = [
    { emoji: "👍", label: "Like", type: "like" },
    { emoji: "❤️", label: "Love", type: "love" },
    { emoji: "😮", label: "Shock", type: "shock" },
    { emoji: "🚀", label: "Rocket", type: "rocket" },
    { emoji: "📈", label: "Bullish", type: "chart_up" },
    { emoji: "👏", label: "Clap", type: "clap" },
  ];

  const getReactionEmoji = (type) => reactions.find((r) => r.type === type)?.emoji || "👍";

  const handleReaction = async (postId, type) => {
    const token = localStorage.getItem("token");
    if (!token) return alert("Please login to react.");

    setPosts(posts.map((p) => {
      if (p.id === postId) {
        const isSame = p.user_reaction === type;
        const isNew = !p.user_reaction;
        let newLikes = p.likes;
        let newReaction = type;
        if (isSame) { newLikes = Math.max(0, newLikes - 1); newReaction = null; }
        else if (isNew) { newLikes += 1; }
        return { ...p, likes: newLikes, user_reaction: newReaction };
      }
      return p;
    }));

    try {
      await axios.post(`http://127.0.0.1:8000/api/posts/${postId}/react`, { type }, { headers: { Authorization: `Bearer ${token}` } });
    } catch (error) {
      console.error("Reaction failed", error);
      fetchGlobalPosts();
    }
    setReactionModalPostId(null);
  };

  const handlePressStart = (postId) => {
    isLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      setReactionModalPostId(postId);
    }, 300);
  };

  const handlePressEnd = (postId) => {
    clearTimeout(longPressTimer.current);
    if (!isLongPress.current) {
      const post = posts.find((p) => p.id === postId);
      if (post) handleReaction(postId, post.user_reaction || "like");
    }
  };

  const toggleComments = async (postId) => {
    const isExpanded = !!expandedComments[postId];
    setExpandedComments({ ...expandedComments, [postId]: !isExpanded });
    if (!isExpanded && !commentsData[postId]) {
      try {
        const res = await axios.get(`http://127.0.0.1:8000/api/posts/${postId}/comments`);
        setCommentsData({ ...commentsData, [postId]: res.data });
      } catch (error) { console.error("Fetch comments failed", error); }
    }
  };

  const submitComment = async (postId, content, parentId = null) => {
    const token = localStorage.getItem("token");
    if (!content || !content.trim()) return;
    if (!token) return alert("Please login to comment.");

    try {
      const res = await axios.post(`http://127.0.0.1:8000/api/posts/${postId}/comments`, { content, parent_id: parentId }, { headers: { Authorization: `Bearer ${token}` } });
      const currentComments = commentsData[postId] || [];
      setCommentsData({ ...commentsData, [postId]: [...currentComments, res.data] });
      if (parentId) { setReplyingTo(null); setReplyContent(""); }
      else { setNewCommentText({ ...newCommentText, [postId]: "" }); }
      setPosts(posts.map((p) => p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p));
    } catch (error) { console.error("Comment failed", error); }
  };

  const handleShare = async (postId) => {
    try {
      await axios.post(`http://127.0.0.1:8000/api/posts/${postId}/share`);
      setPosts(posts.map((p) => p.id === postId ? { ...p, shares_count: p.shares_count + 1 } : p));
      alert("Post shared!");
    } catch (error) { console.error("Share failed", error); }
  };

  // --- EDIT & DELETE HANDLERS ---
  const handleDeletePost = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://127.0.0.1:8000/api/posts/${postId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPosts(posts.filter((p) => p.id !== postId));
      setActiveMenu(null);
    } catch (error) {
      alert("Failed to delete post");
    }
  };

  const handleUpdatePost = async () => {
    if (!editingItem || !editingItem.content.trim()) return;
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(
        `http://127.0.0.1:8000/api/posts/${editingItem.id}`,
        {
          content: editingItem.content,
          image_url: editingItem.image_url,
          link_url: editingItem.link_url,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setPosts(
        posts.map((p) => (p.id === editingItem.id ? { ...p, ...res.data } : p))
      );
      setEditingItem(null);
    } catch (error) {
      alert("Failed to update post");
    }
  };

  const handleUpdateComment = async () => {
    if (!editingItem || !editingItem.content.trim()) return;
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(
        `http://127.0.0.1:8000/api/comments/${editingItem.id}`,
        {
          content: editingItem.content,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const postId = res.data.post_id;
      const updatedComments = commentsData[postId].map((c) =>
        c.id === editingItem.id ? res.data : c
      );
      setCommentsData({ ...commentsData, [postId]: updatedComments });

      setEditingItem(null);
    } catch (error) {
      alert("Failed to update comment");
    }
  };

  const handleDeleteComment = async (commentId, postId) => {
    if (!window.confirm("Delete this comment?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://127.0.0.1:8000/api/comments/${commentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const updatedComments = commentsData[postId].filter(
        (c) => c.id !== commentId
      );
      setCommentsData({ ...commentsData, [postId]: updatedComments });

      setPosts(
        posts.map((p) =>
          p.id === postId
            ? { ...p, comments_count: Math.max(0, p.comments_count - 1) }
            : p
        )
      );
      setActiveMenu(null);
    } catch (error) {
      alert("Failed to delete comment");
    }
  };

  const toggleMenu = (type, id) => {
    if (activeMenu && activeMenu.type === type && activeMenu.id === id) {
      setActiveMenu(null);
    } else {
      setActiveMenu({ type, id });
    }
  };

  const startEditPost = (post) => {
    setEditingItem({
      type: "post",
      id: post.id,
      content: post.content,
      image_url: post.image_url,
      link_url: post.link_url,
    });
    setActiveMenu(null);
  };

  const startEditComment = (comment) => {
    setEditingItem({
      type: "comment",
      id: comment.id,
      content: comment.content,
    });
    setActiveMenu(null);
  };

  // Mention Logic
  const handleMentionableInputChange = (e) => {
    const input = e.target;
    const text = input.value;
    const cursorPosition = input.selectionStart;
    const lastAt = text.lastIndexOf("@", cursorPosition - 1);
    const lastSpace = text.lastIndexOf(" ", cursorPosition - 1);

    if (lastAt > lastSpace) {
      const query = text.substring(lastAt + 1, cursorPosition);
      const rect = input.getBoundingClientRect();
      setMentionState({ active: true, query, suggestions: [], target: input, position: { top: rect.bottom + window.scrollY, left: rect.left + window.scrollX } });
    } else {
      setMentionState((prev) => ({ ...prev, active: false }));
    }
  };

  useEffect(() => {
    if (mentionState.active) {
      clearTimeout(mentionDebounceTimer.current);
      mentionDebounceTimer.current = setTimeout(async () => {
        if (mentionState.query.trim() === "") return;
        try {
          const res = await axios.get(`http://127.0.0.1:8000/api/users/search?q=${mentionState.query}`);
          setMentionState((prev) => ({ ...prev, suggestions: res.data }));
        } catch (error) {}
      }, 300);
    }
  }, [mentionState.query, mentionState.active]);

  const insertMention = (username) => {
    const { target } = mentionState;
    if (!target) return;
    const text = target.value;
    const cursorPosition = target.selectionStart;
    const lastAt = text.lastIndexOf("@", cursorPosition - 1);
    const newText = `${text.substring(0, lastAt)}@${username} ${text.substring(cursorPosition)}`;

    if (target.name === "mainPostContent") setNewPostContent(newText);
    else if (target.name.startsWith("commentInput-")) {
      const postId = target.name.split("-")[1];
      setNewCommentText({ ...newCommentText, [postId]: newText });
    } else if (target.name === "replyInput") setReplyContent(newText);

    setMentionState({ active: false, query: "", suggestions: [], target: null, position: { top: 0, left: 0 } });
    setTimeout(() => target.focus(), 0);
  };

  const renderWithMentions = (text) => text.split(/(@\w+)/g).map((part, i) => part.startsWith("@") ? <strong key={i} className="text-blue-500 font-normal">{part}</strong> : part);

  const buildCommentTree = (comments) => {
    const commentMap = {};
    const topLevelComments = [];
    comments.forEach((c) => { commentMap[c.id] = { ...c, children: [] }; });
    comments.forEach((c) => {
      if (c.parent_id && commentMap[c.parent_id]) commentMap[c.parent_id].children.push(commentMap[c.id]);
      else topLevelComments.push(commentMap[c.id]);
    });
    return topLevelComments;
  };

  const ReplyForm = ({ parentComment }) => (
    <form onSubmit={(e) => { e.preventDefault(); submitComment(parentComment.post_id, replyContent, parentComment.id); }} className="mt-2 ml-8 flex gap-2">
      <input
        type="text" name="replyInput" value={replyContent}
        onChange={(e) => { setReplyContent(e.target.value); handleMentionableInputChange(e); }}
        placeholder={`Replying to ${parentComment.username}...`}
        className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-xs focus:border-blue-500 outline-none" autoFocus
      />
      <button type="submit" className="text-xs bg-blue-600 text-white px-3 rounded hover:bg-blue-500">Reply</button>
      <button type="button" onClick={() => { setReplyingTo(null); setReplyContent(""); }} className="text-xs text-gray-400 hover:text-white">Cancel</button>
    </form>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
      {/* LEFT SIDEBAR (Widgets) */}
      <div className="hidden lg:block lg:col-span-1">
        <div className="space-y-6 sticky top-24">
        {/* Market Price Widget */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 shadow-lg overflow-hidden relative h-32">
          <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">
            Market Watch
          </h3>
          {marketPrices.length > 0 ? (
            <div className="absolute inset-0 flex items-center justify-center pt-6">
              <div className="text-center animate-fade-in key={currentPriceIndex}">
                <p className="text-2xl font-bold text-white">
                  {marketPrices[currentPriceIndex].symbol.replace("-USD", "")}
                </p>
                <p className="text-xl text-green-400 font-mono">
                ${marketPrices[currentPriceIndex].price < 1 
                      ? marketPrices[currentPriceIndex].price.toFixed(8) 
                      : marketPrices[currentPriceIndex].price.toLocaleString()}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-500 text-center mt-4">Loading...</p>
          )}
        </div>

        {/* News Widget */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 shadow-lg h-64 relative overflow-hidden">
          <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">
            Crypto News
          </h3>
          {news.length > 0 ? (
            <div className="absolute inset-x-4 top-10 bottom-4">
              <div className="h-full flex flex-col">
                <img
                  src={news[currentNewsIndex].imageurl}
                  alt="News"
                  className="w-full h-24 object-cover rounded mb-2"
                />
                <a
                  href={news[currentNewsIndex].url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-bold text-white hover:text-blue-400 line-clamp-2"
                >
                  {news[currentNewsIndex].title}
                </a>
                <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                  {news[currentNewsIndex].body}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-500 text-center mt-10">
              Loading News...
            </p>
          )}
        </div>
        </div>
      </div>

      {/* CENTER (Main Feed) */}
      <div className="lg:col-span-2 space-y-6">
        {/* Create Post Box */}
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <form onSubmit={handlePostSubmit}>
            <textarea
              value={newPostContent}
              name="mainPostContent"
              onChange={(e) => {
                setNewPostContent(e.target.value);
                handleMentionableInputChange(e);
              }}
              onPaste={handlePaste}
              placeholder={`What's happening, ${currentUser || "Guest"}?`}
              className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 min-h-[80px]"
            />
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
            <div className="flex justify-between items-center mt-2">
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
                type="submit"
                className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-1.5 rounded-lg font-bold text-sm"
              >
                Post
              </button>
            </div>
          </form>
        </div>

        {/* Feed */}
        <div className="space-y-4">
        {posts.map((post) => {
            const community = post.community_id ? communities.find(c => c.id === post.community_id) : null;
            
            return (
              <div key={post.id} className="bg-gray-800 p-5 rounded-lg border border-gray-700">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                      {post.username.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white flex items-center gap-1">
                        {post.username}
                        {community && (
                          <span className="text-gray-400 font-normal text-xs">
                            posted at <span 
                              className="text-blue-400 cursor-pointer hover:underline"
                              onClick={() => { setActiveCommunity(community); setActiveView("community"); }}
                            >
                              {community.name}
                            </span>
                          </span>
                        )}
                      </p>
                      <p className="text-[10px] text-gray-500">
                        {new Date(post.created_at).toLocaleString()}
                        {post.is_edited && (
                          <span className="ml-1 italic opacity-75">(edited)</span>
                        )}
                      </p>
                    </div>
                  </div>
                  {currentUser === post.username && (
                    <div className="relative">
                      <button onClick={() => toggleMenu("post", post.id)} className="text-gray-400 hover:text-white p-1">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                        </svg>
                      </button>
                      {activeMenu?.type === "post" && activeMenu?.id === post.id && (
                        <div ref={menuRef} className="absolute right-0 mt-1 w-32 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-20 overflow-hidden">
                          <button onClick={() => startEditPost(post)} className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white">Edit</button>
                          <button onClick={() => handleDeletePost(post.id)} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-800 hover:text-red-300">Delete</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {editingItem?.type === "post" && editingItem?.id === post.id ? (
                  <div className="space-y-2">
                    <textarea value={editingItem.content} onChange={(e) => setEditingItem({ ...editingItem, content: e.target.value })} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white text-sm focus:border-blue-500 outline-none" rows={3} />
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setEditingItem(null)} className="text-xs text-gray-400 hover:text-white px-3 py-1">Cancel</button>
                      <button onClick={handleUpdatePost} className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-500">Save</button>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                    {renderWithMentions(post.content)}
                  </p>
                )}
                {post.image_url && (
                  <div className="mt-3 rounded-lg overflow-hidden border border-gray-700">
                    <img
                      src={`http://127.0.0.1:8000${post.image_url}`}
                      alt="Post attachment"
                      className="w-full h-auto max-h-[400px] object-cover cursor-pointer hover:opacity-90"
                      onClick={() => setPreviewImage(`http://127.0.0.1:8000${post.image_url}`)}
                    />
                  </div>
                )}
                
                {/* Actions */}
                <div className="flex items-center gap-6 mt-4 pt-4 border-t border-gray-700/50">
                  <div className="relative group">
                    <button
                      onMouseDown={() => handlePressStart(post.id)}
                      onMouseUp={() => handlePressEnd(post.id)}
                      onTouchStart={() => handlePressStart(post.id)}
                      onTouchEnd={() => handlePressEnd(post.id)}
                      className={`flex items-center gap-2 transition-colors ${post.user_reaction ? "text-blue-400" : "text-gray-400 hover:text-blue-400"}`}
                    >
                      {post.user_reaction ? <span className="text-xl">{getReactionEmoji(post.user_reaction)}</span> : 
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.5c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a2.25 2.25 0 012.25 2.25V7.5h3.75a2.25 2.25 0 012.25 2.25v6.75a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 16.5v-6a2.25 2.25 0 012.25-2.25v-.003zM6.75 16.5v-6" /></svg>}
                      <span className="text-sm font-bold">{post.likes > 0 ? post.likes : ""}</span>
                    </button>
                    {reactionModalPostId === post.id && (
                      <div className="absolute bottom-full left-0 mb-2 flex bg-gray-900 border border-gray-600 rounded-full p-1 shadow-xl gap-1 z-10 animate-fade-in w-max reaction-modal">
                        {reactions.map((r) => (
                          <button key={r.type} onClick={() => handleReaction(post.id, r.type)} className="p-2 hover:bg-gray-700 rounded-full transition-transform hover:scale-125 text-xl" title={r.label}>{r.emoji}</button>
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
                {expandedComments[post.id] && (
                  <div className="mt-4 pt-4 border-t border-gray-700/50 animate-fade-in">
                    {(() => {
                      const commentTree = buildCommentTree(commentsData[post.id] || []);
                      const renderComment = (comment) => (
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
                                <span className="font-bold text-blue-400 mr-2">{comment.username}</span>
                                <span className="text-gray-300">{renderWithMentions(comment.content)}</span>
                                {comment.is_edited && (
                                  <span className="ml-2 text-[10px] text-gray-500 italic">(edited)</span>
                                )}
                              </div>
                            )}
                            <div className="flex items-center gap-4 mt-2">
                              <button onClick={() => { setReplyingTo({ commentId: comment.id, username: comment.username }); setReplyContent(""); }} className="text-[10px] text-gray-400 hover:text-white font-bold">Reply</button>
                              {currentUser === comment.username && (
                                <div className="relative">
                                  <button onClick={() => toggleMenu("comment", comment.id)} className="text-gray-500 hover:text-white">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                                    </svg>
                                  </button>
                                  {activeMenu?.type === "comment" && activeMenu?.id === comment.id && (
                                    <div ref={menuRef} className="absolute left-0 mt-1 w-24 bg-gray-800 border border-gray-600 rounded shadow-xl z-20">
                                      <button onClick={() => startEditComment(comment)} className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-700">Edit</button>
                                      <button onClick={() => handleDeleteComment(comment.id, post.id)} className="w-full text-left px-3 py-1.5 text-xs text-red-400 hover:bg-gray-700">Delete</button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          {replyingTo?.commentId === comment.id && <ReplyForm parentComment={comment} />}
                          {comment.children.length > 0 && <div className="mt-3">{comment.children.map(renderComment)}</div>}
                        </div>
                      );
                      return commentTree.length > 0 ? commentTree.map(renderComment) : <p className="text-xs text-gray-500 italic">No comments yet.</p>;
                    })()}
                    <div className="flex gap-2 mt-3">
                      <input
                        type="text" placeholder="Write a comment..." name={`commentInput-${post.id}`}
                        value={newCommentText[post.id] || ""}
                        onChange={(e) => { setNewCommentText({ ...newCommentText, [post.id]: e.target.value }); handleMentionableInputChange(e); }}
                        className="flex-1 bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
                        onKeyPress={(e) => e.key === "Enter" && submitComment(post.id, newCommentText[post.id])}
                      />
                      <button onClick={() => submitComment(post.id, newCommentText[post.id])} className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded text-sm font-bold">Send</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Mention Box */}
      {mentionState.active && mentionState.suggestions.length > 0 && (
        <div className="mention-box absolute z-30 w-48 bg-gray-800 border border-gray-600 rounded-lg shadow-xl overflow-hidden" style={{ top: mentionState.position.top, left: mentionState.position.left }}>
          {mentionState.suggestions.map((user) => (
            <button key={user.username} onClick={() => insertMention(user.username)} className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-blue-600">{user.username}</button>
          ))}
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4" onClick={() => setPreviewImage(null)}>
          <button className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors" onClick={() => setPreviewImage(null)}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          <img src={previewImage} alt="Full Preview" className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      {/* RIGHT SIDEBAR (Communities) */}
      <div className="hidden lg:block lg:col-span-1">
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 shadow-lg sticky top-24">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-blue-500">👥</span> Your Communities
          </h3>
          <div className="space-y-3">
            {communities.length === 0 ? (
              <p className="text-xs text-gray-500">No communities yet.</p>
            ) : (
              communities.map((comm) => (
                <div
                  key={comm.id}
                  onClick={() => {
                    setActiveCommunity(comm);
                    setActiveView("community");
                  }}
                  className="flex items-center justify-between p-2 hover:bg-gray-700 rounded cursor-pointer group transition-colors"
                >
                  <div>
                    <p className="text-sm font-bold text-gray-300 group-hover:text-white">
                      {comm.name}
                    </p>
                    <p className="text-[10px] text-gray-500">
                      {comm.members_count} Members
                    </p>
                  </div>
                  <span className="text-gray-500 group-hover:text-blue-400">
                    →
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
