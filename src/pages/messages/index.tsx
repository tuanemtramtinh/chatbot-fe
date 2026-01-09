import { CopyOutlined, RedoOutlined, UserAddOutlined } from "@ant-design/icons";
import { Actions, Bubble, Sender } from "@ant-design/x";
import { Avatar, Flex, Tooltip } from "antd";

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
  return (
    <Flex vertical style={{ height: "100%", padding: "24px 16px" }}>
      <Flex flex={1} vertical gap={"small"}>
        <Flex gap={"small"} wrap>
          <div style={{ width: "100%" }}>
            <Bubble
              content="align left"
              header="Chatbot"
              footerPlacement="outer-end"
              avatar={
                <Tooltip title="Chatbot">
                  <Avatar icon={<UserAddOutlined />} />
                </Tooltip>
              }
              footer={(content) => (
                <Actions
                  items={actionItems}
                  onClick={() => console.log(content)}
                />
              )}
            />
          </div>
        </Flex>
      </Flex>
      <Flex>
        <Sender style={{ backgroundColor: "white" }} />
      </Flex>
    </Flex>
  );
}
