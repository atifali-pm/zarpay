import { Card, CardContent, CardHeader } from "@/components/ui/card";

function Bar({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-border ${className}`} />;
}

export default function DashboardLoading() {
  return (
    <div className="container-app py-10">
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <Bar className="h-10 w-64" />
          <Bar className="mt-3 h-4 w-80" />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Bar className="h-3 w-24" />
                <Bar className="mt-3 h-8 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <Bar className="h-5 w-40" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border border-border p-4">
                <div className="space-y-2">
                  <Bar className="h-3 w-24" />
                  <Bar className="h-4 w-40" />
                  <Bar className="h-3 w-16" />
                </div>
                <div className="space-y-2 text-right">
                  <Bar className="ml-auto h-4 w-20" />
                  <Bar className="ml-auto h-3 w-24" />
                  <Bar className="ml-auto h-5 w-16" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
