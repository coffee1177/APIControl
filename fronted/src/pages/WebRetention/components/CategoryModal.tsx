import { useEffect, useState } from "react";
import { App, Form, Input, Modal } from "antd";

import { webApi } from "../../../api/web";
import type { CategoryNode } from "../../../api/web/types";
import { RequestError } from "../../../utils/request";

interface CategoryModalProps {
  action: CategoryAction | null;
  onClose: () => void;
  onChanged: () => void;
}

interface CategoryFormValues {
  name: string;
}

export interface CategoryAction {
  mode: "create" | "rename";
  category?: CategoryNode;
  parentId: number | null;
  parentName?: string;
}

export function CategoryModal({
  action,
  onClose,
  onChanged,
}: CategoryModalProps) {
  const { message } = App.useApp();
  const [form] = Form.useForm<CategoryFormValues>();
  const [submitting, setSubmitting] = useState(false);

  const closeForm = () => {
    form.resetFields();
    onClose();
  };

  useEffect(() => {
    if (action) {
      form.setFieldsValue({ name: action.category?.name ?? "" });
    } else {
      form.resetFields();
    }
  }, [action, form]);

  const handleSubmit = async ({ name }: CategoryFormValues) => {
    if (!action) {
      return;
    }

    setSubmitting(true);
    try {
      if (action.mode === "rename" && action.category) {
        await webApi.updateCategory(action.category.id, {
          name: name.trim(),
          parentId: action.parentId,
        });
        message.success("分类已重命名");
      } else {
        await webApi.createCategory({
          name: name.trim(),
          parentId: action.parentId,
        });
        message.success("分类已创建");
      }
      onClose();
      form.resetFields();
      onChanged();
    } catch (error) {
      message.error(
        error instanceof RequestError ? error.message : "保存失败，请稍后重试",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={
        action?.mode === "rename"
          ? "重命名分类"
          : action?.parentName
            ? `在“${action.parentName}”下新增分类`
            : "新增一级分类"
      }
      open={Boolean(action)}
      onCancel={closeForm}
      onOk={() => form.submit()}
      confirmLoading={submitting}
      okText="保存"
      cancelText="取消"
      destroyOnHidden
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          name="name"
          label="分类名称"
          rules={[
            { required: true, whitespace: true, message: "请输入分类名称" },
            { max: 100, message: "分类名称不能超过 100 个字符" },
          ]}
        >
          <Input autoFocus placeholder="请输入分类名称" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
