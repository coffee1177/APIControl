import React from "react";
import {
  HomeOutlined,
  LaptopOutlined,
  NotificationOutlined,
  UserOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import { Breadcrumb, ConfigProvider, Layout, Menu, theme } from "antd";
import { useLocation, useNavigate } from "react-router-dom";

import routes from "../router/routes.json";

const { Header, Content, Sider } = Layout;

const items1: MenuProps["items"] = ["1", "2", "3"].map((key) => ({
  key,
  label: `nav ${key}`,
}));

const iconRegistry = {
  home: HomeOutlined,
  UserOutlined,
  LaptopOutlined,
  NotificationOutlined,
};

type IconName = keyof typeof iconRegistry;

interface MenuRoute {
  key: string;
  icon?: IconName;
  label: string;
  children?: MenuRoute[];
}

type MenuItem = NonNullable<MenuProps["items"]>[number];

function createMenuItem(route: MenuRoute): MenuItem {
  const icon = route.icon ? iconRegistry[route.icon] : undefined;

  return {
    key: route.key,
    icon: icon ? React.createElement(icon) : undefined,
    label: route.label,
    children: route.children?.map(createMenuItem),
  };
}

const items2: MenuProps["items"] = (routes as MenuRoute[]).map(createMenuItem);

interface ManagementLayoutProps {
  children: React.ReactNode;
}

export function ManagementLayout({ children }: ManagementLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header
        style={{
          display: "flex",
          alignItems: "center",
          background: colorBgContainer,
          height: 48,
          padding: "0 24px",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
          zIndex: 1,
        }}
      >
        <div style={{ display: "flex", alignItems: "center"}}>
          <img
            src="/default/logo.svg"
            alt="APIControl"
            style={{ width: 24, height: 24, marginInlineEnd: 24, marginRight: 16 }}
          />

          <span>控制台</span>
        </div>

        {/* <ConfigProvider
          theme={{ components: { Menu: { activeBarHeight: 0 } } }}
        >
          <Menu
            mode="horizontal"
            defaultSelectedKeys={["2"]}
            items={items1}
            style={{ flex: 1, minWidth: 0 }}
          />
        </ConfigProvider> */}
      </Header>
      <Layout style={{ flex: 1 }}>
        <Sider width={180} style={{ background: colorBgContainer }}>
          <ConfigProvider
            theme={{ components: { Menu: { itemHeight: 32, iconSize: 12 } } }}
          >
            <Menu
              mode="inline"
              selectedKeys={[location.pathname]}
              style={{
                height: "100%",
                borderInlineEnd: 0,
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
                fontSize: 12,
                width: "100%",
              }}
              items={items2}
              onClick={({ key }) => navigate(key)}
            />
          </ConfigProvider>
        </Sider>
        <Layout>
          {/* <Breadcrumb
            items={[{ title: "Home" }, { title: "List" }, { title: "App" }]}
            style={{ margin: "16px 0" }}
          /> */}
          <Content
            style={{
              flex: 1,
              padding: 24,
              margin: 0,
              minHeight: 280,
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
            }}
          >
            {children}
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
}
