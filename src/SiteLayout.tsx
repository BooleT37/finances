import { Layout, Menu } from "antd";
import React from "react";
import {
  TableOutlined,
  LineChartOutlined,
  CalendarOutlined,
  DollarOutlined,
  SettingOutlined,
  BankOutlined,
} from "@ant-design/icons";
import { Link, useLocation } from "react-router-dom";
import { ItemType } from "antd/lib/menu/hooks/useItems";

const { Content, Footer, Sider } = Layout;

function getItem(
  label: string,
  path: string,
  icon?: React.ReactNode
): ItemType {
  return {
    key: label,
    icon,
    label: <Link to={path}>{label}</Link>,
  };
}

const items: ItemType[] = [
  getItem("Данные", "/screens/data", <TableOutlined />),
  getItem("Траты из сбережений", "/screens/saving-spendings", <BankOutlined />),
  getItem("Статистика", "/screens/statistics", <LineChartOutlined />),
  getItem("Планирование", "/screens/planning", <CalendarOutlined />),
  getItem("Подписки", "/screens/subscriptions", <DollarOutlined />),
  getItem("Настройки", "/screens/settings", <SettingOutlined />),
];

/* eslint-disable mobx/missing-observer */
const SiteLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [collapsed, setCollapsed] = React.useState(false);
  const location = useLocation();

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        width={210}
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
      >
        <div className="logo" />
        <Menu
          selectedKeys={[location.pathname]}
          theme="dark"
          mode="inline"
          items={items}
        />
      </Sider>
      <Layout className="site-layout">
        <Content>{children}</Content>
        <Footer style={{ textAlign: "center" }}>
          Ant Design ©2018 Created by Ant UED
        </Footer>
      </Layout>
    </Layout>
  );
};

export default SiteLayout;
