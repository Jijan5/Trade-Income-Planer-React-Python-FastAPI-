import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

const Community = ({
  activeCommunity,
  setActiveCommunity,
  highlightedPost,
  setHighlightedPost,
}) => {
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [joinedCommunityIds, setJoinedCommunityIds] = useState([]);

  // Community Creation State
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

  // Reaction Modal State
  const [reactionModalPostId, setReactionModalPostId] = useState(null);
  const longPressTimer = useRef(null);
  const isLongPress = useRef(false);
  const fileInputRef = useRef(null);

  // Interaction States
  const [expandedComments, setExpandedComments] = useState({}); // { postId: boolean }
  const [commentsData, setCommentsData] = useState({}); // { postId: [comments] }
  const [newCommentText, setNewCommentText] = useState({}); // { postId: string }

  // Reply & Mention States
  const [replyingTo, setReplyingTo] = useState(null); // { commentId, username }
  const [mentionState, setMentionState] = useState({
    active: false,
    query: "",
    suggestions: [],
    target: null,
    position: { top: 0, left: 0 },
  });
  const [replyContent, setReplyContent] = useState(""); // State for the reply input
  const mentionDebounceTimer = useRef(null);

  // Edit & Menu States
  const [activeMenu, setActiveMenu] = useState(null); // { type: 'post'|'comment', id: number }
  const [editingItem, setEditingItem] = useState(null); // { type: 'post'|'comment', id: number, content: string, ... }
  const menuRef = useRef(null);
  const [previewImage, setPreviewImage] = useState(null);

  // Exit Modal State
  const [showExitModal, setShowExitModal] = useState(false);
  const [communityToExit, setCommunityToExit] = useState(null);

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

  const fetchJoinedCommunities = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await axios.get(
        "http://127.0.0.1:8000/api/users/me/joined_communities",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setJoinedCommunityIds(res.data);
    } catch (e) {
      console.error("Failed to fetch joined communities", e);
    }
  };

  useEffect(() => {
    fetchCommunities();
    fetchJoinedCommunities();
  }, []);

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

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (reactionModalPostId && !event.target.closest(".reaction-modal")) {
        setReactionModalPostId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [reactionModalPostId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close mention box
      if (mentionState.active && !event.target.closest(".mention-box")) {
        setMentionState((prev) => ({ ...prev, active: false }));
      }

      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [mentionState.active, activeMenu]);

  const renderVerifiedBadge = (item) => {
    if (!item) return null;
    let badge = null;

    if (item.user_role === "admin") {
      badge = { color: "text-red-500", title: "Admin" };
    } else if (item.user_plan === "Platinum") {
      badge = { color: "text-yellow-400", title: "Platinum User" };
    }

    if (!badge) return null;

    return (
      <span title={badge.title} className={`${badge.color} ml-1`}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-4 h-4"
        >
          <path
            fillRule="evenodd"
            d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.491 4.491 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
            clipRule="evenodd"
          />
        </svg>
      </span>
    );
  };

  const fetchPosts = async (communityId) => {
    try {
      const response = await axios.get(
        `http://127.0.0.1:8000/api/communities/${communityId}/posts`
      );
      setPosts(response.data);
    } catch (error) {
      console.error("Failed to fetch posts", error);
    }
  };

  // Handle Create Community
  const handleCreate = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) return alert("Please login first");

    const formData = new FormData();
    formData.append("name", newComm.name);
    formData.append("description", newComm.description);
    formData.append("bg_type", newComm.bgType);
    formData.append("bg_value", newComm.bgValue);
    formData.append("text_color", newComm.textColor);
    formData.append("font_family", newComm.fontFamily);
    formData.append("hover_animation", newComm.hoverAnimation);
    formData.append("hover_color", newComm.hoverColor);

    if (commAvatar) formData.append("avatar_file", commAvatar);
    if (commBgImage && newComm.bgType === "image")
      formData.append("bg_image_file", commBgImage);
    try {
      await axios.post("http://127.0.0.1:8000/api/communities", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
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
      setCommAvatar(null);
      setCommBgImage(null);
      setPreviewCommAvatar(null);
      setPreviewCommBg(null);
      fetchCommunities(); // Refresh list
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
    if (!token) return alert("Please login to join.");

    try {
      await axios.post(
        `http://127.0.0.1:8000/api/communities/${comm.id}/join`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setJoinedCommunityIds([...joinedCommunityIds, comm.id]);
      setCommunities(
        communities.map((c) =>
          c.id === comm.id ? { ...c, members_count: c.members_count + 1 } : c
        )
      );
      // Optional: Auto enter after join
      setActiveCommunity(comm);
    } catch (error) {
      alert("Failed to join community.");
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
      await axios.post(
        `http://127.0.0.1:8000/api/communities/${communityToExit.id}/leave`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
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
      alert("Failed to leave community.");
    }
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

  // Handle Create Post
  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!newPostContent.trim() && !postImage.file && !newPostLink.trim())
      return;

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login to post.");
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
      await axios.post(
        `http://127.0.0.1:8000/api/communities/${activeCommunity.id}/posts`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
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
      alert(msg);
    }
  };

  // --- INTERACTION HANDLERS ---

  const handleReaction = async (postId, type) => {
    const token = localStorage.getItem("token");
    if (!token) return alert("Please login to react.");

    // Optimistic UI Update
    setPosts(
      posts.map((p) => {
        if (p.id === postId) {
          const isSame = p.user_reaction === type;
          const isNew = !p.user_reaction;

          let newLikes = p.likes;
          let newReaction = type;

          if (isSame) {
            // Remove like
            newLikes = Math.max(0, newLikes - 1);
            newReaction = null;
          } else if (isNew) {
            // Add like
            newLikes += 1;
          }
          // If swapping (isDifferent), likes count stays same, just update reaction type

          return { ...p, likes: newLikes, user_reaction: newReaction };
        }
        return p;
      })
    );

    try {
      await axios.post(
        `http://127.0.0.1:8000/api/posts/${postId}/react`,
        { type },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error("Reaction failed", error);
      if (error.response && error.response.status === 401) {
        alert("Session expired. Please login again.");
      }
      fetchPosts(activeCommunity.id); // Revert on error
    }
    setReactionModalPostId(null); // Close modal after reaction
  };

  const toggleComments = async (postId) => {
    const isExpanded = !!expandedComments[postId];
    setExpandedComments({ ...expandedComments, [postId]: !isExpanded });

    if (!isExpanded && !commentsData[postId]) {
      // Fetch comments if opening and not loaded yet
      try {
        const res = await axios.get(
          `http://127.0.0.1:8000/api/posts/${postId}/comments`
        );
        setCommentsData({ ...commentsData, [postId]: res.data });
      } catch (error) {
        console.error("Fetch comments failed", error);
      }
    }
  };

  const submitComment = async (postId, content, parentId = null) => {
    const token = localStorage.getItem("token");
    if (!content || !content.trim()) return;
    if (!token) return alert("Please login to comment.");

    try {
      const res = await axios.post(
        `http://127.0.0.1:8000/api/posts/${postId}/comments`,
        { content, parent_id: parentId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update local state
      const currentComments = commentsData[postId] || [];
      setCommentsData({
        ...commentsData,
        [postId]: [...currentComments, res.data],
      });
      if (parentId) {
        setReplyingTo(null);
        setReplyContent(""); // Clear reply input// Close reply form
      } else {
        setNewCommentText({ ...newCommentText, [postId]: "" }); // Clear main comment form
      }

      // Update comment count on post
      setPosts(
        posts.map((p) =>
          p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p
        )
      );
    } catch (error) {
      console.error("Comment failed", error);
    }
  };

  const handleShare = async (postId) => {
    try {
      await axios.post(`http://127.0.0.1:8000/api/posts/${postId}/share`);
      setPosts(
        posts.map((p) =>
          p.id === postId ? { ...p, shares_count: p.shares_count + 1 } : p
        )
      );
      alert("Post shared to your timeline! (Simulated)");
    } catch (error) {
      console.error("Share failed", error);
    }
  };

  const handlePressStart = (postId) => {
    isLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      setReactionModalPostId(postId);
    }, 100);
  };

  const handlePressEnd = (postId) => {
    clearTimeout(longPressTimer.current);
    if (!isLongPress.current) {
      const post = posts.find((p) => p.id === postId);
      if (post) {
        handleReaction(postId, post.user_reaction || "like");
      }
    }
  };

  const reactions = [
    { emoji: "👍", label: "Like", type: "like" },
    { emoji: "❤️", label: "Love", type: "love" },
    { emoji: "😮", label: "Shock", type: "shock" },
    { emoji: "🚀", label: "Rocket", type: "rocket" },
    { emoji: "📈", label: "Bullish", type: "chart_up" },
    { emoji: "👏", label: "Clap", type: "clap" },
  ];

  const getReactionEmoji = (type) => {
    return reactions.find((r) => r.type === type)?.emoji || "👍";
  };

  // --- MENTION HANDLERS ---
  const handleMentionableInputChange = (e) => {
    const input = e.target;
    const text = input.value;
    const cursorPosition = input.selectionStart;

    const lastAt = text.lastIndexOf("@", cursorPosition - 1);
    const lastSpace = text.lastIndexOf(" ", cursorPosition - 1);

    if (lastAt > lastSpace) {
      const query = text.substring(lastAt + 1, cursorPosition);
      const rect = input.getBoundingClientRect();
      setMentionState({
        active: true,
        query: query,
        suggestions: [],
        target: input,
        position: {
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX,
        },
      });
    } else {
      setMentionState((prev) => ({ ...prev, active: false }));
    }
  };

  useEffect(() => {
    if (mentionState.active) {
      clearTimeout(mentionDebounceTimer.current);
      mentionDebounceTimer.current = setTimeout(async () => {
        if (mentionState.query.trim() === "" && mentionState.query !== "")
          return; // Don't search for empty string after @
        try {
          const res = await axios.get(
            `http://127.0.0.1:8000/api/users/search?q=${mentionState.query}`
          );
          setMentionState((prev) => ({ ...prev, suggestions: res.data }));
        } catch (error) {
          console.error("Failed to search users", error);
        }
      }, 300);
    }
  }, [mentionState.query, mentionState.active]);

  const insertMention = (username) => {
    const { target } = mentionState;
    if (!target) return;

    const text = target.value;
    const cursorPosition = target.selectionStart;
    const lastAt = text.lastIndexOf("@", cursorPosition - 1);

    const newText = `${text.substring(0, lastAt)}@${username} ${text.substring(
      cursorPosition
    )}`;

    // Update the correct state based on the input's name or another identifier
    if (target.name === "mainPostContent") {
      setNewPostContent(newText);
    } else if (target.name.startsWith("commentInput-")) {
      const postId = target.name.split("-")[1];
      setNewCommentText({ ...newCommentText, [postId]: newText });
    } else if (target.name === "replyInput") {
      setReplyContent(newText);
    }

    setMentionState({
      active: false,
      query: "",
      suggestions: [],
      target: null,
      position: { top: 0, left: 0 },
    });
    setTimeout(() => target.focus(), 0); // Refocus the input
  };

  const renderWithMentions = (text) => {
    return text.split(/(@\w+)/g).map((part, i) =>
      part.startsWith("@") ? (
        <strong key={i} className="text-blue-500 font-normal">
          {part}
        </strong>
      ) : (
        part
      )
    );
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

      // Update local state
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

      // Update local comments
      const updatedComments = commentsData[postId].filter(
        (c) => c.id !== commentId
      );
      setCommentsData({ ...commentsData, [postId]: updatedComments });

      // Update post comment count
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

  // Note: Edit comment logic is simpler (no image/link) but backend supports content update
  // For brevity, I'll implement delete first as requested, and basic edit structure.
  // Since backend update_comment exists, let's add it.

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

  // --- RECURSIVE COMMENT RENDERING ---
  const buildCommentTree = (comments) => {
    const commentMap = {};
    const topLevelComments = [];
    comments.forEach((c) => {
      commentMap[c.id] = { ...c, children: [] };
    });
    comments.forEach((c) => {
      if (c.parent_id && commentMap[c.parent_id]) {
        commentMap[c.parent_id].children.push(commentMap[c.id]);
      } else {
        topLevelComments.push(commentMap[c.id]);
      }
    });
    return topLevelComments;
  };

  // Reply Form Component
  const ReplyForm = ({ parentComment }) => {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submitComment(parentComment.post_id, replyContent, parentComment.id);
        }}
        className="mt-2 ml-8 flex gap-2"
      >
        <input
          type="text"
          name="replyInput"
          value={replyContent}
          onChange={(e) => {
            setReplyContent(e.target.value);
            handleMentionableInputChange(e);
          }}
          placeholder={`Replying to ${parentComment.username}...`}
          className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-xs focus:border-blue-500 outline-none"
          autoFocus
        />
        <button
          type="submit"
          className="text-xs bg-blue-600 text-white px-3 rounded hover:bg-blue-500"
        >
          Reply
        </button>
        <button
          type="button"
          onClick={() => {
            setReplyingTo(null);
            setReplyContent("");
          }}
          className="text-xs text-gray-400 hover:text-white"
        >
          Cancel
        </button>
      </form>
    );
  };

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
      style.backgroundImage = `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url(http://127.0.0.1:8000${comm.bg_value})`;
      style.backgroundSize = "cover";
      style.backgroundPosition = "center";
    } else if (comm.bg_type === "gradient") {
      style.background = comm.bg_value;
    } else {
      style.backgroundColor = comm.bg_value || "#1f2937";
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
                src={`http://127.0.0.1:8000${activeCommunity.avatar_url}`}
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
                onClick={() => setActiveCommunity(null)}
                className="opacity-70 hover:opacity-100 text-sm mb-1 flex items-center gap-1 font-bold"
              >
                ← Back to Communities
              </button>
              <h2 className="text-2xl font-bold">{activeCommunity.name}</h2>
              <p className="opacity-80 text-sm">
                {activeCommunity.description}
              </p>
            </div>
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
              onChange={(e) => {
                setNewPostContent(e.target.value);
                handleMentionableInputChange(e);
              }}
              name="mainPostContent"
              onPaste={handlePaste}
              placeholder={`What's on your mind? Share a strategy or crypto news...`}
              className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 min-h-[100px]"
            />

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
        <div className="space-y-4">
          {posts.length === 0 ? (
            <div className="text-center text-gray-500 py-10">
              No posts yet. Be the first to share!
            </div>
          ) : (
            posts.map((post) => (
              <div
                key={post.id}
                className="bg-gray-800 p-5 rounded-lg border border-gray-700"
              >
                {/* Post Header & Menu */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    {post.user_avatar_url ? (
                      <img
                        src={`http://127.0.0.1:8000${post.user_avatar_url}`}
                        alt={post.username}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                        {post.username.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-bold text-white flex items-center">
                        {post.username}
                        {renderVerifiedBadge(post)}
                      </p>
                      <p className="text-[10px] text-gray-500">
                        {new Date(post.created_at).toLocaleString()}
                        {post.is_edited && (
                          <span className="ml-1 italic opacity-75">
                            (edited)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  {/* Post Menu (Only for owner) */}
                  {currentUser === post.username && (
                    <div className="relative">
                      <button
                        onClick={() => toggleMenu("post", post.id)}
                        className="text-gray-400 hover:text-white p-1"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-6 h-6"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
                          />
                        </svg>
                      </button>
                      {activeMenu?.type === "post" &&
                        activeMenu?.id === post.id && (
                          <div
                            ref={menuRef}
                            className="absolute right-0 mt-1 w-32 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-20 overflow-hidden"
                          >
                            <button
                              onClick={() => startEditPost(post)}
                              className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeletePost(post.id)}
                              className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-800 hover:text-red-300"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                    </div>
                  )}
                </div>
                {/* Post Content */}
                {editingItem?.type === "post" && editingItem?.id === post.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={editingItem.content}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          content: e.target.value,
                        })
                      }
                      className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white text-sm focus:border-blue-500 outline-none"
                      rows={3}
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setEditingItem(null)}
                        className="text-xs text-gray-400 hover:text-white px-3 py-1"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleUpdatePost}
                        className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-500"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                    {renderWithMentions(post.content)}
                  </p>
                )}

                {/* Post Media */}
                {post.image_url && (
                  <div className="mt-3 rounded-lg overflow-hidden border border-gray-700">
                    <img
                      src={`http://127.0.0.1:8000${post.image_url}`}
                      alt="Post attachment"
                      className="w-full h-auto max-h-[400px] object-cover cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() =>
                        setPreviewImage(
                          `http://127.0.0.1:8000${post.image_url}`
                        )
                      }
                    />
                  </div>
                )}
                {post.link_url && (
                  <a
                    href={post.link_url}
                    target="_blank"
                    rel="noreferrer"
                    className="block mt-3 p-3 bg-gray-900/50 border border-gray-700 rounded text-blue-400 text-sm hover:underline truncate"
                  >
                    🔗 {post.link_url}
                  </a>
                )}

                {/* Post Actions (Like, Comment, Share) */}
                <div className="flex items-center gap-6 mt-4 pt-4">
                  {/* Like / Reaction Button with Hover Menu */}
                  <div className="relative group">
                    <button
                      onMouseDown={() => handlePressStart(post.id)}
                      onMouseUp={() => handlePressEnd(post.id)}
                      onTouchStart={() => handlePressStart(post.id)}
                      onTouchEnd={() => handlePressEnd(post.id)}
                      className={`flex items-center gap-2 transition-colors ${
                        post.user_reaction
                          ? "text-blue-400"
                          : "text-gray-400 hover:text-blue-400"
                      }`}
                    >
                      {post.user_reaction ? (
                        <span className="text-xl">
                          {getReactionEmoji(post.user_reaction)}
                        </span>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-5 h-5"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6.633 10.5c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a2.25 2.25 0 012.25 2.25V7.5h3.75a2.25 2.25 0 012.25 2.25v6.75a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 16.5v-6a2.25 2.25 0 012.25-2.25v-.003zM6.75 16.5v-6"
                          />
                        </svg>
                      )}
                      <span className="text-sm font-bold">
                        {post.likes > 0 ? post.likes : ""}
                      </span>
                    </button>

                    {/* Reaction Popup */}
                    {reactionModalPostId === post.id && (
                      <div className="absolute bottom-full left-0 mb-2 flex bg-gray-900 border border-gray-600 rounded-full p-1 shadow-xl gap-1 z-10 animate-fade-in w-max reaction-modal">
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
                    )}
                  </div>

                  <button
                    onClick={() => toggleComments(post.id)}
                    className="flex items-center gap-2 text-gray-400 hover:text-blue-400 transition-colors"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
                      />
                    </svg>
                    <span className="text-sm font-bold">
                      {post.comments_count > 0 ? post.comments_count : ""}
                    </span>
                  </button>

                  <button
                    onClick={() => handleShare(post.id)}
                    className="flex items-center gap-2 text-gray-400 hover:text-blue-400 transition-colors"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.287.696.287 1.093 0 .397-.107.769-.287 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z"
                      />
                    </svg>
                    <span className="text-sm font-bold">
                      {post.shares_count > 0 ? post.shares_count : ""}
                    </span>
                  </button>
                </div>

                {/* Comments Section */}
                {expandedComments[post.id] && (
                  <div className="mt-4 pt-4 border-t border-gray-700/50 animate-fade-in">
                    {(() => {
                      const commentTree = buildCommentTree(
                        commentsData[post.id] || []
                      );

                      const renderComment = (comment) => (
                        <div
                          key={comment.id}
                          className="mt-3"
                          style={{
                            borderLeft: comment.parent_id
                              ? "2px solid #374151"
                              : "none",
                            paddingLeft: comment.parent_id ? "1rem" : "0",
                          }}
                        >
                          <div className="bg-gray-900/50 p-3 rounded text-sm group relative">
                            {editingItem?.type === "comment" &&
                            editingItem?.id === comment.id ? (
                              <div className="space-y-2">
                                <input
                                  type="text"
                                  value={editingItem.content}
                                  onChange={(e) =>
                                    setEditingItem({
                                      ...editingItem,
                                      content: e.target.value,
                                    })
                                  }
                                  className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm focus:border-blue-500 outline-none"
                                />
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() => setEditingItem(null)}
                                    className="text-xs text-gray-400 hover:text-white px-2 py-0.5"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={handleUpdateComment}
                                    className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded hover:bg-blue-500"
                                  >
                                    Save
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="pr-6">
                                <div className="flex items-center">
                                  <span className="font-bold text-blue-400 mr-1">
                                    {comment.username}
                                  </span>
                                  {renderVerifiedBadge(comment)}
                                </div>
                                <p className="text-gray-300">
                                  {renderWithMentions(comment.content)}
                                </p>
                                {comment.is_edited && (
                                  <span className="ml-2 text-[10px] text-gray-500 italic">
                                    (edited)
                                  </span>
                                )}
                              </div>
                            )}

                            <div className="flex items-center gap-4 mt-2">
                              <button
                                onClick={() => {
                                  setReplyingTo({
                                    commentId: comment.id,
                                    username: comment.username,
                                  });
                                  setReplyContent("");
                                }}
                                className="text-[10px] text-gray-400 hover:text-white font-bold"
                              >
                                Reply
                              </button>
                              {currentUser === comment.username && (
                                <div className="relative">
                                  <button
                                    onClick={() =>
                                      toggleMenu("comment", comment.id)
                                    }
                                    className="text-gray-500 hover:text-white"
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      strokeWidth={2}
                                      stroke="currentColor"
                                      className="w-3 h-3"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
                                      />
                                    </svg>
                                  </button>
                                  {activeMenu?.type === "comment" &&
                                    activeMenu?.id === comment.id && (
                                      <div
                                        ref={menuRef}
                                        className="absolute left-0 mt-1 w-24 bg-gray-800 border border-gray-600 rounded shadow-xl z-20"
                                      >
                                        <button
                                          onClick={() =>
                                            startEditComment(comment)
                                          }
                                          className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-700"
                                        >
                                          Edit
                                        </button>
                                        <button
                                          onClick={() =>
                                            handleDeleteComment(
                                              comment.id,
                                              post.id
                                            )
                                          }
                                          className="w-full text-left px-3 py-1.5 text-xs text-red-400 hover:bg-gray-700"
                                        >
                                          Delete
                                        </button>
                                      </div>
                                    )}
                                </div>
                              )}
                            </div>
                          </div>
                          {replyingTo?.commentId === comment.id && (
                            <ReplyForm parentComment={comment} />
                          )}
                          {comment.children.length > 0 && (
                            <div className="mt-3">
                              {comment.children.map(renderComment)}
                            </div>
                          )}
                        </div>
                      );

                      return commentTree.length > 0 ? (
                        commentTree.map(renderComment)
                      ) : (
                        <p className="text-xs text-gray-500 italic">
                          No comments yet.
                        </p>
                      );
                    })()}

                    {/* Add Comment Input */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Write a comment..."
                        name={`commentInput-${post.id}`}
                        value={newCommentText[post.id] || ""}
                        onChange={(e) => {
                          setNewCommentText({
                            ...newCommentText,
                            [post.id]: e.target.value,
                          });
                          handleMentionableInputChange(e);
                        }}
                        className="flex-1 bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
                        onKeyPress={(e) =>
                          e.key === "Enter" &&
                          submitComment(post.id, newCommentText[post.id])
                        }
                      />
                      <button
                        onClick={() =>
                          submitComment(post.id, newCommentText[post.id])
                        }
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
        {/* Mention Box */}
        {mentionState.active && mentionState.suggestions.length > 0 && (
          <div
            className="mention-box absolute z-30 w-48 bg-gray-800 border border-gray-600 rounded-lg shadow-xl overflow-hidden"
            style={{
              top: mentionState.position.top,
              left: mentionState.position.left,
            }}
          >
            {mentionState.suggestions.map((user) => (
              <button
                key={user.username}
                onClick={() => insertMention(user.username)}
                className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-blue-600"
              >
                {user.username}
              </button>
            ))}
          </div>
        )}
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
            return (
              <div
                key={comm.id}
                style={getCardStyle(comm)}
                onClick={() => {
                  if (isCreator || joinedCommunityIds.includes(comm.id)) {
                    setActiveCommunity(comm);
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
                <div className="flex items-center gap-3 mb-4">
                  {comm.avatar_url ? (
                    <img
                      src={`http://127.0.0.1:8000${comm.avatar_url}`}
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
                  {isCreator ? (
                    <span
                      className="text-sm font-bold opacity-70"
                      style={{ color: comm.text_color }}
                    >
                      Creator
                    </span>
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
    </div>
  );
};

export default Community;
