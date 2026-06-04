import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { Crown, Users, ChevronRight, X } from "lucide-react";
import api from "../lib/axios";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import VerifiedBadge from "./VerifiedBadge";
import AuthenticatedImage from "./AuthenticatedImage"; // Import the new component
import MentionInput from "./MentionInput";
import StrategyCard from "./StrategyCard";
import { usePostInteractions } from "../contexts/PostInteractionContext";
import { createPortal } from "react-dom";

// Base URL for resource statis (img/avatar)
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "";

// --- Sub-components to prevent Home re-renders ---
const MarketWidget = React.memo(({ marketPrices, loadingPrices }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (marketPrices.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % marketPrices.length);
    }, 3000);
    return () => {
      clearInterval(interval);
      // Reset the fetching flag when component unmounts
      // isFetchingPrices.current = false;
    };
  }, [marketPrices.length]);

  if (loadingPrices)
    return <p className="text-xs text-gray-500 text-center mt-4">Loading...</p>;
  if (marketPrices.length === 0)
    return (
      <p className="text-xs text-gray-500 text-center mt-4">Unavailable</p>
    );

  const item = marketPrices[currentIndex];
  if (!item) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center pt-6">
      <div className="text-center animate-fade-in" key={currentIndex}>
        <p className="text-2xl font-bold text-white">
          {item.symbol.replace("-USD", "")}
        </p>
        <p className="text-xl text-green-400 font-mono">
          $
          {item.price < 1 ? item.price.toFixed(8) : item.price.toLocaleString()}
        </p>
      </div>
    </div>
  );
});

const NewsWidget = React.memo(({ news }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (news.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % news.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [news.length]);

  if (news.length === 0)
    return (
      <p className="text-xs text-gray-500 text-center mt-10">Loading News...</p>
    );

  const item = news[currentIndex];
  if (!item) return null;

  return (
    <div className="absolute inset-x-4 top-10 bottom-4">
      <div className="h-full flex flex-col animate-fade-in" key={currentIndex}>
        <img
          src={item.imageurl}
          alt="News"
          className="w-full h-24 object-cover rounded mb-2"
        />
        <a
          href={item.url}
          target="_blank"
          rel="noreferrer"
          className="text-sm font-bold text-white hover:text-blue-400 line-clamp-2"
        >
          {item.title}
        </a>
        <p className="text-xs text-gray-400 mt-1 line-clamp-2">{item.body}</p>
      </div>
    </div>
  );
});

const PostItem = React.memo(
  ({ post, community, onPostUpdate, onPostDelete, showFlash }) => {
    const navigate = useNavigate();
    const {
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
      setPreviewImage,
    } = usePostInteractions();

    const isExpanded = !!expandedComments[post.id];
    const comments = commentsData[post.id];
    const commentText = newCommentText[post.id];

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [reportReason, setReportReason] = useState("Inappropriate Content");
    const [customReason, setCustomReason] = useState("");

    const handleLocalReaction = async (type) => {
      // Close modal immediately after selection
      //   if (reactionModalPostId) {
      //     // We don't need to set null here manually if handleReaction does it,
      //     // but for UI responsiveness we can rely on the state update.
      // }
      setReactionModalPostId(null);
      const oldReaction = post.user_reaction;
      const oldLikes = post.likes;
      const isSame = oldReaction === type;
      const newReaction = isSame ? null : type;

      let newLikes = oldLikes;
      if (isSame) newLikes = Math.max(0, newLikes - 1);
      else if (!oldReaction) newLikes += 1;

      onPostUpdate(post.id, { user_reaction: newReaction, likes: newLikes });

      const result = await handleReaction(post, type);
      if (!result.success) {
        onPostUpdate(post.id, { user_reaction: oldReaction, likes: oldLikes });
      }
    };

    const handleLocalPressEnd = async () => {
      // if modal is open, don't do toggle like
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
      // Revert if fail or that was a long press modal
      if (!result.success || result.isLongPress) {
        onPostUpdate(post.id, { user_reaction: oldReaction, likes: oldLikes });
      }
    };
    // Local state for UI toggles specific to this post
    const [visibleLimit, setVisibleLimit] = useState(3);
    const [expandedReplies, setExpandedReplies] = useState({});

    // Reset visible limit when comments are collapsed
    useEffect(() => {
      if (!isExpanded) setVisibleLimit(3);
    }, [isExpanded]);
    const handleReportClick = () => {
      setActiveMenu(null);
      setShowReportModal(true);
    };

    const submitReport = async () => {
      const finalReason =
        reportReason === "Other" ? customReason : reportReason;
      if (!finalReason.trim())
        return showFlash("Please specify a reason.", "error");
      try {
        await api.post("/reports", { post_id: post.id, reason: finalReason });
        showFlash("Post reported successfully.", "success");
        setShowReportModal(false);
        setCustomReason("");
        setReportReason("Inappropriate Content");
      } catch (error) {
        showFlash(
          error.response?.data?.detail || "Failed to report post.",
          "error"
        );
      }
    };
    const handleLocalUpdatePost = async () => {
      const result = await handleUpdatePost(editingItem);
      if (result.success)
        onPostUpdate(result.updatedPost.id, result.updatedPost);
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
    const handleShareOption = (platform) => {
      const shareUrl = `${window.location.origin}/post/${post.id}`;
      const shareText = `Check out this post by ${post.username} on Trade Income Planner!`;

      switch (platform) {
        case "x":
          window.open(
            `https://twitter.com/intent/tweet?text=${encodeURIComponent(
              shareText
            )}&url=${encodeURIComponent(shareUrl)}`,
            "_blank"
          );
          break;
        case "facebook":
          window.open(
            `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
              shareUrl
            )}`,
            "_blank"
          );
          break;
        case "whatsapp":
          window.open(
            `https://api.whatsapp.com/send?text=${encodeURIComponent(
              shareText + " " + shareUrl
            )}`,
            "_blank"
          );
          break;
        case "instagram":
          navigator.clipboard.writeText(shareUrl);
          showFlash("Link copied! Paste it on Instagram.", "success");
          break;
        case "copy":
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
      <div
        key={post.id}
        id={`post-${post.id}`}
        className="bg-engine-panel backdrop-blur-engine p-6 rounded-2xl border border-engine-panel-border/20 shadow-panel-neon relative overflow-hidden group/post focus-within:overflow-visible focus-within:z-[40] transition-all"
      >
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            {post.avatar_url ? (
              <img
                src={`${API_BASE_URL}${post.avatar_url}`}
                alt={post.username}
                className="w-10 h-10 rounded-full object-cover border border-engine-panel-border/50 shadow-panel-neon"
              />
            ) : (
              <div className="w-10 h-10 bg-engine-bg border border-engine-panel-border/50 shadow-panel-neon rounded-full flex items-center justify-center text-engine-neon font-bold text-sm">
                {post.username.substring(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-sm font-bold text-white flex items-center gap-1">
                {post.username}
                <VerifiedBadge user={post} />
                {community && (
                  <span className="text-gray-400 font-normal text-xs ml-1">
                    posted in community{" "}
                    <span
                      className="text-blue-400 cursor-pointer hover:underline"
                      onClick={() => navigate(`/community/${community.id}`)}
                    >
                      {community.name}
                    </span>
                  </span>
                )}
              </p>
              <p className="text-[10px] text-gray-500">
                {(() => {
                  try {
                    return formatDistanceToNow(new Date(post.created_at), {
                      addSuffix: true,
                    });
                  } catch (e) {
                    return "";
                  }
                })()}
                {post.is_edited && (
                  <span className="ml-1 italic opacity-75">(edited)</span>
                )}
              </p>
            </div>
          </div>
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
            {activeMenu?.type === "post" && activeMenu?.id === post.id && (
              <div
                ref={menuRef}
                className="absolute right-0 mt-1 w-32 bg-engine-panel backdrop-blur-engine border border-engine-panel-border/20 rounded-xl shadow-panel-neon z-20 overflow-hidden"
              >
                {currentUser === post.username || userData?.role === "admin" ? (
                  <>
                    {currentUser === post.username && (
                      <button
                        onClick={() => startEditPost(post)}
                        className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:text-engine-neon hover:bg-engine-button/10 transition-colors"
                      >
                        Edit
                      </button>
                    )}
                    <button
                      onClick={handleLocalDeletePost}
                      className="w-full text-left px-4 py-2 text-sm text-red-400 hover:text-white hover:bg-red-500/20 transition-colors"
                    >
                      Delete
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleReportClick}
                    className="w-full text-left px-4 py-2 text-sm text-yellow-400 hover:text-yellow-300 hover:bg-yellow-400/10 transition-colors"
                  >
                    Report
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
        {editingItem?.type === "post" && editingItem?.id === post.id ? (
          <div className="space-y-3">
            <MentionInput
              value={editingItem.content}
              onChange={(e) =>
                setEditingItem({ ...editingItem, content: e.target.value })
              }
              className="w-full bg-engine-bg border border-engine-panel-border/30 rounded-xl p-3 text-white text-sm focus:border-engine-panel-border focus:shadow-panel-neon outline-none"
              rows={3}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditingItem(null)}
                className="text-xs text-gray-400 hover:text-engine-neon px-3 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLocalUpdatePost}
                className="text-xs bg-engine-button text-engine-bg font-bold px-4 py-2 rounded-lg shadow-button-neon hover:bg-[#00b3e6] transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
            {post.content.split(/(@\w+)/g).map((part, i) =>
              part.startsWith("@") ? (
                <strong key={i} className="text-blue-500 font-normal">
                  {part}
                </strong>
              ) : (
                part
              )
            )}
          </p>
        )}
        {post.image_url && (
          <div className="mt-4 rounded-xl overflow-hidden border border-engine-panel-border/20 shadow-panel-neon">
            <AuthenticatedImage
              src={post.image_url}
              alt="Post attachment"
              className="w-full h-auto max-h-[400px] object-cover cursor-pointer transition-transform duration-500 hover:scale-[1.02]"
              onClick={() => setPreviewImage(post.image_url)} // Preview will also use the blob
            />
          </div>
        )}
        
        {post.strategy_data && (
          <StrategyCard strategyData={JSON.parse(post.strategy_data)} />
        )}

        {/* Actions */}
        <div className="flex items-center gap-6 mt-5 pt-4 border-t border-engine-panel-border/10">
          <div className="relative group">
            <button
              onMouseDown={() => handlePressStart(post.id)} // This just opens the modal
              onMouseUp={handleLocalPressEnd}
              onTouchStart={() => handlePressStart(post.id)}
              onTouchEnd={handleLocalPressEnd}
              className={`reaction-trigger flex items-center gap-2 transition-colors ${
                post.user_reaction
                  ? "text-engine-neon"
                  : "text-gray-400 hover:text-engine-neon"
              }`}
            >
              {post.user_reaction ? (
                <span className="text-xl drop-shadow-panel-neon">
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
            {reactionModalPostId === post.id && (
              <div className="absolute bottom-full left-0 mb-2 flex border border-engine-panel-border/30 bg-engine-panel backdrop-blur-engine rounded-full p-1 shadow-panel-neon gap-1 z-10 animate-fade-in w-max reaction-modal">
                {reactions.map((r) => (
                  <button
                    key={r.type}
                    onClick={() => handleLocalReaction(r.type)}
                    className="p-2 rounded-full transition-transform hover:scale-125 text-xl"
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
            onClick={() => setShowShareModal(true)}
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
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-engine-panel-border/30 animate-fade-in">
            {(() => {
              const buildCommentTree = (comments) => {
                const commentMap = {};
                const topLevelComments = [];
                if (!comments) return [];
                comments.forEach((c) => {
                  commentMap[c.id] = { ...c, children: [] };
                });
                comments.forEach((c) => {
                  if (c.parent_id && commentMap[c.parent_id])
                    commentMap[c.parent_id].children.push(commentMap[c.id]);
                  else topLevelComments.push(commentMap[c.id]);
                });
                return topLevelComments;
              };
              const commentTree = buildCommentTree(comments || []);
              const visibleComments = commentTree.slice(0, visibleLimit); // Use local state

              const renderComment = (comment) => {
                const hasReplies =
                  comment.children && comment.children.length > 0;
                const isRepliesExpanded = expandedReplies[comment.id];
                return (
                  <div
                    key={comment.id}
                    className="mt-3"
                    style={{
                      borderLeft: comment.parent_id
                        ? "2px solid rgba(0, 207, 255, 0.2)"
                        : "none",
                      paddingLeft: comment.parent_id ? "1rem" : "0",
                    }}
                  >
                    <div className="bg-engine-bg/60 p-4 rounded-xl text-sm group relative border border-engine-panel-border/10">
                      {editingItem?.type === "comment" &&
                      editingItem?.id === comment.id ? (
                        <div className="space-y-2">
                          <MentionInput
                            value={editingItem.content}
                            onChange={(e) =>
                              setEditingItem({
                                ...editingItem,
                                content: e.target.value,
                              })
                            }
                            className="w-full bg-engine-bg border border-engine-panel-border/30 rounded-lg px-3 py-2 text-white text-sm focus:border-engine-panel-border outline-none"
                            rows={1}
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setEditingItem(null)}
                              className="text-xs text-gray-400 hover:text-engine-neon px-2 py-1 transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleUpdateComment}
                              className="text-xs bg-engine-button text-engine-bg font-bold px-3 py-1 rounded-lg hover:bg-[#00b3e6] transition-colors"
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
                            <VerifiedBadge user={comment} />
                          </div>
                          <p className="text-gray-300">
                            {comment.content.split(/(@\w+)/g).map((part, i) =>
                              part.startsWith("@") ? (
                                <strong
                                  key={i}
                                  className="text-blue-500 font-normal"
                                >
                                  {part}
                                </strong>
                              ) : (
                                part
                              )
                            )}
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
                        <span className="text-[10px] text-gray-500">
                          {(() => {
                            try {
                              return formatDistanceToNow(
                                new Date(comment.created_at),
                                { addSuffix: true }
                              );
                            } catch (e) {
                              return "";
                            }
                          })()}
                        </span>
                        {(currentUser === comment.username ||
                          userData?.role === "admin") && (
                          <div className="relative">
                            <button
                              onClick={() => toggleMenu("comment", comment.id)}
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
                                  className="absolute left-0 mt-1 w-24 border bg-engine-panel backdrop-blur-engine border-engine-panel-border/20 rounded-lg shadow-panel-neon z-20 overflow-hidden"
                                >
                                  <button
                                    onClick={() => startEditComment(comment)}
                                    className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:text-engine-neon hover:bg-engine-button/10 transition-colors"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleDeleteComment(comment.id, post.id)
                                    }
                                    className="w-full text-left px-3 py-2 text-xs text-red-400 hover:text-white hover:bg-red-500/20 transition-colors"
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
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          submitComment(
                            comment.post_id,
                            replyContent,
                            comment.id
                          );
                        }}
                        className="mt-3 ml-8 flex gap-2"
                      >
                        <MentionInput
                          name="replyInput"
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          placeholder={`Replying to ${comment.username}...`}
                          className="flex-1 bg-engine-bg border border-engine-panel-border/30 rounded-lg px-3 py-1.5 text-white text-xs focus:border-engine-panel-border focus:shadow-panel-neon outline-none transition-all"
                          autoFocus
                          rows={1}
                        />
                        <button
                          type="submit"
                          className="text-xs bg-engine-button text-engine-bg px-4 font-bold rounded-lg hover:bg-[#00b3e6] shadow-button-neon transition-colors"
                        >
                          Reply
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setReplyingTo(null);
                            setReplyContent("");
                          }}
                          className="text-xs text-gray-400 hover:text-engine-neon px-2 transition-colors"
                        >
                          Cancel
                        </button>
                      </form>
                    )}
                    {/* Show More Replies CTA */}
                    {hasReplies && !isRepliesExpanded && (
                      <button
                        onClick={() =>
                          setExpandedReplies((prev) => ({
                            ...prev,
                            [comment.id]: true,
                          }))
                        }
                        className="text-[11px] text-gray-400 hover:text-blue-400 font-bold mt-2 flex items-center gap-1 ml-2"
                      >
                        <span className="transform rotate-90">↳</span> View{" "}
                        {comment.children.length}{" "}
                        {comment.children.length === 1 ? "reply" : "replies"}
                      </button>
                    )}

                    {/* Render Replies */}
                    {hasReplies && isRepliesExpanded && (
                      <div className="mt-3">
                        {comment.children.map(renderComment)}
                      </div>
                    )}
                  </div>
                );
              };
              return (
                <>
                  {visibleComments.length > 0 ? (
                    visibleComments.map(renderComment)
                  ) : (
                    <p className="text-xs text-gray-500 italic">
                      No comments yet.
                    </p>
                  )}
                  {commentTree.length > visibleLimit && (
                    <button
                      onClick={() => setVisibleLimit((prev) => prev + 10)}
                      className="text-xs text-gray-400 hover:text-white font-bold mt-4 w-full text-left pl-1"
                    >
                      View more comments ({commentTree.length - visibleLimit})
                    </button>
                  )}
                </>
              );
            })()}
            <div className="flex gap-3 mt-4">
              <MentionInput
                placeholder="Write a comment..."
                name={`commentInput-${post.id}`}
                value={commentText || ""}
                onChange={(e) =>
                  setNewCommentText((prev) => ({
                    ...prev,
                    [post.id]: e.target.value,
                  }))
                }
                className="flex-1 bg-engine-bg border border-engine-panel-border/30 rounded-xl px-4 py-2.5 text-sm text-white focus:border-engine-panel-border focus:shadow-panel-neon outline-none transition-all"
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    submitComment(post.id, commentText);
                  }
                }}
                rows={1}
              />
              <button
                onClick={() => submitComment(post.id, commentText)}
                className="bg-engine-button hover:bg-[#00b3e6] text-engine-bg px-5 py-2.5 rounded-xl text-sm font-bold shadow-button-neon transition-all hover:shadow-button-neon"
              >
                Send
              </button>
            </div>
          </div>
        )}
        {/* Report Modal */}
        {showReportModal && createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-engine p-4"
            onClick={() => setShowReportModal(false)}
          >
            <div
              className="bg-engine-panel border border-engine-panel-border/20 p-6 rounded-2xl shadow-panel-neon max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-extrabold text-engine-neon mb-4">Report Post</h3>
              <div className="space-y-3 mb-4">
                {[
                  "Inappropriate Content",
                  "Spam",
                  "Hate Speech",
                  "Harassment",
                  "False Information",
                  "Other",
                ].map((reason) => (
                  <label
                    key={reason}
                    className="flex items-center gap-3 cursor-pointer group"
                  >
                    <input
                      type="radio"
                      name="reportReason"
                      value={reason}
                      checked={reportReason === reason}
                      onChange={(e) => setReportReason(e.target.value)}
                      className="w-4 h-4 text-engine-neon bg-engine-bg border-engine-panel-border/30 focus:ring-[#00cfff]"
                    />
                    <span className="text-gray-300 text-sm group-hover:text-white">
                      {reason}
                    </span>
                  </label>
                ))}
              </div>

              {reportReason === "Other" && (
                <textarea
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Please describe the issue..."
                  className="w-full bg-engine-bg border border-engine-panel-border/30 rounded-xl p-3 text-white text-sm focus:border-engine-panel-border focus:shadow-panel-neon outline-none mb-4 h-24 resize-none transition-all"
                />
              )}

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowReportModal(false)}
                  className="px-5 py-2.5 rounded-xl bg-transparent border border-engine-button-border/30 text-engine-neon hover:bg-engine-button/10 transition-colors text-sm font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={submitReport}
                  className="px-5 py-2.5 rounded-xl bg-red-500/20 text-red-500 border border-red-500/50 hover:bg-red-500 hover:text-white transition-colors text-sm font-bold"
                >
                  Report
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
        {/* Delete Confirmation Modal */}
        {showDeleteModal && createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-engine p-4"
            onClick={() => setShowDeleteModal(false)}
          >
            <div
              className="bg-engine-panel border border-engine-panel-border/20 p-8 rounded-2xl shadow-panel-neon max-w-sm w-full text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-2xl font-extrabold text-white mb-2">
                Delete Post?
              </h3>
              <p className="text-gray-400 text-sm mb-8 font-light">
                Are you sure you want to delete this post? This action cannot be
                undone.
              </p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-6 py-2.5 rounded-xl bg-transparent border border-engine-button-border/30 text-engine-neon hover:bg-engine-button/10 transition-colors text-sm font-bold w-full"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-6 py-2.5 rounded-xl bg-red-500/20 text-red-500 border border-red-500/50 hover:bg-red-500 hover:text-white transition-colors text-sm font-bold w-full"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
        {/* Share Modal */}
        {showShareModal && createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-engine p-4"
            onClick={() => setShowShareModal(false)}
          >
            <div
              className="bg-gray-800 border border-gray-600 p-6 rounded-xl shadow-2xl max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-white mb-4 text-center">
                Share Post
              </h3>
              <div className="flex flex-row flex-wrap justify-center gap-5 mb-6">
                <button
                  onClick={() => handleShareOption("x")}
                  className="flex flex-col items-center gap-2 group hover:-translate-y-1 transition-transform"
                >
                  <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center border border-engine-panel-border/30 group-hover:border-white transition-colors shadow-lg">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="white">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </div>
                  <span className="text-xs font-bold text-gray-400 group-hover:text-gray-200">X</span>
                </button>
                <button
                  onClick={() => handleShareOption("facebook")}
                  className="flex flex-col items-center gap-2 group hover:-translate-y-1 transition-transform"
                >
                  <div className="w-12 h-12 bg-[#1877F2] rounded-full flex items-center justify-center border border-[#1877F2]/30 group-hover:shadow-[0_0_15px_rgba(24,119,242,0.4)] transition-all shadow-lg">
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="white">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </div>
                  <span className="text-xs font-bold text-gray-400 group-hover:text-gray-200">Facebook</span>
                </button>
                <button
                  onClick={() => handleShareOption("whatsapp")}
                  className="flex flex-col items-center gap-2 group hover:-translate-y-1 transition-transform"
                >
                  <div className="w-12 h-12 bg-[#25D366] rounded-full flex items-center justify-center border border-[#25D366]/30 group-hover:shadow-[0_0_15px_rgba(37,211,102,0.4)] transition-all shadow-lg">
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="white">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                  </div>
                  <span className="text-xs font-bold text-gray-400 group-hover:text-gray-200">WhatsApp</span>
                </button>
                <button
                  onClick={() => handleShareOption("instagram")}
                  className="flex flex-col items-center gap-2 group hover:-translate-y-1 transition-transform"
                >
                  <div className="w-12 h-12 bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888] rounded-full flex items-center justify-center border border-pink-500/30 group-hover:shadow-[0_0_15px_rgba(236,72,153,0.4)] transition-all shadow-lg">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                    </svg>
                  </div>
                  <span className="text-xs font-bold text-gray-400 group-hover:text-gray-200">Instagram</span>
                </button>
                <button
                  onClick={() => handleShareOption("copy")}
                  className="flex flex-col items-center gap-2 group hover:-translate-y-1 transition-transform"
                >
                  <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center border border-gray-600 group-hover:bg-gray-600 transition-colors shadow-lg">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                    </svg>
                  </div>
                  <span className="text-xs font-bold text-gray-400 group-hover:text-gray-200">Copy Link</span>
                </button>
              </div>
              <button
                onClick={() => setShowShareModal(false)}
                className="w-full py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-bold text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>,
          document.body
        )}
      </div>
    );
  }
);

// Memoized Post Feed to prevent re-renders when typing in Create Post form
const PostFeed = React.memo(
  ({ posts, communitiesMap, onPostUpdate, onPostDelete, showFlash }) => {
    return (
      <div className="space-y-4">
        {posts.map((post) => {
          const community = post.community_id
            ? communitiesMap[post.community_id]
            : null;
          return (
            <PostItem
              key={post.id}
              post={post}
              community={community}
              onPostUpdate={onPostUpdate}
              onPostDelete={onPostDelete}
              showFlash={showFlash}
            />
          );
        })}
      </div>
    );
  }
);

const Home = ({
  communities,
  highlightedPost,
  setHighlightedPost,
  showFlash,
}) => {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [postsPage, setPostsPage] = useState(0);
  const [posts, setPosts] = useState([]);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [marketPrices, setMarketPrices] = useState([]);
  const [loadingPrices, setLoadingPrices] = useState(true);
  const [news, setNews] = useState([]);
  const currentUser = userData?.username;
  const [joinedCommunityIds, setJoinedCommunityIds] = useState([]);
  const [mobileView, setMobileView] = useState("feed"); // 'feed' | 'widgets'

  // Post State
  const [newPostContent, setNewPostContent] = useState("");
  const [postImage, setPostImage] = useState({ file: null, preview: "" });
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchGlobalPosts(0, true); //initial load
    fetchMarketPrices();
    fetchNews();

    // Poll prices every 10 seconds to keep widget updated and retry if unavailable
    const interval = setInterval(fetchMarketPrices, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchJoinedCommunities = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setJoinedCommunityIds([]);
        return;
      }
      try {
        const res = await api.get("/users/me/joined_communities");
        setJoinedCommunityIds(res.data);
      } catch (error) {
        console.error("Failed to fetch joined communities", error);
      }
    };

    if (userData) {
      fetchJoinedCommunities();
    } else {
      setJoinedCommunityIds([]);
    }
  }, [userData]);

  // Scroll to highlighted post
  useEffect(() => {
    if (highlightedPost && posts.length > 0) {
      const element = document.getElementById(`post-${highlightedPost.postId}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        element.classList.add(
          "ring-2",
          "ring-blue-500",
          "transition-all",
          "duration-500"
        );
        setTimeout(() => {
          element.classList.remove("ring-2", "ring-blue-500");
          setHighlightedPost(null);
        }, 2000);
      }
    }
  }, [highlightedPost, posts, setHighlightedPost]);

  // Track mounted state to prevent state updates on unmounted component
  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Refs for interval access to avoid stale closures without re-renders
  const marketPricesRef = useRef(marketPrices);
  const isFetchingPrices = useRef(false);

  useEffect(() => {
    marketPricesRef.current = marketPrices;
  }, [marketPrices]);

  const fetchGlobalPosts = async (page = 0, initialLoad = false) => {
    if (loadingPosts && !initialLoad) return;
    setLoadingPosts(true);
    try {
      const res = await api.get(`/posts?skip=${page * 10}&limit=10`);
      if (isMounted.current && res.data.length > 0) {
        setPosts((prev) =>
          page === 0 || initialLoad ? res.data : [...prev, ...res.data]
        );
        setPostsPage(page + 1);
      }
      if (isMounted.current && res.data.length < 10) {
        setHasMorePosts(false);
      } else {
        if (isMounted.current) setHasMorePosts(true);
      }
    } catch (error) {
      console.error("Failed to fetch posts", error);
      // Stop polling if initial fetch fails.
      if (page === 0 && isMounted.current) {
        setHasMorePosts(false);
      }
    } finally {
      if (isMounted.current) setLoadingPosts(false);
    }
  };

  const fetchMarketPrices = async () => {
    if (isFetchingPrices.current) return;
    isFetchingPrices.current = true;
    // Only show loading indicator on initial fetch if no data exists
    if (isMounted.current && marketPricesRef.current.length === 0)
      setLoadingPrices(true);
    const symbols = ["BTC-USD", "ETH-USD", "SOL-USD", "BNB-USD", "XRP-USD"];
    const requests = symbols.map((sym) =>
      api.get(`/price/${sym}`, { timeout: 5000 }).catch(() => {
        return null;
      })
    );
    const responses = await Promise.all(requests);

    const prices = responses
      .filter((res) => res && res.data && res.data.status === "success")
      .map((res) => res.data);

    if (isMounted.current) {
      if (prices.length > 0) {
        setMarketPrices(prices);
      }
      setLoadingPrices(false);
      // } else {
      //   // Stop polling in this component, if component unmounted do not retry anymore
      //     if (isMounted.current) {
      //       clearInterval(interval);
      //     }
    }
    isFetchingPrices.current = false;
  };

  const fetchNews = async () => {
    try {
      const res = await api.get("/news");
      if (isMounted.current && res.data.Data) {
        setNews(res.data.Data.slice(0, 5));
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
    if (!token) return showFlash("Please login to post.", "error");

    const formData = new FormData();
    formData.append("content", newPostContent);
    if (postImage.file) {
      formData.append("image", postImage.file); // Changed to 'image' to match backend
    }

    try {
      const res = await api.post("/posts", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setNewPostContent("");
      setPostImage({ file: null, preview: "" });
      // Instead of refetching all, we can prepend the new post
      setPosts((prev) => [res.data, ...prev]);
      // fetchGlobalPosts(0, true); // This also works but is less efficient
    } catch (error) {
      showFlash(error.response?.data?.detail || "Failed to post.", "error");
    }
  };

  const onPostUpdate = useCallback((postId, updatedFields) => {
    setPosts((prevPosts) =>
      prevPosts.map((p) => (p.id === postId ? { ...p, ...updatedFields } : p))
    );
  }, []);

  const onPostDelete = useCallback((postId) => {
    setPosts((prevPosts) => prevPosts.filter((p) => p.id !== postId));
  }, []);

  const myCommunities = communities.filter((c) =>
    joinedCommunityIds.includes(c.id)
  );

  const createdCommunities = communities.filter(
    (c) => c.creator_username === currentUser
  );

  const communitiesMap = useMemo(() => {
    if (!communities) return {};
    return communities.reduce((acc, comm) => {
      acc[comm.id] = comm;
      return acc;
    }, {});
  }, [communities]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 max-w-7xl mx-auto pb-10">
      {/* 📱 Mobile View Switcher */}
      <div className="lg:hidden col-span-1 flex bg-engine-panel backdrop-blur-engine p-1.5 rounded-xl border border-engine-panel-border/20 sticky top-24 z-30 shadow-panel-neon">
        <button
          onClick={() => setMobileView("feed")}
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
            mobileView === "feed"
              ? "bg-engine-button text-engine-bg shadow-button-neon"
              : "text-gray-400 hover:text-engine-neon/80"
          }`}
        >
          Feed
        </button>
        <button
          onClick={() => setMobileView("widgets")}
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
            mobileView === "widgets"
              ? "bg-engine-button text-engine-bg shadow-button-neon"
              : "text-gray-400 hover:text-engine-neon/80"
          }`}
        >
          Market & Groups
        </button>
      </div>
      {/* LEFT SIDEBAR (Widgets) */}
      <div
        className={`${
          mobileView === "widgets" ? "block" : "hidden"
        } lg:block lg:col-span-1 space-y-6`}
      >
        <div className="space-y-6 sticky top-24">
          {/* Market Price Widget */}
          <div className="bg-engine-panel backdrop-blur-engine rounded-2xl border border-engine-panel-border/20 p-5 shadow-panel-neon overflow-hidden relative h-32">
            <h3 className="text-xs font-extrabold text-engine-neon uppercase mb-2 tracking-wider">
              Market Watch
            </h3>
            <MarketWidget
              marketPrices={marketPrices}
              loadingPrices={loadingPrices}
            />
          </div>

          {/* News Widget */}
          <div className="bg-engine-panel backdrop-blur-engine rounded-2xl border border-engine-panel-border/20 p-5 shadow-panel-neon h-64 relative overflow-hidden">
            <h3 className="text-xs font-extrabold text-engine-neon uppercase mb-2 tracking-wider">
              Crypto News
            </h3>
            <NewsWidget news={news} />
          </div>
        </div>
      </div>

      {/* CENTER (Main Feed) */}
      <div
        className={`${
          mobileView === "feed" ? "block" : "hidden"
        } lg:block lg:col-span-2 space-y-6`}
      >
        {/* Create Post Box */}
        <div className="bg-engine-panel backdrop-blur-engine p-6 rounded-2xl border border-engine-panel-border/20 shadow-panel-neon relative">
          <form onSubmit={handlePostSubmit}>
            <MentionInput
              value={newPostContent}
              name="mainPostContent"
              onChange={(e) => setNewPostContent(e.target.value)}
              onPaste={handlePaste}
              placeholder={`What's happening, ${currentUser || "Guest"}?`}
              className="w-full bg-engine-bg border border-engine-panel-border/30 rounded-xl p-4 text-white focus:outline-none focus:border-engine-panel-border focus:shadow-panel-neon transition-all min-h-[100px] resize-none"
            />
            {postImage.preview && (
              <div className="mt-4 relative w-fit">
                <img
                  src={postImage.preview}
                  alt="Preview"
                  className="max-h-40 rounded-xl border border-engine-panel-border/30 shadow-panel-neon"
                />
                <button
                  type="button"
                  onClick={() => setPostImage({ file: null, preview: "" })}
                  className="absolute -top-3 -right-3 bg-red-500 hover:bg-red-400 transition-colors text-white rounded-full p-1.5 leading-none text-xs shadow-lg"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            <div className="flex justify-between items-center mt-4">
              <button
                type="button"
                onClick={() => fileInputRef.current.click()}
                className="text-engine-neon/80 hover:text-engine-neon text-sm font-bold flex items-center gap-2 transition-colors px-2 py-1 rounded hover:bg-engine-button/10"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
                Media
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
                className="bg-engine-button hover:bg-[#00b3e6] text-engine-bg px-8 py-2.5 rounded-xl font-extrabold text-sm shadow-button-neon transition-all hover:shadow-button-neon"
              >
                Post
              </button>
            </div>
          </form>
        </div>

        {/* Feed */}
        <PostFeed
          posts={posts}
          communitiesMap={communitiesMap}
          onPostUpdate={onPostUpdate}
          onPostDelete={onPostDelete}
          showFlash={showFlash}
        />
        {hasMorePosts && (
          <div className="text-center mt-6">
            <button
              onClick={() => fetchGlobalPosts(postsPage)}
              disabled={loadingPosts}
              className="bg-transparent border border-engine-button-border/30 text-engine-neon hover:bg-engine-button/10 hover:border-engine-button-border px-8 py-3 rounded-xl font-bold text-sm disabled:opacity-50 transition-all shadow-button-neon"
            >
              {loadingPosts ? "Loading..." : "Load More"}
            </button>
          </div>
        )}
      </div>

      {/* RIGHT SIDEBAR (Communities) */}
      {userData && (
        <div
          className={`${
            mobileView === "widgets" ? "block" : "hidden"
          } lg:block lg:col-span-1`}
        >
          <div className="sticky top-24 space-y-6">
            {/* Created Communities */}
            {createdCommunities.length > 0 && (
              <div className="bg-engine-panel backdrop-blur-engine rounded-2xl border border-engine-panel-border/20 p-5 shadow-panel-neon">
                <h3 className="text-sm font-extrabold text-engine-neon mb-4 flex items-center gap-2 tracking-wider">
                  <Crown className="w-4 h-4 text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]" /> Created Communities
                </h3>
                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                  {createdCommunities.map((comm) => (
                    <div
                      key={comm.id}
                      onClick={() => navigate(`/community/${comm.id}`)}
                      className="flex items-center justify-between p-3 border border-transparent hover:border-engine-button-border/20 hover:bg-engine-button/5 rounded-xl cursor-pointer group transition-all"
                    >
                      <div>
                        <p className="text-sm font-bold text-gray-300 group-hover:text-white transition-colors">
                          {comm.name}
                        </p>
                        <p className="text-[10px] text-gray-500">
                          {comm.members_count} Members
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-engine-neon transition-colors" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Joined Communities */}
            <div className="bg-engine-panel backdrop-blur-engine rounded-2xl border border-engine-panel-border/20 p-5 shadow-panel-neon">
              <h3 className="text-sm font-extrabold text-engine-neon mb-4 flex items-center gap-2 tracking-wider">
                <Users className="w-4 h-4 text-engine-neon drop-shadow-panel-neon" /> Your Communities
              </h3>
              <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                {myCommunities.length === 0 ? (
                  <p className="text-xs text-gray-500 italic p-2">
                    You haven't joined any communities yet.
                  </p>
                ) : (
                  myCommunities.map((comm) => (
                    <div
                      key={comm.id}
                      onClick={() => navigate(`/community/${comm.id}`)}
                      className="flex items-center justify-between p-3 border border-transparent hover:border-engine-button-border/20 hover:bg-engine-button/5 rounded-xl cursor-pointer group transition-all"
                    >
                      <div>
                        <p className="text-sm font-bold text-gray-300 group-hover:text-white transition-colors">
                          {comm.name}
                        </p>
                        <p className="text-[10px] text-gray-500">
                          {comm.members_count} Members
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-engine-neon transition-colors" />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
