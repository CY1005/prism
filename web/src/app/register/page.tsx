import { RegisterForm } from "./register-form";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm space-y-6 rounded-lg border bg-white p-8 shadow-sm">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">注册 Prism</h1>
          <p className="text-sm text-gray-500">创建你的账号</p>
        </div>
        <RegisterForm />
      </div>
    </div>
  );
}
