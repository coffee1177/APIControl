import {
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  MoreOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Button,
  Dropdown,
  Empty,
  Pagination,
  Skeleton,
  Space,
  Tag,
  Typography,
} from "antd";

import type { Bookmark } from "../../../api/web/types";

interface BookmarkListPaneProps {
  title: string;
  bookmarks: Bookmark[];
  loading: boolean;
  errorMessage: string | null;
  exporting: boolean;
  page: number;
  pageSize: number;
  total: number;
  onCreate: () => void;
  onEdit: (bookmark: Bookmark) => void;
  onDelete: (bookmark: Bookmark) => void;
  onExport: () => void;
  onReload: () => void;
  onPageChange: (page: number, pageSize: number) => void;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

export function BookmarkListPane({
  title,
  bookmarks,
  loading,
  errorMessage,
  exporting,
  page,
  pageSize,
  total,
  onCreate,
  onEdit,
  onDelete,
  onExport,
  onReload,
  onPageChange,
}: BookmarkListPaneProps) {
  return (
    <main className="web-retention-list-pane">
      <div className="web-retention-list-heading">
        <Typography.Title level={4}>{title}</Typography.Title>
        <Space size={8}>
          <Button
            icon={<DownloadOutlined />}
            loading={exporting}
            onClick={onExport}
          >
            导出 JSON
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>
            新增网址
          </Button>
        </Space>
      </div>

      <div className="web-retention-list-content">
        {errorMessage ? (
          <Alert
            type="error"
            showIcon
            message="网址加载失败"
            description={errorMessage}
            action={
              <Button size="small" onClick={onReload}>
                重新加载
              </Button>
            }
            className="web-retention-alert"
          />
        ) : loading ? (
          <div className="web-retention-loading" aria-label="正在加载网址">
            {Array.from({ length: 5 }, (_, index) => (
              <Skeleton
                key={index}
                active
                avatar={{ shape: "square" }}
                paragraph={{ rows: 2 }}
              />
            ))}
          </div>
        ) : bookmarks.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="还没有保存网址"
            className="web-retention-empty"
          >
            <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>
              新增网址
            </Button>
          </Empty>
        ) : (
          <div className="web-retention-list">
            {bookmarks.map((bookmark) => (
              <article className="web-retention-list-item" key={bookmark.id}>
                <div className="web-retention-link-content">
                  <a
                    href={bookmark.url}
                    target="_blank"
                    rel="noreferrer"
                    className="web-retention-link-title"
                  >
                    {bookmark.title}
                    <span className="web-retention-link-url-inline">
                      ({bookmark.url})
                    </span>
                  </a>
                  <Typography.Paragraph
                    type="secondary"
                    ellipsis={{ rows: 2 }}
                    className="web-retention-link-description"
                  >
                    {bookmark.description?.trim() || "暂无描述"}
                  </Typography.Paragraph>
                </div>
                <div className="web-retention-link-meta">
                  <Tag bordered={false}>
                    {bookmark.categoryName ?? "未分类"}
                  </Tag>
                  <time dateTime={bookmark.updatedAt}>
                    {formatDate(bookmark.updatedAt)}
                  </time>
                </div>
                <Dropdown
                  trigger={["click"]}
                  menu={{
                    items: [
                      { key: "edit", icon: <EditOutlined />, label: "编辑" },
                      {
                        key: "delete",
                        icon: <DeleteOutlined />,
                        label: "删除",
                        danger: true,
                      },
                    ],
                    onClick: ({ key }) => {
                      if (key === "edit") {
                        onEdit(bookmark);
                      } else {
                        onDelete(bookmark);
                      }
                    },
                  }}
                >
                  <Button
                    type="text"
                    icon={<MoreOutlined />}
                    aria-label={`管理网址 ${bookmark.title}`}
                  />
                </Dropdown>
              </article>
            ))}
          </div>
        )}
      </div>

      {!loading && !errorMessage && total > 0 && (
        <Pagination
          current={page}
          pageSize={pageSize}
          total={total}
          showSizeChanger
          pageSizeOptions={[10, 20, 50]}
          showTotal={(count) => `共 ${count} 条`}
          onChange={onPageChange}
          className="web-retention-pagination"
        />
      )}
    </main>
  );
}
