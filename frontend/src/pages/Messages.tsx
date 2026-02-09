import { useEffect, useState, useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  MessageCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UserDropdownMenuTrigger } from "@/components/common/UserDropdown";
import { useInboxStore } from "@/store/useInboxStore";
import { getConversationMessages, getInbox, getReadMessages, blockUserApi } from "@/lib/api/conversation.api";
import { Message, useMessageStore } from "@/store/useMessageStore";
import { sendMessageApi } from "@/lib/api/conversation.api";
import { socket } from "@/lib/socket";
import { useAuthStore } from "@/store/authStore";
import { useProfileStore } from "@/store/useProfileStore";
import { toast } from "sonner";

export default function Messages() {

  const {
    conversations,
    selectedConvo,
    setConversations,
    setSelectedConvo,
    updateConversation,
  } = useInboxStore();

  const { messages, addMessage, updateMessageStatus, updateMessageId, setMessages, prependMessages } = useMessageStore();
  const userId = useAuthStore((s) => s.userId);
  const { profile, fetchProfile } = useProfileStore();

  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const topObserverRef = useRef<HTMLDivElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const shouldJumpRef = useRef(true);
  const lastMessageIdRef = useRef<string | null>(null);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    const loadInbox = async () => {
      setSelectedConvo(null as any); // Clear selected convo on refresh/mount
      const data = await getInbox();
      setConversations(normalizeInbox(data));
      if (userId) fetchProfile(userId);
    };
    loadInbox();
  }, [userId]);

  const myInitials = profile?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "ME";

  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage) {
      const isNewMessage = lastMessage.id !== lastMessageIdRef.current;

      if (isNewMessage) {
        if (shouldJumpRef.current || !lastMessageIdRef.current) {
          scrollToBottom("auto");
          shouldJumpRef.current = false;
        } else {
          scrollToBottom("smooth");
        }
        lastMessageIdRef.current = lastMessage.id;
      }
    }
  }, [messages, selectedConvo?.id]);

  const handleLoadMore = async () => {
    if (!selectedConvo || isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    const scrollContainer = topObserverRef.current?.parentElement;
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
        prependMessages(normalizeMessages(apiMessages, userId!));

        // Adjust scroll position after DOM update
        setTimeout(() => {
          if (scrollContainer) {
            const newScrollHeight = scrollContainer.scrollHeight;
            scrollContainer.scrollTop = newScrollHeight - oldScrollHeight;
          }
        }, 0);
      }
    } catch (error) {
      console.error("Failed to load more messages", error);
    } finally {
      setIsLoadingMore(false);
    }
  };


  const normalizeInbox = (apiData: any[]) => {
    return apiData.map((item) => ({
      id: item.conversation_id,
      user: {
        name: item.title ?? "Unknown",
        initials: item.title
          ?.split(" ")
          .map((n: string) => n[0])
          .join("")
          .toUpperCase() ?? "U",
      },
      lastMessage: item.last_message_content ?? "",
      time: new Date(item.last_message_at).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      unread: item.unread_count ?? 0,
      online: false,
      otherUserId: item.other_user_id,
      isBlocked: item.is_blocked ?? false,
      blockedBy: item.blocked_by,
    }));
  };

  const normalizeMessages = (apiMessages: any[], myUserId: string): Message[] => {
    const currentUserId = myUserId || userId;
    return apiMessages.map((msg) => {
      const isMe = String(msg.sender_id) === String(currentUserId);
      if (isMe) {
        if (msg === apiMessages[0]) console.log("Successful sender match found!");
      }

      return {
        id: msg.id,
        isread: msg.isread,
        conversationId: msg.conversation_id,
        sender: isMe ? "me" : "them",
        content: msg.content,
        time: new Date(msg.created_at).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        status: "read" as const,
      };
    });
  };


  // useEffect(() => {
  //   // Fetch profile if not already available
  //   if (token && !profile) {
  //     // We need the user ID from the token or some other way if fetchProfile requires it.
  //     // Looking at useProfileStore, it takes a userId.
  //     // If we don't have the userId, we might need a "getMe" endpoint or similar.
  //     // Assuming for now it's accessible or we can get it.
  //     // If the user is logged in, useProfileStore might already have it if fetchProfile was called elsewhere.
  //   }
  // }, [token, profile]);

  useEffect(() => {
    socket.on("new_message", (payload) => {
      addMessage({
        id: payload.message_id,
        conversationId: payload.conversation_id,
        isread: true,
        sender: "them",
        content: payload.content,
        time: new Date(payload.created_at).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        status: "delivered",
      });
    });

    return () => {
      socket.off("new_message");
    };
  }, []);

  const [newMessage, setNewMessage] = useState("");

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedConvo) return;

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

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

    try {
      const res = await sendMessageApi({
        conversation_id: selectedConvo.id,
        content: newMessage,
      });

      // Update temp ID with real ID and set status to sent
      updateMessageId(tempId, res.message_id);
      updateMessageStatus(res.message_id, "sent");

      socket.emit("new_message", {
        conversation_id: selectedConvo.id,
        content: newMessage,
        message_id: res.message_id,
      });

    } catch (err: any) {
      const isBlocked = err.response?.data?.message?.includes("blocked") || err.message?.includes("blocked");
      if (isBlocked) {
        toast.error("Cannot send message: You are blocked by the user.");
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
      const res = await blockUserApi({
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
  return (
    <AppLayout>
      <div className="container mx-auto px-0 md:px-4 py-0 md:py-4">
        <div className="max-w-6xl mx-auto bg-card md:rounded-2xl border-x-0 md:border border-border shadow-sm overflow-hidden h-[calc(100vh-4rem)] md:h-[calc(100vh-8rem)] relative">
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
                {conversations?.map((convo) => (
                  <button
                    key={convo.id}
                    onClick={async () => {
                      setSelectedConvo(convo);
                      shouldJumpRef.current = true;
                      setHasMore(true);
                      const apiMessages = await getConversationMessages(convo.id, 1000, 0);
                      const lastMessageId = apiMessages[apiMessages.length - 1]?.id;
                      if (lastMessageId) await getReadMessages(convo.id, lastMessageId);
                      setMessages(
                        normalizeMessages(apiMessages, userId!)
                      );
                      if (apiMessages.length < 20) setHasMore(false);
                    }}
                    className={cn(
                      "w-full p-4 flex items-center gap-3 hover:bg-secondary/50 transition-colors border-b border-border/50",
                      selectedConvo?.id === convo.id && "bg-secondary"
                    )}
                  >
                    <div className="relative">
                      <Avatar className="w-12 h-12">
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

                        <span className="font-semibold text-foreground">{convo.user.name}</span>
                        <span className="text-xs text-muted-foreground">{convo.time}</span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{convo.lastMessage}</p>
                    </div>
                    {convo.unread > 0 && (
                      console.log("unread", convo.unread),
                      <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
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
                  <div className="flex-1 overflow-y-auto p-4 space-y-4" onScroll={(e) => {
                    const target = e.currentTarget;
                    if (target.scrollTop === 0 && hasMore && !isLoadingMore && selectedConvo) {
                      handleLoadMore();
                    }
                  }}>
                    <div ref={topObserverRef} className="h-1" />
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
                            <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-medium">
                              {myInitials}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
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
                        <Input
                          placeholder="Type a message..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleSend()}
                          className="flex-1"
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
    </AppLayout>
  );
}
