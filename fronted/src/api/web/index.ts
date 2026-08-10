import { request } from "../../utils/request";
import type {
  Bookmark,
  BookmarkListParams,
  BookmarkPage,
  BookmarkPayload,
  Category,
  CategoryNode,
  CategoryPayload,
} from "./types";

export class WebApi {
  listCategories() {
    return request<CategoryNode[]>({
      url: "/web/categories",
      method: "GET",
    });
  }

  createCategory(payload: CategoryPayload) {
    return request<Category, CategoryPayload>({
      url: "/web/categories",
      method: "POST",
      data: payload,
    });
  }

  updateCategory(categoryId: number, payload: CategoryPayload) {
    return request<Category, CategoryPayload>({
      url: `/web/categories/${categoryId}`,
      method: "PUT",
      data: payload,
    });
  }

  deleteCategory(categoryId: number) {
    return request<void>({
      url: `/web/categories/${categoryId}`,
      method: "DELETE",
    });
  }

  listBookmarks(params: BookmarkListParams) {
    return request<BookmarkPage>({
      url: "/web/list",
      method: "GET",
      params,
    });
  }

  createBookmark(payload: BookmarkPayload) {
    return request<Bookmark, BookmarkPayload>({
      url: "/web/list",
      method: "POST",
      data: payload,
    });
  }

  updateBookmark(bookmarkId: number, payload: BookmarkPayload) {
    return request<Bookmark, BookmarkPayload>({
      url: `/web/list/${bookmarkId}`,
      method: "PUT",
      data: payload,
    });
  }

  deleteBookmark(bookmarkId: number) {
    return request<void>({
      url: `/web/list/${bookmarkId}`,
      method: "DELETE",
    });
  }
}

export const webApi = new WebApi();
