from pydantic import BaseModel, Field
from typing import Optional

class Box(BaseModel):
    lane: int
    pinIndex: Optional[int]
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