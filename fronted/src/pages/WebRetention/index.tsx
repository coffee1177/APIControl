import { useCallback, useEffect, useMemo, useState } from "react";
import { FilterOutlined } from "@ant-design/icons";
import { App as AntApp, Button, Grid, Space, Typography } from "antd";

import { webApi } from "../../api/web";
import type {
  Bookmark,
  BookmarkExport,
  CategoryNode,
} from "../../api/web/types";
import { RequestError } from "../../utils/request";
import {
  ALL_CATEGORY_KEY,
  BookmarkDrawer,
  BookmarkListPane,
  CategoryNavigation,
  CategoryModal,
  getCategoryId,
  MobileCategoryDrawer,
  type CategoryAction,
  UNCATEGORIZED_KEY,
} from "./components";
import "./index.css";

function flattenCategories(categories: CategoryNode[]): CategoryNode[] {
  return categories.flatMap((category) => [category, ...category.children]);
}

function WebRetentionContent() {
  const { message, modal } = AntApp.useApp();
  const screens = Grid.useBreakpoint();
  const isCompact = !screens.lg;
  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [selectedKey, setSelectedKey] = useState(ALL_CATEGORY_KEY);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [bookmarkDrawerOpen, setBookmarkDrawerOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [categoryAction, setCategoryAction] = useState<CategoryAction | null>(
    null,
  );
  const [mobileCategoryOpen, setMobileCategoryOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const flatCategories = useMemo(
    () => flattenCategories(categories),
    [categories],
  );

  const selectedLabel = useMemo(() => {
    if (selectedKey === ALL_CATEGORY_KEY) {
      return "全部网址";
    }
    if (selectedKey === UNCATEGORIZED_KEY) {
      return "未分类";
    }
    const selectedCategoryId = getCategoryId(selectedKey);
    return (
      flatCategories.find((category) => category.id === selectedCategoryId)
        ?.name ?? "网址"
    );
  }, [flatCategories, selectedKey]);

  const loadCategories = useCallback(async () => {
    try {
      const result = await webApi.listCategories();
      setCategories(result);
    } catch (error) {
      message.error(
        error instanceof RequestError
          ? error.message
          : "分类加载失败，请稍后重试",
      );
    }
  }, [message]);

  const loadBookmarks = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const result = await webApi.listBookmarks({
        page,
        size: pageSize,
        categoryId: getCategoryId(selectedKey),
        isAll: selectedKey === ALL_CATEGORY_KEY,
      });
      setBookmarks(result.items);
      setTotal(result.total);
    } catch (error) {
      setErrorMessage(
        error instanceof RequestError
          ? error.message
          : "网址加载失败，请稍后重试",
      );
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, selectedKey]);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    void loadBookmarks();
  }, [loadBookmarks]);

  const selectCategory = (key: string) => {
    setSelectedKey(key);
    setPage(1);
    setMobileCategoryOpen(false);
  };

  const openCreateBookmark = () => {
    setEditingBookmark(null);
    setBookmarkDrawerOpen(true);
  };

  const openEditBookmark = (bookmark: Bookmark) => {
    setEditingBookmark(bookmark);
    setBookmarkDrawerOpen(true);
  };

  const handleCategoriesChanged = async (deletedCategoryId?: number) => {
    const deletedSelectedCategory = Boolean(
      deletedCategoryId && getCategoryId(selectedKey) === deletedCategoryId,
    );
    if (deletedSelectedCategory) {
      setSelectedKey(ALL_CATEGORY_KEY);
      setPage(1);
    }
    await loadCategories();
    if (!deletedSelectedCategory) {
      await loadBookmarks();
    }
  };

  const handleDeleteBookmark = (bookmark: Bookmark) => {
    modal.confirm({
      title: `删除“${bookmark.title}”？`,
      content: "删除后无法恢复。",
      okText: "删除",
      okButtonProps: { danger: true },
      cancelText: "取消",
      async onOk() {
        try {
          await webApi.deleteBookmark(bookmark.id);
          message.success("网址已删除");
          if (bookmarks.length === 1 && page > 1) {
            setPage((currentPage) => currentPage - 1);
          } else {
            await loadBookmarks();
          }
        } catch (error) {
          message.error(
            error instanceof RequestError
              ? error.message
              : "删除失败，请稍后重试",
          );
          throw error;
        }
      },
    });
  };

  const handleDeleteCategory = (category: CategoryNode) => {
    setMobileCategoryOpen(false);
    modal.confirm({
      title: `删除“${category.name}”？`,
      content: "仅空分类可以删除，此操作无法撤销。",
      okText: "删除",
      okButtonProps: { danger: true },
      cancelText: "取消",
      async onOk() {
        try {
          await webApi.deleteCategory(category.id);
          message.success("分类已删除");
          await handleCategoriesChanged(category.id);
        } catch (error) {
          message.error(
            error instanceof RequestError
              ? error.message
              : "删除失败，请稍后重试",
          );
          throw error;
        }
      },
    });
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const exportCategories = await webApi.listCategories();
      const allBookmarks: Bookmark[] = [];
      let exportPage = 1;
      let exportTotal = 0;

      do {
        const result = await webApi.listBookmarks({
          page: exportPage,
          size: 100,
          isAll: true,
        });
        allBookmarks.push(...result.items);
        exportTotal = result.total;
        exportPage += 1;
      } while (allBookmarks.length < exportTotal);

      const data: BookmarkExport = {
        version: "1.0",
        exportedAt: new Date().toISOString(),
        categories: exportCategories,
        bookmarks: allBookmarks,
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json;charset=utf-8",
      });
      const downloadUrl = URL.createObjectURL(blob);
      const downloadLink = document.createElement("a");
      downloadLink.href = downloadUrl;
      downloadLink.download = `apicontrol-web-${new Date().toISOString().slice(0, 10)}.json`;
      downloadLink.click();
      URL.revokeObjectURL(downloadUrl);
      message.success(`已导出 ${allBookmarks.length} 个网址`);
    } catch (error) {
      message.error(
        error instanceof RequestError ? error.message : "导出失败，请稍后重试",
      );
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="web-retention-page">
      <header className="web-retention-page-header">
        <Typography.Title level={2}>网址库</Typography.Title>
        {isCompact && (
          <Space wrap className="web-retention-page-actions">
            <Button
              icon={<FilterOutlined />}
              onClick={() => setMobileCategoryOpen(true)}
            >
              分类
            </Button>
          </Space>
        )}
      </header>

      <div className="web-retention-workspace">
        {!isCompact && (
          <aside className="web-retention-category-pane">
            <CategoryNavigation
              categories={categories}
              selectedKey={selectedKey}
              onSelect={selectCategory}
              onCategoryAction={setCategoryAction}
              onDeleteCategory={handleDeleteCategory}
            />
          </aside>
        )}

        <BookmarkListPane
          title={selectedLabel}
          bookmarks={bookmarks}
          loading={loading}
          errorMessage={errorMessage}
          exporting={exporting}
          page={page}
          pageSize={pageSize}
          total={total}
          onCreate={openCreateBookmark}
          onEdit={openEditBookmark}
          onDelete={handleDeleteBookmark}
          onExport={() => void handleExport()}
          onReload={() => void loadBookmarks()}
          onPageChange={(nextPage, nextPageSize) => {
            setPage(nextPageSize === pageSize ? nextPage : 1);
            setPageSize(nextPageSize);
          }}
        />
      </div>

      <MobileCategoryDrawer
        open={mobileCategoryOpen}
        categories={categories}
        selectedKey={selectedKey}
        onClose={() => setMobileCategoryOpen(false)}
        onSelect={selectCategory}
        onCategoryAction={setCategoryAction}
        onDeleteCategory={handleDeleteCategory}
      />

      <BookmarkDrawer
        open={bookmarkDrawerOpen}
        bookmark={editingBookmark}
        categories={categories}
        defaultCategoryId={getCategoryId(selectedKey)}
        onClose={() => setBookmarkDrawerOpen(false)}
        onSaved={() => void loadBookmarks()}
      />

      <CategoryModal
        action={categoryAction}
        onClose={() => setCategoryAction(null)}
        onChanged={() => void handleCategoriesChanged()}
      />
    </div>
  );
}

export function WebRetention() {
  return (
    <AntApp component={false}>
      <WebRetentionContent />
    </AntApp>
  );
}
