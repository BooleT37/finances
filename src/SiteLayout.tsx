import { Layout, Menu, MenuProps } from "antd"
import React from "react"
import {
  TableOutlined,
  LineChartOutlined,
  CalendarOutlined,
  DollarOutlined
} from '@ant-design/icons';
import { useLocation, useNavigate } from "react-router-dom";

const { Content, Footer, Sider } = Layout;

type MenuItem = Required<MenuProps>['items'][number];

function getItem(
  label: React.ReactNode,
  key: React.Key,
  icon?: React.ReactNode,
): MenuItem {
  return {
    key,
    icon,
    label,
  } as MenuItem;
}

const items: MenuItem[] = [
  getItem('Данные', '/data', <TableOutlined />),
  getItem('Статистика', '/statistics', <LineChartOutlined />),
  getItem('Планирование', '/planning', <CalendarOutlined />,),
  getItem('Подписки', '/subscriptions', <DollarOutlined />),
];

/* eslint-disable mobx/missing-observer */
const SiteLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [collapsed, setCollapsed] = React.useState(false)
  const location = useLocation();
  let navigate = useNavigate();

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}>
        <div className="logo" />
        <Menu
          selectedKeys={[location.pathname]}
          onSelect={(({ key }) => { navigate(key) })}
          theme="dark"
          mode="inline"
          items={items}
        />
      </Sider>
      <Layout className="site-layout">
        <Content>
          {children}
        </Content>
        <Footer style={{ textAlign: 'center' }}>Ant Design ©2018 Created by Ant UED</Footer>
      </Layout>
    </Layout>
  )
}

export default SiteLayout