export const settingsStrings = {
  myProjects: "\u6211\u7684\u9879\u76ee",
  projectName: "AI\u4e91\u5e73\u53f0\u7ade\u54c1\u5206\u6790",
  settings: "\u8bbe\u7f6e",
  basicInfo: "\u57fa\u672c\u4fe1\u606f",
  memberManagement: "\u6210\u5458\u7ba1\u7406",
  aiConfig: "AI\u914d\u7f6e",
  inviteMember: "\u9080\u8bf7\u6210\u5458",
  avatar: "\u5934\u50cf",
  username: "\u7528\u6237\u540d",
  email: "\u90ae\u7bb1",
  role: "\u89d2\u8272",
  action: "\u64cd\u4f5c",
  admin: "\u7ba1\u7406\u5458",
  editor: "\u7f16\u8f91\u8005",
  viewer: "\u67e5\u770b\u8005",
  editRole: "\u4fee\u6539\u89d2\u8272",
  remove: "\u79fb\u9664",
  aiProvider: "AI Provider",
  localMode: "\u672c\u5730\u6a21\u5f0f",
  saveConfig: "\u4fdd\u5b58\u914d\u7f6e",
  userName: "\u9648\u7396",
  userInitials: "\u9648",
}

export const settingsMembers = [
  { 
    name: "\u9648\u7396", 
    initials: "\u9648", 
    email: "cy@example.com", 
    role: "\u7ba1\u7406\u5458", 
    roleVariant: "default" as const, 
    canEdit: false 
  },
  { 
    name: "Mentor", 
    initials: "M", 
    email: "mentor@example.com", 
    role: "\u7f16\u8f91\u8005", 
    roleVariant: "green" as const, 
    canEdit: true 
  },
  { 
    name: "\u540c\u4e8bX", 
    initials: "X", 
    email: "colleague@example.com", 
    role: "\u67e5\u770b\u8005", 
    roleVariant: "secondary" as const, 
    canEdit: true 
  },
]
