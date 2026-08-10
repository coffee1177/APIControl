import type { PaginatedResponse } from "../../utils/request";

export interface Category {
  id: number;
  name: string;
  parentId: number | null;
  floor: number;
}

export interface CategoryNode extends Category {
  children: CategoryNode[];
}

export interface CategoryPayload {
  name: string;
  parentId?: number | null;
}

export interface Bookmark {
  id: number;
  title: string;
  url: string;
  description: string | null;
  categoryId: number | null;
  categoryName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BookmarkPayload {
  title: string;
  url: string;
  description?: string | null;
  categoryId?: number | null;
}

export interface BookmarkListParams {
  page?: number;
  size?: number;
  categoryId?: number;
  isAll?: boolean;
}

export type BookmarkPage = PaginatedResponse<Bookmark>;

export interface BookmarkExport {
  version: "1.0";
  exportedAt: string;
  categories: CategoryNode[];
  bookmarks: Bookmark[];
}
