from pydantic import BaseModel, Field
from typing import List, Union, Optional, Any
from datetime import datetime


class EventBase(BaseModel):
    id: str = Field(..., description="Event id.")
    calendarId: str = Field(..., description="Calendar id.")
    title: str = Field(..., description="Event title.")
    body: Optional[str] = Field(None, description="Body content of the event.")  # Optional로 변경
    isAllday: bool = Field(..., description="Whether the event is all day or not.")
    start: Union[str, datetime, int] = Field(..., description="Start time of the event.")
    end: Union[str, datetime, int] = Field(..., description="End time of the event.")
    goingDuration: Optional[int] = Field(None, description="Travel time which is taken to go in minutes.")
    comingDuration: Optional[int] = Field(None, description="Travel time which is taken to come back in minutes.")
    location: Optional[str] = Field(None, description="Location of the event.")
    attendees: Optional[List[str]] = Field(None, description="Attendees of the event.")
    category: Optional[str] = Field(None, description="Category of the event. Available categories are 'milestone', 'task', 'time' and 'allday'.")  # Optional로 변경
    dueDateClass: Optional[str] = Field(None, description="Classification of work events. (before work, before lunch, before work)")
    recurrenceRule: Optional[str] = Field(None, description="Recurrence rule of the event.")
    state: str = Field(..., description="State of the event. Available states are 'Busy', 'Free'.")
    isVisible: Optional[bool] = Field(None, description="Whether the event is visible or not.")  # Optional로 변경
    isPending: Optional[bool] = Field(None, description="Whether the event is pending or not.")  # Optional로 변경
    isFocused: Optional[bool] = Field(None, description="Whether the event is focused or not.")  # Optional로 변경
    isReadOnly: Optional[bool] = Field(None, description="Whether the event is read only or not.")  # Optional로 변경
    isPrivate: bool = Field(..., description="Whether the event is private or not.")
    color: Optional[str] = Field(None, description="Text color of the event.")
    backgroundColor: Optional[str] = Field(None, description="Background color of the event.")
    dragBackgroundColor: Optional[str] = Field(None, description="Background color of the event during dragging.")
    borderColor: Optional[str] = Field(None, description="Left border color of the event.")
    customStyle: Optional[dict] = Field(None, description="Custom style of the event. The key of CSS property should be camelCase (e.g. {'fontSize': '12px'})")
    raw: Optional[Any] = Field(None, description="Raw data of the event. it's an arbitrary property for anything.")


class EventCreate(EventBase):
    pass


class EventUpdate(EventBase):
    pass


class Event(EventBase):
    class Config:
        from_attributes = True

