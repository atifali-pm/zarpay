import { Card, CardContent, CardHeader } from "@/components/ui/card";

function Bar({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-border ${className}`} />;
}

export default function TransfersLoading() {
  return (
    <div className="container-app py-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <Bar className="h-10 w-48" />
        <Bar className="h-4 w-72" />

        <Card>
          <CardHeader>
            <Bar className="h-5 w-32" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border border-border p-4">
                <div className="space-y-2">
                  <Bar className="h-3 w-24" />
                  <Bar className="h-4 w-40" />
                  <Bar className="h-3 w-20" />
                </div>
                <div className="space-y-2 text-right">
                  <Bar className="ml-auto h-4 w-20" />
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
