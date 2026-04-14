import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { getMidRate, getDefaultSpreadBps } from "@/lib/fx";
import { formatDateTime } from "@/lib/format";
import { refreshRateAction, setManualRateAction } from "./actions";

export default async function RatesPage() {
  const [fx, history] = await Promise.all([
    getMidRate("GBP", "PKR"),
    prisma.exchangeRate.findMany({
      where: { base: "GBP", quote: "PKR" },
      orderBy: { effectiveAt: "desc" },
      take: 20,
    }),
  ]);

  const defaultSpread = getDefaultSpreadBps();

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-display-lg font-display font-bold">Rate management</h1>
        <p className="text-body text-text-500">GBP / PKR mid-market rate and applied spread.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Live mid-market</CardTitle>
            <CardDescription>From {fx.source}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-display-xl font-display font-bold tabular-nums">
              {fx.midRate.toString()}
            </p>
            <p className="text-caption text-text-500 mt-1">
              Last fetched {formatDateTime(fx.fetchedAt)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Default spread</CardTitle>
            <CardDescription>From environment</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-display-xl font-display font-bold tabular-nums">
              {(defaultSpread / 100).toFixed(2)}%
            </p>
            <p className="text-caption text-text-500 mt-1">{defaultSpread} basis points</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Snapshot the live rate</CardTitle>
          <CardDescription>
            Pull the current mid-market rate from the FX source and store it with the chosen
            spread.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={refreshRateAction} className="flex items-end gap-3">
            <div className="flex-1 max-w-xs">
              <Label htmlFor="spreadBps">Spread (bps)</Label>
              <Input id="spreadBps" name="spreadBps" type="number" defaultValue={defaultSpread} />
            </div>
            <Button type="submit">Snapshot</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Set a manual rate</CardTitle>
          <CardDescription>
            Override the live rate. Useful for testing or to lock a specific rate during volatile
            markets.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={setManualRateAction} className="grid gap-3 md:grid-cols-3">
            <div>
              <Label htmlFor="midRate">Mid rate</Label>
              <Input id="midRate" name="midRate" type="text" placeholder="365.42" required />
            </div>
            <div>
              <Label htmlFor="spreadBps2">Spread (bps)</Label>
              <Input id="spreadBps2" name="spreadBps" type="number" defaultValue={defaultSpread} />
            </div>
            <div className="flex items-end">
              <Button type="submit" width="full">
                Save manual rate
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent rates</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <THead>
              <TR>
                <TH>Effective at</TH>
                <TH>Mid rate</TH>
                <TH>Spread</TH>
                <TH>Source</TH>
              </TR>
            </THead>
            <TBody>
              {history.map((r) => (
                <TR key={r.id}>
                  <TD className="text-caption">{formatDateTime(r.effectiveAt)}</TD>
                  <TD className="tabular-nums">{r.midRate.toString()}</TD>
                  <TD>{(r.spreadBps / 100).toFixed(2)}%</TD>
                  <TD className="text-caption text-text-500">{r.source}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
          {history.length === 0 && (
            <p className="text-body text-text-500 text-center py-8">
              No rate history yet. Snapshot the live rate above to start.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
