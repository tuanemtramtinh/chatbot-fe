// src/hooks/useAgentStream.tsx
import { useState, useCallback, useRef, useEffect } from 'react';

export interface UIStateUpdate {
  type: 'ui_state_update';
  state: 'wait' | 'analyze' | 'review';
  message?: string;
  content?: string;
}

export interface StreamEvent {
  type: 'message' | 'state_update' | 'error' | 'complete';
  data?: any;
}

export const useAgentStream = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const messageQueueRef = useRef<string[]>([]);

  // Connect to WebSocket (placeholder - replace with actual endpoint)
  const connect = useCallback((url?: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    const wsUrl = url || 'ws://localhost:8080/stream'; // Replace with actual endpoint
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setIsConnected(true);
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as UIStateUpdate | StreamEvent;

        if (data.type === 'ui_state_update') {
          const stateUpdate = data as UIStateUpdate;
          // Handle state update - this will be handled by parent component
          return stateUpdate;
        }

        if (data.type === 'message') {
          // Handle streaming message
          return data;
        }

        if (data.type === 'error') {
          console.error('Stream error:', data.data);
          setIsBlocking(false);
        }

        if (data.type === 'complete') {
          setIsBlocking(false);
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
      setIsBlocking(false);
    };

    ws.onclose = () => {
      setIsConnected(false);
      setIsBlocking(false);
      console.log('WebSocket disconnected');
    };

    wsRef.current = ws;
  }, []);

  // Disconnect WebSocket
  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    setIsBlocking(false);
  }, []);

  // Send message through WebSocket
  const sendMessage = useCallback(
    (message: string) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'message', content: message }));
        setIsBlocking(true);
      } else {
        // Queue message if not connected
        messageQueueRef.current.push(message);
        console.warn('WebSocket not connected. Message queued.');
      }
    },
    []
  );

  // Send queued messages when connected
  useEffect(() => {
    if (isConnected && messageQueueRef.current.length > 0) {
      messageQueueRef.current.forEach((msg) => sendMessage(msg));
      messageQueueRef.current = [];
    }
  }, [isConnected, sendMessage]);

  // Simulate streaming (for development/testing without WebSocket)
  const simulateStream = useCallback(
    (
      userInput: string,
      onMessage: (content: string) => void,
      onStateUpdate: (state: 'wait' | 'analyze' | 'review', message?: string) => void,
      onComplete: () => void
    ) => {
      setIsBlocking(true);

      // Simulate state updates
      setTimeout(() => {
        onStateUpdate('analyze', 'Đang phân tích yêu cầu...');
      }, 500);

      setTimeout(() => {
        onStateUpdate('analyze', 'Đang tạo Use Case diagram...');
      }, 1500);

      // Simulate streaming response
      const responseText = `Tôi đã nhận yêu cầu: **"${userInput}"**. \n\nĐang phân tích Actor và Use Case tương ứng...\n\nDựa trên yêu cầu của bạn, tôi sẽ tạo diagram với các thành phần sau:\n- Actor: [Actor name]\n- Use Case: [Use case name]`;
      let charIndex = 0;

      const interval = setInterval(() => {
        if (charIndex < responseText.length) {
          onMessage(responseText.slice(0, charIndex + 1));
          charIndex++;
        } else {
          clearInterval(interval);
          setTimeout(() => {
            onStateUpdate('review', 'Hoàn thành! Bạn có thể xem lại diagram.');
            setIsBlocking(false);
            onComplete();
          }, 300);
        }
      }, 30); // 30ms per character

      return () => clearInterval(interval);
    },
    []
  );

  return {
    isConnected,
    isBlocking,
    connect,
    disconnect,
    sendMessage,
    simulateStream,
  };
};
