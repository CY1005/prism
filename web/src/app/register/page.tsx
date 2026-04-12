import { RegisterForm } from "./register-form";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="space-y-1 pb-4">
            <h1 className="text-2xl font-bold text-foreground">Prism</h1>
            <p className="text-sm text-muted-foreground">创建你的账号</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Separator />
            <RegisterForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
