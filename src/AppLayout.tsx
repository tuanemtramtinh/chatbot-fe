import { Layout } from 'antd';
import { Content } from 'antd/es/layout/layout';
import { Outlet } from 'react-router';

function AppLayout() {
  return (
    <>
      <Layout style={{ minHeight: '100vh' }}>
        <Layout>
          <Content
            style={{
              backgroundColor: 'var(--secondary-color)',
              // height: 'calc(100vh - 64px)', // Viewport height minus header and footer
              overflow: 'auto',
            }}
          >
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    </>
  );
}

export default AppLayout;
