from pydantic import BaseModel


class ComunaResponse(BaseModel):
    id_comuna: int
    nombre_comuna: str
    region_id_region: int

    class Config:
        from_attributes = True