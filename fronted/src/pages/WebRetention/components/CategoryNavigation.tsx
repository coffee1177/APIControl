import { useMemo, useState } from "react";
import {
  AppstoreOutlined,
  DeleteOutlined,
  EditOutlined,
  FolderOpenOutlined,
  InboxOutlined,
  MoreOutlined,
  PlusOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { Button, Dropdown, Input, Tree } from "antd";
import type { DataNode } from "antd/es/tree";

import type { CategoryNode } from "../../../api/web/types";
import type { CategoryAction } from "./CategoryModal";

export const ALL_CATEGORY_KEY = "all";
export const UNCATEGORIZED_KEY = "uncategorized";
const CATEGORY_PREFIX = "category-";

export interface CategoryNavigationProps {
  categories: CategoryNode[];
  selectedKey: string;
  onSelect: (key: string) => void;
  onCategoryAction: (action: CategoryAction) => void;
  onDeleteCategory: (category: CategoryNode) => void;
}

function getCategoryKey(categoryId: number) {
  return `${CATEGORY_PREFIX}${categoryId}`;
}

export function getCategoryId(key: string) {
  return key.startsWith(CATEGORY_PREFIX)
    ? Number(key.slice(CATEGORY_PREFIX.length))
    : undefined;
}

export function CategoryNavigation({
  categories,
  selectedKey,
  onSelect,
  onCategoryAction,
  onDeleteCategory,
}: CategoryNavigationProps) {
  const [searchValue, setSearchValue] = useState("");
  const filteredCategories = useMemo(() => {
    const keyword = searchValue.trim().toLocaleLowerCase();
    if (!keyword) {
      return categories;
    }

    return categories.flatMap((category) => {
      const parentMatched = category.name.toLocaleLowerCase().includes(keyword);
      const children = parentMatched
        ? category.children
        : category.children.filter((child) =>
            child.name.toLocaleLowerCase().includes(keyword),
          );

      return parentMatched || children.length > 0
        ? [{ ...category, children }]
        : [];
    });
  }, [categories, searchValue]);

  const createCategoryTitle = (category: CategoryNode) => (
    <div className="web-retention-tree-title">
      <span>{category.name}</span>
      <Dropdown
        trigger={["click"]}
        menu={{
          items: [
            ...(category.floor === 1
              ? [
                  {
                    key: "child",
                    icon: <PlusOutlined />,
                    label: "新增子分类",
                  },
                ]
              : []),
            { key: "rename", icon: <EditOutlined />, label: "重命名" },
            {
              key: "delete",
              icon: <DeleteOutlined />,
              label: "删除",
              danger: true,
            },
          ],
          onClick: ({ key, domEvent }) => {
            domEvent.stopPropagation();
            if (key === "child") {
              onCategoryAction({
                mode: "create",
                parentId: category.id,
                parentName: category.name,
              });
            } else if (key === "rename") {
              onCategoryAction({
                mode: "rename",
                category,
                parentId: category.parentId,
              });
            } else {
              onDeleteCategory(category);
            }
          },
        }}
      >
        <Button
          type="text"
          size="small"
          icon={<MoreOutlined />}
          aria-label={`管理分类 ${category.name}`}
          onClick={(event) => event.stopPropagation()}
        />
      </Dropdown>
    </div>
  );

  const treeData = useMemo<DataNode[]>(
    () =>
      filteredCategories.map((category) => ({
        key: getCategoryKey(category.id),
        title: createCategoryTitle(category),
        icon: <FolderOpenOutlined />,
        children: category.children.map((child) => ({
          key: getCategoryKey(child.id),
          title: createCategoryTitle(child),
        })),
      })),
    [filteredCategories, onCategoryAction, onDeleteCategory],
  );

  return (
    <nav className="web-retention-category-nav" aria-label="网址分类">
      <div className="web-retention-category-tools">
        <Input
          allowClear
          aria-label="搜索分类"
          prefix={<SearchOutlined />}
          placeholder="搜索分类"
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
        />
        <Button
          block
          icon={<PlusOutlined />}
          className="web-retention-create-category"
          onClick={() =>
            onCategoryAction({ mode: "create", parentId: null })
          }
        >
          新增分类
        </Button>
      </div>

      <div className="web-retention-category-label">总览</div>
      <Button
        type="text"
        block
        icon={<AppstoreOutlined />}
        className={selectedKey === ALL_CATEGORY_KEY ? "is-selected" : undefined}
        onClick={() => onSelect(ALL_CATEGORY_KEY)}
      >
        全部网址
      </Button>
      <Button
        type="text"
        block
        icon={<InboxOutlined />}
        className={selectedKey === UNCATEGORIZED_KEY ? "is-selected" : undefined}
        onClick={() => onSelect(UNCATEGORIZED_KEY)}
      >
        未分类
      </Button>

      <div className="web-retention-category-label">分类</div>
      {treeData.length > 0 ? (
        <Tree
          key={searchValue.trim().toLocaleLowerCase()}
          blockNode
          defaultExpandAll
          showLine={{ showLeafIcon: false }}
          selectedKeys={[selectedKey]}
          treeData={treeData}
          onSelect={(keys) => {
            const key = keys[0];
            if (key) {
              onSelect(String(key));
            }
          }}
        />
      ) : (
        <div className="web-retention-category-empty">
          {searchValue.trim() ? "未找到匹配分类" : "暂无分类"}
        </div>
      )}
    </nav>
  );
}
