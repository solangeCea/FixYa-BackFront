from pydantic import BaseModel


class RegionResponse(BaseModel):
    id_region: int
    nombre_region: str

    class Config:
        from_attributes = True