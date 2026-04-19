import { Card, CardContent, CardHeader } from "@/components/ui/card";

function Bar({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-border ${className}`} />;
}

export default function TransferDetailLoading() {
  return (
    <div className="container-app py-10">
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <Bar className="h-4 w-32" />
          <div className="mt-2 flex items-center gap-3">
            <Bar className="h-10 w-44" />
            <Bar className="h-7 w-24" />
          </div>
          <div className="mt-3 flex gap-2">
            <Bar className="h-8 w-32" />
          </div>
        </div>

        <Card>
          <CardHeader>
            <Bar className="h-5 w-24" />
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Bar className="h-3 w-20" />
              <Bar className="h-8 w-32" />
            </div>
            <div className="space-y-2">
              <Bar className="h-3 w-24" />
              <Bar className="h-8 w-36" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Bar className="h-5 w-28" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <Bar className="h-4 w-40" />
                <Bar className="h-3 w-28" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
