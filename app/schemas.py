from pydantic import BaseModel


class UserRegister(BaseModel):
    name: str
    email: str
    password: str
    role: str = "student"
    department: str | None = None
    profile_image: str | None = None


class UserLogin(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    name: str
    email: str
    role: str
    department: str | None = None
    profile_image: str | None = None


class UserProfileUpdate(BaseModel):
    name: str
    department: str | None = None
    profile_image: str | None = None


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class IssueCreate(BaseModel):
    title: str
    description: str
    category: str | None = None
    location: str | None = None


class IssueStatusUpdate(BaseModel):
    status: str

class IssueResponse(BaseModel):
    id: int
    title: str
    description: str
    category: str
    department: str
    location: str
    reported_by_name: str
    reported_by_email: str
    reported_by_role: str
    status: str
    report_count: int
    priority: str
    immediate_action: bool

    class Config:
        from_attributes = True


class DashboardStats(BaseModel):
    total: int
    open: int
    urgent: int
    resolved: int


class DashboardResponse(BaseModel):
    role: str
    department: str | None = None
    stats: DashboardStats
    issues: list[IssueResponse]
