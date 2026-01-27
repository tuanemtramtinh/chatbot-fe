// src/hooks/useLocalChat.ts
import { useState, useEffect, useCallback } from 'react';

export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'ai';
  status?: 'wait' | 'analyze' | 'review' | 'done';
  timestamp: number;
  displayType?: 'text' | 'svo_form';
}

export interface ChatConversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = 'genai_chat_history';
const CONVERSATIONS_KEY = 'genai_conversations';

// Initialize with default welcome message
const createDefaultMessage = (): ChatMessage => ({
  id: 'welcome',
  content: 'Chào bạn! Tôi là trợ lý AI thiết kế Use Case. Hãy nhập yêu cầu hoặc dùng mẫu SVO.',
  role: 'ai',
  status: 'done',
  timestamp: Date.now(),
});

export const useLocalChat = (conversationId?: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(conversationId || null);
  const [isTyping, setIsTyping] = useState(false);

  // Load all conversations from localStorage
  useEffect(() => {
    const savedConversations = localStorage.getItem(CONVERSATIONS_KEY);
    if (savedConversations) {
      try {
        const parsed = JSON.parse(savedConversations);
        // setConversations(parsed);
      } catch (error) {
        console.error('Failed to parse conversations:', error);
      }
    }
  }, []);

  // Load messages for current conversation
  useEffect(() => {
    if (currentConversationId) {
      const conversation = conversations.find((c) => c.id === currentConversationId);
      if (conversation) {
        // setMessages(conversation.messages);
      } else {
        // Create new conversation if not found
        const newConversation: ChatConversation = {
          id: currentConversationId,
          title: 'New Conversation',
          messages: [createDefaultMessage()],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        // setConversations((prev) => [...prev, newConversation]);
        // setMessages(newConversation.messages);
      }
    } else {
      // No conversation selected, show empty with welcome
      // setMessages([createDefaultMessage()]);
    }
  }, [currentConversationId, conversations]);

  // Save conversations whenever they change
  useEffect(() => {
    if (conversations.length > 0) {
      localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
    }
  }, [conversations]);

  // Save messages to current conversation
  useEffect(() => {
    if (currentConversationId && messages.length > 0) {
      // setConversations((prev) =>
      //   prev.map((conv) => {
      //     if (conv.id === currentConversationId) {
      //       // Update title from first user message if needed
      //       const firstUserMessage = messages.find((m) => m.role === 'user');
      //       const title = firstUserMessage
      //         ? firstUserMessage.content.slice(0, 50) + (firstUserMessage.content.length > 50 ? '...' : '')
      //         : conv.title;
      //       return {
      //         ...conv,
      //         messages,
      //         title,
      //         updatedAt: Date.now(),
      //       };
      //     }
      //     return conv;
      //   })
      // );
    }
  }, [messages, currentConversationId]);

  // Create a new conversation
  const createNewConversation = useCallback(() => {
    const newId = `conv_${Date.now()}`;
    const newConversation: ChatConversation = {
      id: newId,
      title: 'New Conversation',
      messages: [createDefaultMessage()],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setConversations((prev) => [...prev, newConversation]);
    setCurrentConversationId(newId);
    return newId;
  }, []);

  // Switch to a different conversation
  const switchConversation = useCallback((id: string) => {
    setCurrentConversationId(id);
  }, []);

  // Delete a conversation
  const deleteConversation = useCallback(
    (id: string) => {
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (currentConversationId === id) {
        setCurrentConversationId(null);
        setMessages([createDefaultMessage()]);
      }
    },
    [currentConversationId],
  );

  // Add a message to current conversation
  const addMessage = useCallback(
    (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
      const newMessage: ChatMessage = {
        ...message,
        id: `msg_${Date.now()}_${Math.random()}`,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, newMessage]);

      // Ensure we have a conversation
      if (!currentConversationId) {
        createNewConversation();
      }

      return newMessage.id;
    },
    [currentConversationId, createNewConversation],
  );

  // Update a message
  const updateMessage = useCallback((messageId: string, updates: Partial<ChatMessage>) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id === messageId) {
          return { ...m, ...updates };
        }
        return m;
      }),
    );
  }, []);

  // Clear current conversation messages (reset to welcome)
  const clearHistory = useCallback(() => {
    setMessages([createDefaultMessage()]);
  }, []);

  return {
    messages,
    conversations,
    currentConversationId,
    isTyping,
    setIsTyping,
    addMessage,
    updateMessage,
    clearHistory,
    createNewConversation,
    switchConversation,
    deleteConversation,
  };
};
