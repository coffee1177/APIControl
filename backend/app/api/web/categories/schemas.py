from pydantic import BaseModel, ConfigDict, Field, model_validator


class CategoryCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    parentId: int | None = None


class CategoryUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    parentId: int | None = None

    @model_validator(mode="after")
    def validate_update_fields(self):
        if not self.model_fields_set:
            raise ValueError("至少需要提供一个修改字段")
        return self


class CategoryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    parentId: int | None
    floor: int


class CategoryNode(CategoryRead):
    children: list["CategoryNode"] = Field(default_factory=list)
