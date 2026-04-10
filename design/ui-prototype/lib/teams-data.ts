export interface Team {
  id: string
  name: string
  role: "管理员" | "成员"
  description: string
  projects: number
  members: number
  created: string
  avatar: string
}

export const teamsData: Team[] = [
  { id: "1", name: "AI 平台组", role: "管理员", description: "AI 云平台产品研发团队", projects: 2, members: 4, created: "2026-03-01", avatar: "AI" },
  { id: "2", name: "个人空间", role: "管理员", description: "个人项目默认团队", projects: 2, members: 1, created: "2026-02-15", avatar: "个" },
  { id: "3", name: "质量工程部", role: "成员", description: "质量工程与测试方法研究", projects: 3, members: 8, created: "2026-01-10", avatar: "质" },
]

export interface TeamMember {
  name: string
  email: string
  role: "团队管理员" | "团队成员"
  projects: number
  isCreator: boolean
}

export const teamMembersData: TeamMember[] = [
  { name: "陈玥", email: "cy@example.com", role: "团队管理员", projects: 2, isCreator: true },
  { name: "王工", email: "wang@example.com", role: "团队成员", projects: 2, isCreator: false },
  { name: "李工", email: "li@example.com", role: "团队成员", projects: 1, isCreator: false },
  { name: "张工", email: "zhang@example.com", role: "团队成员", projects: 1, isCreator: false },
]

export interface TeamProject {
  id: string
  name: string
  type: string
  typeColor: string
  creator: string
  created: string
  completion: number
}

export const teamProjectsData: TeamProject[] = [
  { id: "1", name: "AI云平台竞品分析", type: "产品分析", typeColor: "blue", creator: "陈玥", created: "2026-03-01", completion: 58 },
  { id: "2", name: "OpenClaw", type: "系统架构", typeColor: "green", creator: "陈玥", created: "2026-02-15", completion: 45 },
]
