import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import api from "../lib/axios";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import VerifiedBadge from "./VerifiedBadge";
import { usePostInteractions } from "../contexts/PostInteractionContext";

// Base URL for resource statis (img/avatar)
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

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

const PostItem = React.memo(({ post, community, onPostUpdate, onPostDelete, showFlash }) => {
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

  const [showReportModal, setShowReportModal] = useState(false);
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
  const handleLocalUpdatePost = async () => {
    const result = await handleUpdatePost(editingItem);
    if (result.success) onPostUpdate(result.updatedPost.id, result.updatedPost);
  };

  const handleLocalDeletePost = async () => {
    const result = await handleDeletePost(post.id);
    if (result.success) onPostDelete(post.id);
  };
  return (
    <div
      key={post.id}
      id={`post-${post.id}`}
      className="bg-gray-800 p-5 rounded-lg border border-gray-700"
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          {post.user_avatar_url ? (
            <img
              src={`${API_BASE_URL}${post.user_avatar_url}`}
              alt={post.username}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
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
              className="absolute right-0 mt-1 w-32 border border-gray-700 rounded-lg shadow-xl z-20 overflow-hidden"
            >
              {currentUser === post.username || userData?.role === "admin" ? (
                <>
                  {currentUser === post.username && (
                    <button
                      onClick={() => startEditPost(post)}
                      className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:text-white"
                    >
                      Edit
                    </button>
                  )}
                  <button
                    onClick={handleLocalDeletePost}
                    className="w-full text-left px-4 py-2 text-sm text-red-400 hover:text-red-300"
                  >
                    Delete
                  </button>
                </>
              ) : (
                <button
                onClick={handleReportClick}
                className="w-full text-left px-4 py-2 text-sm text-yellow-400 hover:text-yellow-300"
                >
                  Report
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      {editingItem?.type === "post" && editingItem?.id === post.id ? (
        <div className="space-y-2">
          <textarea
            value={editingItem.content}
            onChange={(e) =>
              setEditingItem({ ...editingItem, content: e.target.value })
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
              onClick={handleLocalUpdatePost}
              className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-500"
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
        <div className="mt-3 rounded-lg overflow-hidden border border-gray-700">
          <img
            src={`${API_BASE_URL}${post.image_url}`}
            alt="Post attachment"
            className="w-full h-auto max-h-[400px] object-cover cursor-pointer hover:opacity-90"
            onClick={() => setPreviewImage(`${API_BASE_URL}${post.image_url}`)}
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-6 mt-4 pt-4 border-t border-gray-700/50">
        <div className="relative group">
          <button
            onMouseDown={() => handlePressStart(post.id)} // This just opens the modal
            onMouseUp={handleLocalPressEnd}
            onTouchStart={() => handlePressStart(post.id)}
            onTouchEnd={handleLocalPressEnd}
            className={`reaction-trigger flex items-center gap-2 transition-colors ${
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
          {reactionModalPostId === post.id && (
            <div className="absolute bottom-full left-0 mb-2 flex border border-gray-600 rounded-full p-1 shadow-xl gap-1 z-10 animate-fade-in w-max reaction-modal">
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
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-700/50 animate-fade-in">
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
                                className="absolute left-0 mt-1 w-24 border border-gray-600 rounded shadow-xl z-20"
                              >
                                <button
                                  onClick={() => startEditComment(comment)}
                                  className="w-full text-left px-3 py-1.5 text-xs text-gray-300"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() =>
                                    handleDeleteComment(comment.id, post.id)
                                  }
                                  className="w-full text-left px-3 py-1.5 text-xs text-red-400"
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
                      className="mt-2 ml-8 flex gap-2"
                    >
                      <input
                        type="text"
                        name="replyInput"
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder={`Replying to ${comment.username}...`}
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
          <div className="flex gap-2 mt-3">
            <input
              type="text"
              placeholder="Write a comment..."
              name={`commentInput-${post.id}`}
              value={commentText || ""}
              onChange={(e) =>
                setNewCommentText((prev) => ({
                  ...prev,
                  [post.id]: e.target.value,
                }))
              }
              className="flex-1 bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
              onKeyPress={(e) =>
                e.key === "Enter" && submitComment(post.id, commentText)
              }
            />
            <button
              onClick={() => submitComment(post.id, commentText)}
              className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded text-sm font-bold"
            >
              Send
            </button>
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
                    name="reportReason" 
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
    </div>
  );
});

// Memoized Post Feed to prevent re-renders when typing in Create Post form
const PostFeed = React.memo(({ posts, communitiesMap, onPostUpdate, onPostDelete, showFlash }) => {
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
});

const Home = ({ communities, highlightedPost, setHighlightedPost, showFlash }) => {
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
    const symbols = [
      "BTC-USD",
      "ETH-USD",
      "SOL-USD",
      "BNB-USD",
      "XRP-USD",
      "PEPE24478-USD",
    ];
    const requests = symbols.map((sym) =>
      api.get(`/price/${sym}`, { timeout: 5000 }).catch((err) => {
        if (isMounted.current) {
          console.warn(`Failed to fetch price for ${sym}`, err);
        }
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
      formData.append("image_file", postImage.file);
    }

    try {
      await api.post("/posts", formData, {
        headers: {
          "Content-Type": undefined,
        },
      });
      setNewPostContent("");
      setPostImage({ file: null, preview: "" });
      fetchGlobalPosts();
    } catch (error) {
      showFlash("Failed to post.", "error");
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

  const createdCommunities = communities.filter((c) =>
    c.creator_username === currentUser
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
      <div className="lg:hidden col-span-1 flex bg-gray-800 p-1 rounded-lg border border-gray-700 sticky top-24 z-30 shadow-lg">
        <button
          onClick={() => setMobileView("feed")}
          className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${
            mobileView === "feed"
              ? "bg-blue-600 text-white shadow"
              : "text-gray-400"
          }`}
        >
          Feed
        </button>
        <button
          onClick={() => setMobileView("widgets")}
          className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${
            mobileView === "widgets"
              ? "bg-blue-600 text-white shadow"
              : "text-gray-400"
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
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 shadow-lg overflow-hidden relative h-32">
            <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">
              Market Watch
            </h3>
            <MarketWidget
              marketPrices={marketPrices}
              loadingPrices={loadingPrices}
            />
          </div>

          {/* News Widget */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 shadow-lg h-64 relative overflow-hidden">
            <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">
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
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <form onSubmit={handlePostSubmit}>
            <textarea
              value={newPostContent}
              name="mainPostContent"
              onChange={(e) => setNewPostContent(e.target.value)}
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
        <PostFeed
          posts={posts}
          communitiesMap={communitiesMap}
          onPostUpdate={onPostUpdate}
          onPostDelete={onPostDelete}
          showFlash={showFlash}
        />
        {hasMorePosts && (
          <div className="text-center mt-4">
            <button
              onClick={() => fetchGlobalPosts(postsPage)}
              disabled={loadingPosts}
              className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-bold text-sm disabled:opacity-50"
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
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 shadow-lg">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <span className="text-yellow-500">👑</span> Created Communities
                </h3>
                <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                  {createdCommunities.map((comm) => (
                    <div
                      key={comm.id}
                      onClick={() => navigate(`/community/${comm.id}`)}
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
                      <span className="text-gray-500 group-hover:text-blue-400">→</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Joined Communities */}
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 shadow-lg">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-blue-500">👥</span> Your Communities
              </h3>
              <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                {myCommunities.length === 0 ? (
                  <p className="text-xs text-gray-500">
                    You haven't joined any communities yet.
                  </p>
                ) : (
                  myCommunities.map((comm) => (
                    <div
                      key={comm.id}
                      onClick={() => navigate(`/community/${comm.id}`)}
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
                      <span className="text-gray-500 group-hover:text-blue-400">→</span>
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
