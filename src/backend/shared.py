from pydantic import BaseModel, Field

class Box(BaseModel):
    lane: int
    x: float
    y: float
    w: float
    h: float

class Boxes(BaseModel):
    sum: list[Box] = Field(default_factory=list)
    laneSum: list[Box] = Field(default_factory=list)
    throws: list[Box] = Field(default_factory=list)
    fallenPins: list[Box] = Field(default_factory=list)
    time: list[Box] = Field(default_factory=list)
    pins: list[Box] = Field(default_factory=list)