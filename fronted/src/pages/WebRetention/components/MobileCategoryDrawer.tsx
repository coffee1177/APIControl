import { Drawer } from "antd";

import type { CategoryNode } from "../../../api/web/types";
import type { CategoryAction } from "./CategoryModal";
import { CategoryNavigation } from "./CategoryNavigation";

interface MobileCategoryDrawerProps {
  open: boolean;
  categories: CategoryNode[];
  selectedKey: string;
  onClose: () => void;
  onSelect: (key: string) => void;
  onCategoryAction: (action: CategoryAction) => void;
  onDeleteCategory: (category: CategoryNode) => void;
}

export function MobileCategoryDrawer({
  open,
  categories,
  selectedKey,
  onClose,
  onSelect,
  onCategoryAction,
  onDeleteCategory,
}: MobileCategoryDrawerProps) {
  return (
    <Drawer
      title="选择分类"
      placement="left"
      width={300}
      rootClassName="web-retention-drawer"
      open={open}
      onClose={onClose}
    >
      <CategoryNavigation
        categories={categories}
        selectedKey={selectedKey}
        onSelect={onSelect}
        onCategoryAction={(action) => {
          onClose();
          onCategoryAction(action);
        }}
        onDeleteCategory={(category) => {
          onClose();
          onDeleteCategory(category);
        }}
      />
    </Drawer>
  );
}
