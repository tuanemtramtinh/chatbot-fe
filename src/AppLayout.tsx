/* eslint-disable @typescript-eslint/no-unused-vars */
import { CheckCircleFilled, HomeOutlined, LogoutOutlined } from '@ant-design/icons';
import { Avatar, Button, Divider, Flex, Layout, Menu, type MenuProps } from 'antd';
import { Content, Footer, Header } from 'antd/es/layout/layout';
import Sider from 'antd/es/layout/Sider';
import { Outlet } from 'react-router';
import MessageHistory from './components/MessageHistory';

// type MenuItem = Required<MenuProps>['items'][number];

// const items: MenuItem[] = [
//   {
//     icon: <HomeOutlined />,
//     key: 'home',
//     label: 'Trang Chủ',
//   },
// ];

function AppLayout() {
  return (
    <>
      <Layout style={{ minHeight: '100vh' }}>
        <Sider style={{ backgroundColor: 'white' }} width={'15%'}>
          <Flex vertical gap={'large'} style={{ height: '100%', padding: '16px' }}>
            <Flex style={{ display: 'flex', justifyContent: 'center' }}>
              <img src="../original.svg" alt="logo" />
            </Flex>
            <Flex flex={1} vertical>
              {/* <Menu
                style={{
                  width: '100%',
                  borderRight: '0px',
                }}
                mode="inline"
                items={items}
                defaultOpenKeys={['home']}
              /> */}
              {/* <Divider /> */}
              <MessageHistory />
            </Flex>
            {/* <Flex vertical gap={'large'}>
              <Flex gap={'small'} align="center" style={{ width: '100%' }}>
                <Avatar src="https://api.dicebear.com/9.x/initials/svg?seed=User" size={'default'} />
                <div
                  style={{
                    minWidth: 0,
                    flex: 1,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    NGUYỄN TUẤN ANH
                  </div>
                  <div
                    style={{
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    anhnguyentuan073@gmail.commmmmmmmm
                  </div>
                </div>
              </Flex>
              <Button icon={<LogoutOutlined />}>Đăng Xuất</Button>
            </Flex> */}
          </Flex>
        </Sider>
        <Layout>
          <Header
            style={{
              backgroundColor: 'var(--secondary-color)',
            }}
          >
            Header
          </Header>
          <Content
            style={{
              backgroundColor: 'var(--secondary-color)',
              height: 'calc(100vh - 64px)', // Viewport height minus header and footer
              overflow: 'auto',
            }}
          >
            <Outlet />
          </Content>
          {/* <Footer
            style={{
              backgroundColor: 'var(--secondary-color)',
            }}
          >
            <Flex justify="center">
              <Flex
                gap={'small'}
                style={{
                  textAlign: 'center',
                  fontWeight: 'bold',
                  backgroundColor: 'white',
                  padding: '8px 48px',
                  borderRadius: 999,
                  border: '1px solid #9999',
                  fontSize: '16px',
                }}
              >
                <CheckCircleFilled style={{ color: 'var(--primary-color)' }} />
                <span>Chatbot có thể mắc sai sót, vì vậy, nhớ xác minh câu trả lời của Chatbot</span>
              </Flex>
            </Flex>
          </Footer> */}
        </Layout>
      </Layout>
    </>
  );
}

export default AppLayout;
