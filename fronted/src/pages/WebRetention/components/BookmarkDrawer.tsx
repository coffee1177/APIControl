import { useEffect, useMemo, useState } from "react";
import { App, Button, Drawer, Form, Input, Select, Space } from "antd";

import { webApi } from "../../../api/web";
import type {
  Bookmark,
  BookmarkPayload,
  CategoryNode,
} from "../../../api/web/types";
import { RequestError } from "../../../utils/request";

interface BookmarkDrawerProps {
  open: boolean;
  bookmark: Bookmark | null;
  categories: CategoryNode[];
  defaultCategoryId?: number;
  onClose: () => void;
  onSaved: () => void;
}

interface BookmarkFormValues {
  title: string;
  url: string;
  description?: string;
  categoryId?: number;
}

function getCategoryOptions(categories: CategoryNode[]) {
  return categories.flatMap((category) => [
    { label: category.name, value: category.id },
    ...category.children.map((child) => ({
      label: `${category.name} / ${child.name}`,
      value: child.id,
    })),
  ]);
}

export function BookmarkDrawer({
  open,
  bookmark,
  categories,
  defaultCategoryId,
  onClose,
  onSaved,
}: BookmarkDrawerProps) {
  const { message } = App.useApp();
  const [form] = Form.useForm<BookmarkFormValues>();
  const [submitting, setSubmitting] = useState(false);
  const categoryOptions = useMemo(
    () => getCategoryOptions(categories),
    [categories],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    if (bookmark) {
      form.setFieldsValue({
        title: bookmark.title,
        url: bookmark.url,
        description: bookmark.description ?? undefined,
        categoryId: bookmark.categoryId ?? undefined,
      });
    } else {
      form.resetFields();
      form.setFieldValue("categoryId", defaultCategoryId);
    }
  }, [bookmark, defaultCategoryId, form, open]);

  const handleSubmit = async (values: BookmarkFormValues) => {
    const payload: BookmarkPayload = {
      title: values.title.trim(),
      url: values.url.trim(),
      description: values.description?.trim() || null,
      categoryId: values.categoryId ?? null,
    };

    setSubmitting(true);
    try {
      if (bookmark) {
        await webApi.updateBookmark(bookmark.id, payload);
        message.success("网址已更新");
      } else {
        await webApi.createBookmark(payload);
        message.success("网址已添加");
      }
      onSaved();
      onClose();
    } catch (error) {
      message.error(
        error instanceof RequestError ? error.message : "保存失败，请稍后重试",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer
      title={bookmark ? "编辑网址" : "新增网址"}
      width={480}
      rootClassName="web-retention-drawer"
      open={open}
      onClose={onClose}
      destroyOnHidden
      footer={
        <Space className="web-retention-drawer-footer">
          <Button onClick={onClose}>取消</Button>
          <Button
            type="primary"
            loading={submitting}
            onClick={() => form.submit()}
          >
            {bookmark ? "保存修改" : "添加网址"}
          </Button>
        </Space>
      }
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark="optional"
        onFinish={handleSubmit}
      >
        <Form.Item
          name="title"
          label="网址名称"
          rules={[
            { required: true, whitespace: true, message: "请输入网址名称" },
            { max: 200, message: "网址名称不能超过 200 个字符" },
          ]}
        >
          <Input placeholder="例如：FastAPI" autoFocus />
        </Form.Item>

        <Form.Item
          name="url"
          label="网址"
          rules={[
            { required: true, whitespace: true, message: "请输入网址" },
            { type: "url", message: "请输入包含协议的完整网址" },
          ]}
        >
          <Input placeholder="https://example.com" inputMode="url" />
        </Form.Item>

        <Form.Item name="categoryId" label="所属分类">
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            placeholder="未分类"
            options={categoryOptions}
          />
        </Form.Item>

        <Form.Item
          name="description"
          label="简介"
          rules={[{ max: 500, message: "简介不能超过 500 个字符" }]}
        >
          <Input.TextArea
            rows={5}
            maxLength={500}
            showCount
            placeholder="可选"
          />
        </Form.Item>
      </Form>
    </Drawer>
  );
}
