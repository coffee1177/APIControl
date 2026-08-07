import { useState } from "react";
import { Button, Space, Typography, message } from "antd";

import { healthApi } from "../../api/health";

export function TestPage() {
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const checkBackend = async () => {
    setLoading(true);
    try {
      const response = await healthApi.check();
      console.log("APIControl 后端测试成功", response);
      messageApi.success(response.message);
    } catch (error) {
      console.error("APIControl 后端测试失败", error);
      messageApi.error("后端接口调用失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ padding: 32 }}>
      {contextHolder}
      <Space direction="vertical" size="middle">
        <Typography.Title level={2}>APIControl 测试页面</Typography.Title>
        <Button type="primary" loading={loading} onClick={checkBackend}>
          测试后端接口
        </Button>
      </Space>
    </main>
  );
}
