import { useEffect, useLayoutEffect, useState, useRef, useMemo, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Search,
  Send,
  MoreVertical,
  Phone,
  Video,
  Smile,
  Paperclip,
  Check,
  CheckCheck,
  UserX,
  Shield,
  Trash2,
  ChevronLeft,
  MessageCircle,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UserDropdownMenuTrigger } from "@/components/common/UserDropdown";
import { useInboxStore } from "@/store/useInboxStore";
import { getConversationMessages, getInbox, getReadMessages } from "@/lib/api/messages.api";
import { Message, useMessageStore } from "@/store/useMessageStore";
import { sendMessageApi } from "@/lib/api/messages.api";
import { socket } from "@/lib/socket";
import { useAuthStore } from "@/store/authStore";
import { useProfileStore } from "@/store/useProfileStore";
import { useSearchParams, useLocation } from "react-router-dom";
import { blockUser } from "@/lib/api/user.api";
import { toast } from "@/hooks/use-toast";
import { containsProfanity } from "@/lib/profanity";
import { encryptMessage, decryptMessage } from "@/lib/encryption";
import { MessagesSkeleton } from "@/components/skeletons/MessagesSkeleton";
import { ChatSkeleton } from "@/components/skeletons/ChatSkeleton";
import { Textarea } from "@/components/ui/textarea";

export default function Messages() {
  const [isLoading, setIsLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const targetConvoId = searchParams.get("id");

  const {
    conversations,
    selectedConvo,
    setConversations,
    setSelectedConvo,
    updateConversation,
    refreshId,
  } = useInboxStore();
  const { messages, addMessage, updateMessageStatus, updateMessageId, setMessages, prependMessages } = useMessageStore();
  const userId = useAuthStore((s) => s.userId);
  const { profile } = useProfileStore();
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isMessagesLoading, setIsMessagesLoading] = useState(true);
  const topObserverRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const shouldJumpRef = useRef(true);
   const textareaRef = useRef<HTMLTextAreaElement>(null)
  const lastMessageIdRef = useRef<string | null>(null);
  const isFirstLoadRef = useRef(true);

  const sortedConversations = useMemo(() => {
    return [...(conversations || [])].sort((a, b) => {
      return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
    });
  }, [conversations]);

  const scrollToBottom = (behavior: "auto" | "smooth" = "smooth") => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      // If distance is huge, force "auto" to avoid slow smooth scroll lag/stuck
      const distance = container.scrollHeight - (container.scrollTop + container.clientHeight);
      const forcedBehavior = distance > 1000 ? "auto" : behavior;

      if (forcedBehavior === "auto") {
        container.scrollTop = container.scrollHeight;
      } else {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: "smooth"
        });
      }
    }
  };

  useEffect(() => {
    loadInbox();
  }, [userId, targetConvoId, refreshId]);


  // Use useLayoutEffect so scroll happens BEFORE the browser paints — no visible flash at top
  useLayoutEffect(() => {
    if (isMessagesLoading || messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];
    const isNewMessage = lastMessage.id !== lastMessageIdRef.current;
    const isFromMe = lastMessage.sender === "me";

    // Initial load: jump instantly before paint so user never sees top
    if (shouldJumpRef.current) {
      scrollToBottom("auto");
      shouldJumpRef.current = false;
      lastMessageIdRef.current = lastMessage.id;
      return;
    }

    // Live update logic
    if (isNewMessage) {
      const container = scrollContainerRef.current;
      const isNearBottom = container ? (container.scrollHeight - (container.scrollTop + container.clientHeight) < 150) : false;

      // Always scroll for OWN messages, or if already near bottom for incoming ones
      if (isFromMe || isNearBottom) {
        const timer = setTimeout(() => {
          scrollToBottom("smooth");
        }, 50);
        return () => clearTimeout(timer);
      }
    }

    lastMessageIdRef.current = lastMessage.id;
  }, [messages, selectedConvo?.id, isMessagesLoading]);


  // Intersection Observer for Infinite Scroll 
  useEffect(() => {
    // If we're loading messages for the first time, wait until they are rendered
    if (isMessagesLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const isAtTop = scrollContainerRef.current && scrollContainerRef.current.scrollTop < 50;
        if (entries[0].isIntersecting && hasMore && !isLoadingMore && selectedConvo && !shouldJumpRef.current && isAtTop) {
          handleLoadMore();
        }
      },
      { threshold: 0.5 } // Higher threshold to avoid accidental triggers
    );

    if (topObserverRef.current) {
      observer.observe(topObserverRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, selectedConvo, messages.length, isMessagesLoading]);

  const myInitials = profile ?
    `${profile.first_name?.[0] || ""}${profile.last_name?.[0] || ""}`.toUpperCase() || "ME"
    : "ME";

  const myAvatar = profile?.profile_image_url;

  const handleLoadMore = async () => {
    if (!selectedConvo || isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    const scrollContainer = scrollContainerRef.current;
    const oldScrollHeight = scrollContainer?.scrollHeight || 0;

    try {
      const apiMessages = await getConversationMessages(
        selectedConvo.id,
        20,
        messages.length
      );

      if (apiMessages.length < 20) {
        setHasMore(false);
      }

      if (apiMessages.length > 0) {
        const normalizedMsgs = await normalizeMessages(apiMessages, userId!);
        prependMessages(normalizedMsgs);

        // Use requestAnimationFrame AND a small timeout to ensure content is painted
        // and scroll is adjusted BEFORE we allow another load trigger
        requestAnimationFrame(() => {
          if (scrollContainer) {
            const newScrollHeight = scrollContainer.scrollHeight;
            scrollContainer.scrollTop = newScrollHeight - oldScrollHeight;

            // Wait for scroll to settle before allowing next load
            setTimeout(() => {
              setIsLoadingMore(false);
            }, 100);
          } else {
            setIsLoadingMore(false);
          }
        });
      } else {
        setIsLoadingMore(false);
      }
    } catch (error) {
      console.error("Failed to load more messages", error);
      setIsLoadingMore(false);
    }
  };


  const normalizeInbox = async (apiData: any[]) => {
    return Promise.all(apiData.map(async (item) => ({
      id: item.conversation_id,
      user: {
        name: item.title ?? "Unknown",
        initials: item.title
          ?.split(" ")
          .map((n: string) => n[0])
          .join("")
          .toUpperCase() ?? "U",
        avatar: item.other_user_profile_image_url,
      },
      lastMessage: await decryptMessage(
        item.last_message_preview ?? ""),
      time: new Date(item.last_message_at).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      lastMessageAt: item.last_message_at,
      unread: item.unread_count ?? 0,
      online: false,
      otherUserId: item.other_user_id,
      isBlocked: item.is_blocked ?? false,
      blockedBy: item.blocked_by,
    })));
  };

  const loadInbox = async () => {
    // Only show full page loader if it's the very first load
    if (conversations.length === 0) setIsLoading(true);

    const data = await getInbox();
    const normalizedInv = await normalizeInbox(data);

    const sortedInv = [...normalizedInv].sort((a, b) =>
      new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    );

    setConversations(sortedInv);

    // Auto-select if ID provided in query param, otherwise select the first one
    let target = null;
    if (targetConvoId) {
      target = sortedInv.find(c => c.id === targetConvoId);

      // If it's a new conversation from Profile, seed it
      if (!target && location.state?.user && targetConvoId) {
        target = {
          id: targetConvoId,
          user: {
            name: location.state.user.name,
            initials: location.state.user.initials,
            avatar: location.state.user.avatar,
          },
          lastMessage: "",
          time: "",
          lastMessageAt: new Date().toISOString(),
          unread: 0,
          online: false,
          otherUserId: location.state.user.id,
          isBlocked: false,
          blockedBy: null,
        };
        // Add to the list locally so it shows in sidebar
        setConversations([target, ...sortedInv]);
      }
    }

    // Only load messages if we are switching to a NEW target
    // I            f target.id === selectedConvo.id, it's just a background refresh of the sidebar
    const isNewSelection = target && target.id !== selectedConvo?.id;
    const shouldRefreshMessages = isNewSelection || isFirstLoadRef.current;

    if (target && shouldRefreshMessages) {
      if (isNewSelection) {
        setMessages([]); // Clear stale messages immediately to prevent flicker
      }

      setSelectedConvo(target);
      setIsMessagesLoading(true);
      shouldJumpRef.current = true; // Ensure we jump to bottom on load
      setHasMore(true); // Reset for new conversation

      try {
        const apiMessages = await getConversationMessages(target.id, 20, 0);
        const normalizedMsgs = await normalizeMessages(apiMessages, userId!);
        setMessages(normalizedMsgs);

        if (apiMessages.length < 20) setHasMore(false);

        // Mark first load as complete AFTER we got the messages
        isFirstLoadRef.current = false;
      } catch (err) {
        console.error("Failed to load messages for target", err);
      } finally {
        setIsMessagesLoading(false);
      }
    } else {
      // If we don't need to refresh messages, still ensure loading is false
      setIsMessagesLoading(false);
      if (!target && !selectedConvo) {
        setSelectedConvo(null as any);
      }
    }

    setIsLoading(false);
  };

  const normalizeMessages = async (apiMessages: any[], myUserId: string): Promise<Message[]> => {
    const currentUserId = myUserId || userId;
    // Reverse because backend returns newest first (DESC), but UI renders top-to-bottom (ASC)
    const reversedMessages = [...apiMessages].reverse();
    return Promise.all(reversedMessages.map(async (msg) => {
      const isMe = String(msg.sender_id) === String(currentUserId);

      return {
        id: msg.id,
        isread: msg.isread,
        conversationId: msg.conversation_id,
        sender: isMe ? "me" : "them",
        content: await decryptMessage(msg.content),
        time: new Date(msg.created_at).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        status: "read" as const,
      };
    }));
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedConvo) return;
    if (containsProfanity(newMessage)) {
      toast({
        title: "Message Blocked",
        description: "Your message contains offensive language. Please keep the conversation respectful.",
        variant: "destructive",
      });
      return;
    }

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;


    try {
      const encrypted = await encryptMessage(newMessage)
      const res = await sendMessageApi({
        conversation_id: selectedConvo.id,
        content: encrypted,
      });
      if (res.success === false) {
        toast({
          title: "Error",
          description: res.message,
          variant: "destructive",
        });
        return;
      }
      addMessage({
        id: tempId,
        isread: false,
        conversationId: selectedConvo.id,
        sender: "me",
        content: newMessage,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        status: "sending",
      });

      setNewMessage("");
      textareaRef.current.style.height = "auto"
      updateMessageId(tempId, res.message_id);
      updateMessageStatus(res.message_id, "sent");
      socket.emit("new_message", {
        conversation_id: selectedConvo.id,
        content: encrypted,
        message_id: res.message_id,
      });

      updateConversation(selectedConvo.id, {
        lastMessage: newMessage,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        lastMessageAt: new Date().toISOString(),
      });

    } catch (err: any) {
      const isBlocked = err.response?.data?.message?.includes("blocked") || err.message?.includes("blocked");
      if (isBlocked) {
        toast({
          title: "Error",
          description: "Cannot send message: You are blocked by the user.",
          variant: "destructive",
        });
      }
      updateMessageStatus(tempId, "error" as any);
    }
  };

  const handleBlock = async (convo: any, isBlocking: boolean) => {
    const targetUserId = convo.otherUserId;
    try {
      if (!targetUserId) {
        console.error("Cannot block: otherUserId is missing");
        return;
      }
      const res = await blockUser({
        user_blocked: targetUserId,
        is_blocking: isBlocking
      });

      if (res.status === 0 || res.message?.includes("successfully")) {
        const updatePayload = {
          isBlocked: isBlocking,
          blockedBy: isBlocking ? userId : null
        };

        updateConversation(convo.id, updatePayload);

        if (selectedConvo?.id === convo.id) {
          setSelectedConvo({
            ...selectedConvo,
            ...updatePayload
          });
        }
      }
    } catch (error: any) {
      console.error("Failed to block/unblock user", error);
      alert(error.response?.data?.message || "Failed to update block status");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value)
    // Auto-grow
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }
  return (
    <AppLayout>
      {isLoading ? (
        <MessagesSkeleton />
      ) : (
        <div className="container mx-auto px-0 md:px-4 py-0 md:py-1">
          <div className="max-w-6xl mx-auto bg-card md:rounded-2xl border-x-0 md:border border-border shadow-sm overflow-hidden h-[calc(100vh-2rem)] md:h-[calc(100vh-8rem)] relative">
            <div className="flex h-full">
              {/* Conversations List */}
              <div className={cn(
                "w-full md:w-80 border-r border-border flex flex-col transition-all duration-300",
                selectedConvo && "hidden md:flex"
              )}>
                <div className="p-4 border-b border-border">
                  <h2 className="text-xl font-bold text-foreground mb-3">Messages</h2>
                  {/* <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div> */}
                </div>

                <div className="flex-1 overflow-y-auto">
                  {sortedConversations.map((convo) => (
                    <button
                      key={convo.id}
                      onClick={async () => {
                        setMessages([]);
                        setIsMessagesLoading(true);
                        shouldJumpRef.current = true;
                        setHasMore(true);
                        const apiMessages = await getConversationMessages(convo.id, 20, 0);
                        const lastMessageId = apiMessages[apiMessages.length - 1]?.id;
                        if (lastMessageId) await getReadMessages(convo.id, lastMessageId);
                        const normalizedMsgs = await normalizeMessages(apiMessages, userId!);
                        // Set convo + messages together so the chat area renders with content already loaded
                        setSelectedConvo(convo);
                        setMessages(normalizedMsgs);
                        updateConversation(convo.id, { unread: 0 });
                        if (apiMessages.length < 20) setHasMore(false);
                        setIsMessagesLoading(false);
                      }}
                      className={cn(
                        "w-full p-4 flex items-center gap-3 hover:bg-secondary/50 transition-colors border-b border-border/50",
                        selectedConvo?.id === convo.id && "bg-secondary"
                      )}
                    >
                      <div className="relative">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={`${convo.user.avatar}`} />
                          <AvatarFallback className="bg-primary/10 text-primary font-medium">
                            {convo.user.initials}
                          </AvatarFallback>
                        </Avatar>
                        {convo.online && (
                          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-success rounded-full border-2 border-card" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center justify-between">

                          <span className={`text-foreground cursor-pointer ${selectedConvo?.id === convo.id && "text-gray-700  font-semibold"} ${convo.unread > 0 && "text-gray-700 font-bold text-lg "}`}>{convo.user.name}</span>
                          <span className={`text-xs text-muted-foreground cursor-pointer ${selectedConvo?.id === convo.id && "text-gray-700"} ${convo.unread > 0 && "text-gray-700 font-bold text-xs"}`}>{convo.time}</span>
                        </div>
                        <p className={`text-sm text-muted-foreground truncate cursor-pointer ${selectedConvo?.id === convo.id && "text-gray-700"} ${convo.unread > 0 && "text-gray-700 font-bold text-xs"}`}>{convo.lastMessage}</p>
                      </div>
                      {convo.unread > 0 && (
                        <span className="w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center font-medium">
                          {convo.unread}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat Area */}
              <div className={cn(
                "flex-1 flex flex-col transition-all duration-300 bg-card",
                !selectedConvo && "hidden md:flex"
              )}>
                {/* No Chat Selected State (Desktop only) */}
                {!selectedConvo && (
                  <div className="hidden md:flex flex-1 items-center justify-center text-muted-foreground bg-gray-100">
                    <div className="text-center">
                      <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p>Select a message to start chatting</p>
                    </div>
                  </div>
                )}

                {selectedConvo && (
                  <>
                    {/* Chat Header */}
                    <div className="p-4 border-b border-border flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="md:hidden -ml-2 h-8 w-8"
                          onClick={() => setSelectedConvo(null)}
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={`${selectedConvo?.user?.avatar}`} />
                          <AvatarFallback className="bg-primary/10 text-primary font-medium">
                            {selectedConvo?.user?.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold text-foreground">{selectedConvo?.user?.name}</h3>
                          {/* <p className="text-sm text-muted-foreground">
                          {selectedConvo?.online ? "Online" : "Offline"}
                        </p> */}
                        </div>
                      </div>
                      <div className="flex items-center">
                        <Button variant="ghost" size="icon" className="text-muted-foreground">
                          <UserDropdownMenuTrigger
                            userId={""}
                            actions={[
                              {
                                label: (selectedConvo.isBlocked && selectedConvo.blockedBy === userId) ? "Unblock user" : "Block user",
                                icon: <UserX className="h-4 w-4" />,
                                destructive: !(selectedConvo.isBlocked && selectedConvo.blockedBy === userId),
                                onClick: () => handleBlock(selectedConvo, !(selectedConvo.isBlocked && selectedConvo.blockedBy === userId)),
                              }
                            ]}
                          />
                        </Button>
                      </div>
                    </div>

                    {/* Messages */}
                    <div
                      ref={scrollContainerRef}
                      className="flex-1 overflow-y-auto p-4 space-y-4"
                    >
                      {isMessagesLoading ? (
                        <ChatSkeleton />
                      ) : (
                        <>
                          {/* Intersection Observer Target */}
                          <div ref={topObserverRef} className="h-1" />

                          {/* Loading Spinner */}
                          {isLoadingMore && (
                            <div className="flex justify-center py-2">
                              {/* <Loader2 className="w-6 h-6 animate-spin text-primary" /> */}
                              <ChatSkeleton />
                            </div>
                          )}

                          {messages.map((msg) => (
                            <div
                              key={msg.id}
                              className={cn(
                                "flex w-full gap-2 items-end",
                                msg.sender === "me" ? "justify-end" : "justify-start"
                              )}
                            >
                              {msg.sender === "them" && (
                                <Avatar className="w-8 h-8 shrink-0">
                                  <AvatarImage src={`${selectedConvo?.user?.avatar}`} />
                                  <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-medium">
                                    {selectedConvo?.user?.initials}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                              <div
                                className={cn(
                                  "max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-2.5",
                                  msg.sender === "me"
                                    ? "bg-primary text-primary-foreground rounded-br-md"
                                    : "bg-secondary text-secondary-foreground rounded-bl-md"
                                )}
                              >
                                <p className="text-sm md:text-base whitespace-pre-wrap break-words">{msg.content}</p>
                                <div className={cn(
                                  "flex items-center gap-1 mt-1",
                                  msg.sender === "me" ? "justify-end" : "justify-start"
                                )}>
                                  <span className={cn(
                                    "text-[10px] md:text-xs",
                                    msg.sender === "me" ? "text-primary-foreground/70" : "text-muted-foreground"
                                  )}>
                                    {msg.time}
                                  </span>
                                </div>
                              </div>
                              {msg.sender === "me" && (
                                <Avatar className="w-8 h-8 shrink-0">
                                  <AvatarImage src={`${myAvatar}`} />
                                  <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-medium">
                                    {myInitials}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                            </div>
                          ))}
                          <div ref={messagesEndRef} />
                        </>
                      )}
                    </div>

                    {/* Input Area */}
                    <div className="p-4 border-t border-border bg-card">
                      {selectedConvo.isBlocked ? (
                        selectedConvo.blockedBy === userId ? (
                          <div className="flex items-center justify-between p-2 bg-secondary/50 rounded-lg">
                            <p className="text-sm text-muted-foreground font-medium">
                              You have blocked this user.
                            </p>
                            <Button
                              variant="link"
                              size="sm"
                              className="text-primary h-auto p-0"
                              onClick={() => handleBlock(selectedConvo, false)}
                            >
                              Unblock
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center p-2 bg-secondary/50 rounded-lg">
                            <p className="text-sm text-muted-foreground font-medium">
                              You are blocked and cannot send messages.
                            </p>
                          </div>
                        )
                      ) : (
                        <div className="flex items-center gap-2 md:gap-3">
                          <Textarea
                            ref={textareaRef}
                            placeholder="Message"
                            value={newMessage}
                            onChange={handleChange}
                            onKeyDown={(e) => e.key === "Enter" && handleSend()}
                            rows={1}
                            className="flex-1 resize-none max-h-32 overflow-y-auto"
                          />
                          <Button variant="hero" size="icon" onClick={handleSend} className="shrink-0">
                            <Send className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
