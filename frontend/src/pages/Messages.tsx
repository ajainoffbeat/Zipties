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
  Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UserDropdownMenuTrigger } from "@/components/common/UserDropdown";
import { useInboxStore } from "@/store/useInboxStore";
import { getConversationMessages, getInbox, getReadMessages } from "@/lib/api/conversation.api";
import { Message, useMessageStore } from "@/store/useMessageStore";
import { sendMessageApi } from "@/lib/api/conversation.api";
import { socket } from "@/lib/socket";
import { useAuthStore } from "@/store/authStore";

export default function Messages() {

  const {
    conversations,
    selectedConvo,
    setConversations,
    setSelectedConvo,
  } = useInboxStore();

  const { messages, addMessage, updateMessageStatus, setMessages, prependMessages } = useMessageStore();
  const userId = useAuthStore((s) => s.userId)

  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const topObserverRef = useRef<HTMLDivElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const loadInbox = async () => {
      const data = await getInbox();
      setConversations(normalizeInbox(data));
    };
    loadInbox();
  }, []);

  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage) {
      // Only scroll to bottom if it's a new message (not prepended)
      // We can check if we were already near the bottom or if it's the very first load
      scrollToBottom();
    }
  }, [messages.length, selectedConvo]);

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
      online: false, // will be updated via socket
    }));
  };

  const normalizeMessages = (apiMessages: any[], myUserId: string): Message[] => {
    return apiMessages.map((msg) => ({
      id: msg.id,
      isread: msg.isread,
      conversationId: msg.conversation_id,
      sender: msg.sender_id === userId ? "me" : "them",
      content: msg.content,
      time: new Date(msg.created_at).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      status: "read" as const,
    }));
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

    const tempId = selectedConvo.id
   
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
      updateMessageStatus(tempId, "sent");
      socket.emit("new_message", {
        conversation_id: selectedConvo.id,
        content: newMessage,
        message_id: res.message_id,
      });

    } catch (err) {
      console.error("Send message failed", err);
      updateMessageStatus(tempId, "sending");
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-4">
        <div className="max-w-6xl mx-auto bg-card rounded-2xl border border-border shadow-sm overflow-hidden h-[calc(100vh-8rem)]">
          <div className="flex h-full">
            {/* Conversations List */}
            <div className="w-80 border-r border-border flex flex-col">
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
                  console.log("convo", convo),
                  <button
                    key={convo.id}
                    onClick={async () => {
                      setSelectedConvo(convo);
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
                      selectedConvo.id === convo.id && "bg-secondary"
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
            <div className="flex-1 flex flex-col">
              {/* Chat Header */}
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
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
                  {/* <Button variant="ghost" size="icon" className="text-muted-foreground">
                    <Phone className="w-5 h-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-muted-foreground">
                    <Video className="w-5 h-5" />
                  </Button> */}
                  <Button variant="ghost" size="icon" className="text-muted-foreground">

                    <UserDropdownMenuTrigger

                      userId={""}
                      actions={[
                        {
                          label: "Block user",
                          icon: <UserX className="h-4 w-4" />,
                          destructive: true,
                          onClick: () => console.log("Block user"),
                        },
                        {
                          label: "Delete user",
                          icon: <Trash2 className="h-4 w-4 " />,
                          destructive: true,
                          onClick: () => console.log("Delete user"),
                        },
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
                      "flex",
                      msg.sender === "me" ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[70%] rounded-2xl px-4 py-2.5",
                        msg.sender === "me"
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-secondary text-secondary-foreground rounded-bl-md"
                      )}
                    >
                      <p>{msg.content}</p>
                      <div className={cn(
                        "flex items-center gap-1 mt-1",
                        msg.sender === "me" ? "justify-end" : "justify-start"
                      )}>
                        <span className={cn(
                          "text-xs",
                          msg.sender === "me" ? "text-primary-foreground/70" : "text-muted-foreground"
                        )}>
                          {msg.time}
                        </span>
                        {/* {msg.sender === "me" && (
                          msg.status === "read"
                            ? <CheckCheck className="w-3.5 h-3.5 text-primary-foreground/70" />
                            : <Check className="w-3.5 h-3.5 text-primary-foreground/70" />
                        )} */}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 border-t border-border">
                <div className="flex items-center gap-3">
                  {/* <Button variant="ghost" size="icon" className="text-muted-foreground">
                    <Paperclip className="w-5 h-5" />
                  </Button> */}
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    className="flex-1"
                  />
                  {/* <Button variant="ghost" size="icon" className="text-muted-foreground">
                    <Smile className="w-5 h-5" />
                  </Button> */}
                  <Button variant="hero" size="icon" onClick={handleSend}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
