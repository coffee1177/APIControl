import React from "react";
import {
  HomeOutlined,
  LinkOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import { ConfigProvider, Grid, Layout, Menu, theme } from "antd";
import { useLocation, useNavigate } from "react-router-dom";

import routes from "../router/routes.json";

const { Header, Content, Sider } = Layout;

// const items1: MenuProps["items"] = ["1", "2", "3"].map((key) => ({
//   key,
//   label: `nav ${key}`,
// }));

const iconRegistry = {
  home: HomeOutlined,
  link: LinkOutlined,
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
  const screens = Grid.useBreakpoint();
  const {
    token: { colorBgContainer, borderRadiusLG, colorText },
  } = theme.useToken();

  return (
    <Layout style={{ height: "100vh", overflow: "hidden" }}>
      <Header
        style={{
          display: "flex",
          alignItems: "center",
          background: colorBgContainer,
          height: 48,
          padding: screens.sm ? "0 24px" : "0 16px 0 56px",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
          zIndex: 1,
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center"}}>
          <img
            src="/default/logo.svg"
            alt="APIControl"
            style={{ width: 24, height: 24, marginInlineEnd: 24, marginRight: 16 }}
          />

          <span style={{ fontSize: 14 }}>控制台</span>
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
      <Layout style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
        <Sider
          width={180}
          breakpoint="lg"
          collapsedWidth={0}
          zeroWidthTriggerStyle={{
            top: -40,
            insetInlineEnd: -40,
            width: 40,
            height: 32,
            lineHeight: "32px",
            color: colorText,
            background: colorBgContainer,
          }}
          style={{
            height: "100%",
            overflowY: "auto",
            background: colorBgContainer,
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
            zIndex: 1,
          }}
        >
          <ConfigProvider
            theme={{ components: { Menu: { itemHeight: 32, iconSize: 12 } } }}
          >
            <Menu
              mode="inline"
              selectedKeys={[location.pathname]}
              style={{
                height: "100%",
                borderInlineEnd: 0,
                fontSize: 12,
                width: "100%",
              }}
              items={items2}
              onClick={({ key }) => navigate(key)}
            />
          </ConfigProvider>
        </Sider>
        <Layout style={{ minWidth: 0, minHeight: 0, overflow: "hidden" }}>
          {/* <Breadcrumb
            items={[{ title: "Home" }, { title: "List" }, { title: "App" }]}
            style={{ margin: "16px 0" }}
          /> */}
          <Content
            style={{
              flex: 1,
              padding: screens.md ? 24 : 12,
              margin: 0,
              minWidth: 0,
              minHeight: 0,
              overflowY: "auto",
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
