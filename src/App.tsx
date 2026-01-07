import { Flex, Layout } from "antd";
import { Content, Footer, Header } from "antd/es/layout/layout";
import Sider from "antd/es/layout/Sider";

function App() {
  return (
    <>
      <Layout className="min-h-screen">
        <Sider className="bg-white">
          <Flex vertical gap={"large"} className="h-full p-4">
            <Flex>Logo</Flex>
            <Flex flex={1}>Content</Flex>
            <Flex>User</Flex>
          </Flex>
        </Sider>
        <Layout>
          <Header className="bg-white">Header</Header>
          <Content>Content</Content>
          <Footer>Footer</Footer>
        </Layout>
      </Layout>
    </>
  );
}

export default App;
