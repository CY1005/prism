import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import bcrypt from "bcryptjs";
import {
  users,
  projects,
  dimensionTypes,
  projectDimensionConfigs,
  projectTemplates,
  projectMembers,
  nodes,
  dimensionRecords,
  versionRecords,
} from "./schema";

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client);

async function seed() {
  console.log("Seeding...");

  // ─── 0. Default User ───────────────────────────────────
  const passwordHash = await bcrypt.hash("admin123", 12);
  const [defaultUser] = await db
    .insert(users)
    .values({
      name: "CY",
      email: "cy@prism.dev",
      passwordHash,
      role: "platform_admin",
    })
    .returning();

  console.log(`  Created user: ${defaultUser.email} (password: admin123)`);

  // ─── 1. Dimension Types (12) ─────────────────────────
  const dims = await db
    .insert(dimensionTypes)
    .values([
      { key: "description", name: "功能描述", icon: "FileText", description: "功能的核心说明" },
      { key: "user_scenario", name: "用户场景", icon: "Users", description: "谁在什么场景下使用" },
      { key: "tech_impl", name: "技术实现", icon: "Server", description: "平台侧的技术方案" },
      { key: "design_decision", name: "设计决策", icon: "GitBranch", description: "关键架构决策及取舍" },
      { key: "engineering_exp", name: "工程经验", icon: "Lightbulb", description: "踩坑记录与最佳实践" },
      { key: "test_analysis", name: "测试分析", icon: "TestTube", description: "测试策略与问题记录" },
      { key: "requirement", name: "需求分析", icon: "ClipboardList", description: "需求拆解与影响范围" },
      { key: "competitor", name: "竞品参考", icon: "Building", description: "竞品功能对标分析" },
      { key: "api_spec", name: "接口规范", icon: "FileCode", description: "API接口与协议定义" },
      { key: "deployment", name: "部署配置", icon: "Server", description: "部署架构与运维配置" },
      { key: "quality_metric", name: "质量指标", icon: "BarChart3", description: "准确率、延迟等量化指标" },
      { key: "cost_analysis", name: "成本分析", icon: "DollarSign", description: "资源成本与ROI分析" },
      {
        key: "competitive_ref",
        name: "竞品对标",
        icon: "Target",
        description: "竞品功能详细对标参考",
        fieldSchema: {
          type: "object",
          properties: {
            competitorName: { type: "string", title: "竞品名称" },
            version: { type: "string", title: "版本号" },
            coverage: { type: "string", title: "覆盖范围" },
            techApproach: { type: "string", title: "技术方案" },
            pros: { type: "string", title: "优势" },
            cons: { type: "string", title: "劣势" },
          },
        },
      },
    ])
    .returning();

  const dimMap = Object.fromEntries(dims.map((d) => [d.key, d.id]));

  // ─── 2. Project Templates (4) ────────────────────────
  await db.insert(projectTemplates).values([
    {
      key: "product_analysis",
      name: "产品竞品分析",
      description: "适合分析竞品产品设计与技术实现",
      hierarchyLabels: ["产品线", "模块", "功能项"],
      dimensionKeys: ["description", "user_scenario", "tech_impl", "design_decision", "engineering_exp", "test_analysis", "requirement", "competitor"],
    },
    {
      key: "system_architecture",
      name: "系统架构项目",
      description: "适合记录系统设计与架构演进",
      hierarchyLabels: ["系统层", "组件", "功能"],
      dimensionKeys: ["description", "api_spec", "design_decision", "engineering_exp", "deployment", "test_analysis"],
    },
    {
      key: "research_platform",
      name: "开源项目研究",
      description: "适合研究和对标开源项目",
      hierarchyLabels: ["领域", "项目", "模块"],
      dimensionKeys: ["description", "user_scenario", "tech_impl", "design_decision", "engineering_exp", "competitive_ref", "test_analysis"],
    },
    {
      key: "custom",
      name: "自定义",
      description: "自由选择维度组合和层级名称",
      hierarchyLabels: ["层级1", "层级2", "层级3"],
      dimensionKeys: ["description", "design_decision", "engineering_exp"],
    },
  ]);

  // ─── 3. Project: AI云平台竞品分析 ────────────────────
  const [project] = await db
    .insert(projects)
    .values({
      name: "AI云平台竞品分析",
      description: "系统性分析AI云平台行业竞品设计与技术",
      templateType: "product_analysis",
      hierarchyLabels: ["产品线", "模块", "功能项"],
      versionMode: "release",
      createdBy: defaultUser.id,
    })
    .returning();

  // ─── 3.1 Project Member (creator = admin) ─────────────
  await db.insert(projectMembers).values({
    projectId: project.id,
    userId: defaultUser.id,
    role: "admin",
  });

  // ─── 4. Project Dimension Config (8 dims for product_analysis) ──
  const productDimKeys = ["description", "user_scenario", "tech_impl", "design_decision", "engineering_exp", "test_analysis", "requirement", "competitor"];
  await db.insert(projectDimensionConfigs).values(
    productDimKeys.map((key, i) => ({
      projectId: project.id,
      dimensionTypeId: dimMap[key],
      enabled: true,
      sortOrder: i,
    }))
  );

  // ─── 5. Node Tree ────────────────────────────────────
  const [privateCloud] = await db.insert(nodes).values({
    projectId: project.id, name: "私有云", type: "folder", depth: 0, sortOrder: 0, path: "",
    createdBy: defaultUser.id,
  }).returning();

  const [smartComputing] = await db.insert(nodes).values({
    projectId: project.id, name: "智算中心", type: "folder", depth: 0, sortOrder: 1, path: "",
    createdBy: defaultUser.id,
  }).returning();

  const [inferenceService] = await db.insert(nodes).values({
    projectId: project.id, parentId: privateCloud.id, name: "推理服务", type: "folder", depth: 1, sortOrder: 0, path: privateCloud.id,
    createdBy: defaultUser.id,
  }).returning();

  const [trainingService] = await db.insert(nodes).values({
    projectId: project.id, parentId: privateCloud.id, name: "训练服务", type: "folder", depth: 1, sortOrder: 1, path: privateCloud.id,
    createdBy: defaultUser.id,
  }).returning();

  const [createInference] = await db.insert(nodes).values({
    projectId: project.id, parentId: inferenceService.id, name: "创建推理服务", type: "file", depth: 2, sortOrder: 0,
    path: `${privateCloud.id}/${inferenceService.id}`,
    createdBy: defaultUser.id,
  }).returning();

  await db.insert(nodes).values({
    projectId: project.id, parentId: inferenceService.id, name: "自动扩缩容", type: "file", depth: 2, sortOrder: 1,
    path: `${privateCloud.id}/${inferenceService.id}`,
    createdBy: defaultUser.id,
  });

  await db.insert(nodes).values({
    projectId: project.id, parentId: inferenceService.id, name: "拼卡管理", type: "file", depth: 2, sortOrder: 2,
    path: `${privateCloud.id}/${inferenceService.id}`,
    createdBy: defaultUser.id,
  });

  await db.insert(nodes).values({
    projectId: project.id, parentId: trainingService.id, name: "提交训练任务", type: "file", depth: 2, sortOrder: 0,
    path: `${privateCloud.id}/${trainingService.id}`,
    createdBy: defaultUser.id,
  });

  await db.insert(nodes).values({
    projectId: project.id, parentId: trainingService.id, name: "训练监控", type: "file", depth: 2, sortOrder: 1,
    path: `${privateCloud.id}/${trainingService.id}`,
    createdBy: defaultUser.id,
  });

  const [smartInference] = await db.insert(nodes).values({
    projectId: project.id, parentId: smartComputing.id, name: "推理服务", type: "folder", depth: 1, sortOrder: 0, path: smartComputing.id,
    createdBy: defaultUser.id,
  }).returning();

  await db.insert(nodes).values({
    projectId: project.id, parentId: smartInference.id, name: "创建推理服务", type: "file", depth: 2, sortOrder: 0,
    path: `${smartComputing.id}/${smartInference.id}`,
    createdBy: defaultUser.id,
  });

  // ─── 6. Dimension Records for "创建推理服务" ─────────
  await db.insert(dimensionRecords).values([
    {
      nodeId: createInference.id,
      dimensionTypeId: dimMap.description,
      content: {
        text: "支持按需选择 CPU、GPU 物理卡、GPU 虚拟卡三类资源配置任务。用户可根据实例规格卡上的资源量提示直接选择，也可由运维管理员在规格管理中自定义配置。",
      },
      createdBy: defaultUser.id,
    },
    {
      nodeId: createInference.id,
      dimensionTypeId: dimMap.user_scenario,
      content: {
        scenarios: [
          { role: "算法工程师", scenario: "提交训练任务时选择 GPU 类型和数量", techStack: ["PyTorch", "TensorFlow"] },
          { role: "运维管理员", scenario: "配置默认资源配额和实例规格", techStack: ["平台管理控制台"] },
        ],
      },
      createdBy: defaultUser.id,
    },
    {
      nodeId: createInference.id,
      dimensionTypeId: dimMap.tech_impl,
      content: {
        entries: [
          { title: "GPU 调度机制", text: "GPU 调度基于 Kubernetes device plugin，支持 NVIDIA / 华为昇腾 / 海光 DCU / 寒武纪 MLU", tags: ["Kubernetes", "Device Plugin", "多厂商支持"] },
          { title: "虚拟 GPU 实现", text: "虚拟 GPU 通过 GPU 共享调度器实现，支持显存隔离", tags: ["vGPU", "显存隔离"] },
        ],
        referenceStandards: "Volcano (CNCF孵化·华为主导) · KServe (K8s模型serving标准)",
      },
      createdBy: defaultUser.id,
    },
    {
      nodeId: createInference.id,
      dimensionTypeId: dimMap.design_decision,
      content: {
        context: "需要同时支持物理卡和虚拟卡的资源分配",
        decision: "统一资源模型，通过 type 字段区分物理卡/虚拟卡",
        alternatives: "物理卡和虚拟卡分成两套模型（否决原因：重复逻辑太多）",
        consequences: "API 更简洁，但需要按类型做差异化校验",
      },
      createdBy: defaultUser.id,
    },
    {
      nodeId: createInference.id,
      dimensionTypeId: dimMap.engineering_exp,
      content: {
        title: "NUMA 亲和性问题",
        text: "拼卡后推理延迟反而增大。根因：跨 NUMA 节点的显存访问。修复：调度器增加 NUMA 拓扑感知。",
        tags: ["踩坑", "GPU", "性能"],
      },
      createdBy: defaultUser.id,
    },
  ]);

  // ─── 7. Version Records ──────────────────────────────
  const [currentVersion] = await db.insert(versionRecords).values([
    { nodeId: createInference.id, versionLabel: "v3.9.3", summary: "新增拼卡能力，支持多卡虚拟化共享", details: "本版本重点优化了多GPU场景下的资源利用效率，支持将单张物理GPU虚拟化为多个vGPU实例。" },
  ]).returning();

  await db.insert(versionRecords).values([
    { nodeId: createInference.id, versionLabel: "v3.7", summary: "新增自动扩缩容，支持定时策略", details: "引入基于HPA的自动扩缩容能力。" },
    { nodeId: createInference.id, versionLabel: "v1.6", summary: "首次上线：基础 GPU 类型选择", details: "产品首个正式版本，支持NVIDIA GPU的基础调度能力。" },
  ]);

  // Set current version via nodes.currentVersionId
  await db.update(nodes).set({ currentVersionId: currentVersion.id }).where(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (await import("drizzle-orm")).eq(nodes.id, createInference.id) as any
  );

  console.log("Seed complete!");
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
