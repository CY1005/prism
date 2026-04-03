export const detailStrings = {
  myProjects: "\u6211\u7684\u9879\u76ee",
  projectName: "AI\u4e91\u5e73\u53f0\u7ade\u54c1\u5206\u6790",
  searchPlaceholder: "\u641c\u7d22\u529f\u80fd\u3001\u6a21\u5757\u3001\u7ade\u54c1...",
  userName: "\u9648\u7396",
  userInitials: "\u9648",
  productLine: "\u4ea7\u54c1\u7ebf",
  modules: "\u529f\u80fd\u6a21\u5757",
  features: "\u529f\u80fd\u9879",
  avgCompletion: "\u5e73\u5747\u5b8c\u5584\u5ea6",
  recentUpdates: "\u6700\u8fd1\u66f4\u65b0",
}

export const productLines = [
  {
    name: "\u79c1\u6709\u4e91",
    completion: 85,
    modules: [
      { name: "\u63a8\u7406\u670d\u52a1", completion: 90 },
      { name: "\u8bad\u7ec3\u670d\u52a1", completion: 75 },
      { name: "\u8fd0\u7ef4\u7ba1\u7406", completion: 85 },
      { name: "\u8d44\u6e90\u7ba1\u7406", completion: 80 },
    ],
  },
  {
    name: "\u667a\u7b97\u4e2d\u5fc3",
    completion: 55,
    modules: [
      { name: "\u63a8\u7406\u670d\u52a1", completion: 60 },
      { name: "\u8bad\u7ec3\u670d\u52a1", completion: 45 },
    ],
  },
  {
    name: "\u8fb9\u7f18\u8ba1\u7b97",
    completion: 30,
    modules: [{ name: "\u8fb9\u7f18\u63a8\u7406", completion: 30 }],
  },
]

export const recentUpdates = [
  {
    user: "\u9648",
    action: "\u66f4\u65b0\u4e86 \u63a8\u7406\u670d\u52a1>\u521b\u5efa\u63a8\u7406\u670d\u52a1 \u7684\u6280\u672f\u5b9e\u73b0",
    time: "2\u5c0f\u65f6\u524d",
  },
  {
    user: "\u738b",
    action: "\u6dfb\u52a0\u4e86 \u8bad\u7ec3\u670d\u52a1>\u63d0\u4ea4\u8bad\u7ec3\u4efb\u52a1 \u7684\u7528\u6237\u573a\u666f",
    time: "4\u5c0f\u65f6\u524d",
  },
  {
    user: "\u674e",
    action: "\u4fee\u6539\u4e86 \u8d44\u6e90\u7ba1\u7406>\u914d\u989d\u7ba1\u7406 \u7684\u8bbe\u8ba1\u51b3\u7b56",
    time: "\u6628\u5929",
  },
  {
    user: "\u9648",
    action: "\u65b0\u589e\u4e86 \u63a8\u7406\u670d\u52a1>\u81ea\u52a8\u6269\u7f29\u5bb9 \u7684\u5de5\u7a0b\u7ecf\u9a8c",
    time: "2\u5929\u524d",
  },
  {
    user: "\u5f20",
    action: "\u5b8c\u5584\u4e86 \u667a\u7b97\u4e2d\u5fc3>\u63a8\u7406\u670d\u52a1 \u7684\u529f\u80fd\u63cf\u8ff0",
    time: "3\u5929\u524d",
  },
]

export const statsLabels = {
  line1: "3 \u6761",
  line2: "42 \u4e2a",
  line3: "128 \u4e2a",
  line4: "58%",
}
