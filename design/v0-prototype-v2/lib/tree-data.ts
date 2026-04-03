import type { TreeNode } from "@/components/feature-tree"

export const treeData: TreeNode[] = [
  {
    id: "private-cloud",
    name: "\u79c1\u6709\u4e91",
    type: "folder",
    completionPercent: 75,
    children: [
      {
        id: "inference-service",
        name: "\u63a8\u7406\u670d\u52a1",
        type: "folder",
        completionPercent: 85,
        children: [
          {
            id: "create-inference",
            name: "\u521b\u5efa\u63a8\u7406\u670d\u52a1",
            type: "file",
            completionPercent: 62,
          },
          {
            id: "auto-scaling",
            name: "\u81ea\u52a8\u6269\u7f29\u5bb9",
            type: "file",
            completionPercent: 90,
          },
          {
            id: "card-management",
            name: "\u62fc\u5361\u7ba1\u7406",
            type: "file",
            completionPercent: 45,
          },
        ],
      },
      {
        id: "training-service",
        name: "\u8bad\u7ec3\u670d\u52a1",
        type: "folder",
        completionPercent: 60,
        children: [
          {
            id: "submit-training",
            name: "\u63d0\u4ea4\u8bad\u7ec3\u4efb\u52a1",
            type: "file",
            completionPercent: 70,
          },
          {
            id: "training-monitor",
            name: "\u8bad\u7ec3\u76d1\u63a7",
            type: "file",
            completionPercent: 35,
          },
        ],
      },
    ],
  },
  {
    id: "smart-computing",
    name: "\u667a\u7b97\u4e2d\u5fc3",
    type: "folder",
    completionPercent: 50,
    children: [
      {
        id: "smart-inference",
        name: "\u63a8\u7406\u670d\u52a1",
        type: "folder",
        completionPercent: 50,
        children: [
          {
            id: "smart-create-inference",
            name: "\u521b\u5efa\u63a8\u7406\u670d\u52a1",
            type: "file",
            completionPercent: 50,
          },
        ],
      },
    ],
  },
]
