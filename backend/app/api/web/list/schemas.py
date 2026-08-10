from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, model_validator


class BookmarkCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    url: HttpUrl
    description: str | None = Field(default=None, max_length=500)
    categoryId: int | None = None


class BookmarkUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    url: HttpUrl | None = None
    description: str | None = Field(default=None, max_length=500)
    categoryId: int | None = None

    @model_validator(mode="after")
    def validate_update_fields(self):
        if not self.model_fields_set:
            raise ValueError("至少需要提供一个修改字段")
        return self


class BookmarkRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    url: str
    description: str | None
    categoryId: int | None
    categoryName: str | None
    createdAt: datetime
    updatedAt: datetime


class BookmarkPage(BaseModel):
    items: list[BookmarkRead]
    page: int
    size: int
    total: int
