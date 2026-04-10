// 错误严重程度
export type ErrorSeverity = 'blocking' | 'warning' | 'info';

// 应用错误类
export class AppError extends Error {
  constructor(
    message: string,
    public severity: ErrorSeverity,
    public code: string,
    public statusCode: number = 400,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// 预定义错误
export const Errors = {
  // 认证 (blocking)
  UNAUTHORIZED: new AppError('请先登录', 'blocking', 'UNAUTHORIZED', 401),
  FORBIDDEN: new AppError('无权限执行此操作', 'blocking', 'FORBIDDEN', 403),
  ACCOUNT_DISABLED: new AppError('账号已被禁用，请联系管理员', 'blocking', 'ACCOUNT_DISABLED', 403),
  ACCOUNT_LOCKED: new AppError('账号已锁定，请稍后重试', 'blocking', 'ACCOUNT_LOCKED', 423),

  // 数据冲突 (blocking)
  VERSION_CONFLICT: new AppError('内容已被他人修改，请刷新后重试', 'blocking', 'VERSION_CONFLICT', 409),
  DUPLICATE_ENTRY: new AppError('数据已存在', 'blocking', 'DUPLICATE_ENTRY', 409),

  // 业务校验 (blocking)
  VALIDATION_ERROR: (msg: string) => new AppError(msg, 'blocking', 'VALIDATION_ERROR', 400),
  NOT_FOUND: (resource: string) => new AppError(`${resource}不存在`, 'blocking', 'NOT_FOUND', 404),

  // 外部服务 (warning)
  AI_SERVICE_UNAVAILABLE: new AppError('AI分析服务暂时不可用，请稍后重试', 'warning', 'AI_UNAVAILABLE', 503),
  AI_TIMEOUT: new AppError('AI分析超时，请稍后重试', 'warning', 'AI_TIMEOUT', 504),
  NETWORK_ERROR: new AppError('网络连接失败，请检查网络', 'warning', 'NETWORK_ERROR', 503),

  // 操作结果 (info) — 用于成功提示等
  SAVE_SUCCESS: new AppError('保存成功', 'info', 'SAVE_SUCCESS', 200),
};

// Server Action 统一返回类型
export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; code: string; severity: ErrorSeverity };

// 包装 Server Action 的错误处理
export function actionError(error: unknown): ActionResult<never> {
  if (error instanceof AppError) {
    return { success: false, error: error.message, code: error.code, severity: error.severity };
  }
  console.error('Unexpected error:', error);
  return { success: false, error: '操作失败，请重试', code: 'INTERNAL_ERROR', severity: 'warning' };
}

export function actionSuccess<T>(data: T): ActionResult<T> {
  return { success: true, data };
}
