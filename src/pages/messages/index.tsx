import {
  CopyOutlined,
  RedoOutlined,
  UserOutlined,
  RobotOutlined,
} from "@ant-design/icons";
import { Actions, Bubble, Sender } from "@ant-design/x";
import { Avatar, Flex, Tooltip, type GetRef } from "antd";
import { useRef, useState } from "react";

const actionItems = [
  {
    key: "retry",
    icon: <RedoOutlined />,
    label: "Retry",
  },
  {
    key: "copy",
    icon: <CopyOutlined />,
    label: "Copy",
  },
];

export default function MessagesPage() {
  const senderRef = useRef<GetRef<typeof Sender>>(null);

  const [messages, setMessages] = useState([
    {
      id: "1",
      role: "assistant" as const,
      content: "Xin chào! Tôi có thể giúp gì cho bạn?",
      timestamp: new Date(),
    },
    {
      id: "2",
      role: "user" as const,
      content: "Bạn có thể giải thích về React hooks không?",
      timestamp: new Date(),
    },
    {
      id: "3",
      role: "assistant" as const,
      content:
        "React hooks là các hàm đặc biệt cho phép bạn sử dụng state và các tính năng khác của React trong functional components. Một số hooks phổ biến bao gồm useState, useEffect, useContext, và useMemo.",
      timestamp: new Date(),
    },
  ]);

  const bubbleItems = messages.map((message) => ({
    key: message.id,
    role: message.role,
    content: message.content,
    header: message.role === "assistant" ? "Chatbot" : "Bạn",
    avatar:
      message.role === "assistant" ? (
        <Tooltip title="Chatbot">
          <Avatar icon={<RobotOutlined />} />
        </Tooltip>
      ) : (
        <Tooltip title="Bạn">
          <Avatar icon={<UserOutlined />} />
        </Tooltip>
      ),
    placement:
      message.role === "assistant" ? ("start" as const) : ("end" as const),
    footer:
      message.role === "assistant"
        ? (content: string) => (
            <Actions
              items={actionItems}
              onClick={(info) => {
                const key = info.item?.key || info.key;
                if (key === "copy") {
                  navigator.clipboard.writeText(content);
                } else if (key === "retry") {
                  console.log("Retry message:", content);
                }
              }}
            />
          )
        : undefined,
  }));

  const handleSend = (value: string) => {
    const newMessage = {
      id: Date.now().toString(),
      role: "user" as const,
      content: value,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);
    senderRef.current?.clear();
    // TODO: Gọi API để nhận phản hồi từ AI và thêm vào messages
  };

  return (
    <Flex vertical style={{ height: "100%", padding: "24px 16px" }}>
      <Flex flex={1} vertical gap={"small"} style={{ overflowY: "auto" }}>
        <Bubble.List items={bubbleItems} />
      </Flex>
      <Flex>
        <Sender
          ref={senderRef}
          style={{ backgroundColor: "white" }}
          onSubmit={handleSend}
        />
      </Flex>
    </Flex>
  );
}
