import { Card, Flex } from "antd";

export const MessageHistory = () => {
  return (
    <Flex flex={1} vertical gap={"small"}>
      <Card hoverable size="small">
        Hello
      </Card>
      <Card hoverable size="small">
        Hello
      </Card>
    </Flex>
  );
};

export default MessageHistory;
