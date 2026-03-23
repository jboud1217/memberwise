"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Clock, AlertCircle, TrendingUp, Calendar } from "lucide-react";
import { getPortalVolunteerHours } from "@/actions/portal";

type VolunteerData = Awaited<ReturnType<typeof getPortalVolunteerHours>>;

export default function PortalVolunteerPage() {
  const [data, setData] = useState<VolunteerData>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPortalVolunteerHours()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="py-12 text-center">
        <AlertCircle className="mx-auto mb-3 h-8 w-8 text-[var(--muted-foreground)]" />
        <p className="text-[var(--muted-foreground)]">
          Your account is not linked to a member record yet. Please contact your organization administrator.
        </p>
      </div>
    );
  }

  const { logs, totalHours, ytdHours } = data;

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Volunteer Hours</h1>
      <p className="mb-6 text-sm text-[var(--muted-foreground)]">
        Track your volunteer contributions and service hours.
      </p>

      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--primary)]/10">
              <TrendingUp className="h-5 w-5 text-[var(--primary)]" />
            </div>
            <div>
              <p className="text-sm text-[var(--muted-foreground)]">Total Hours</p>
              <p className="text-2xl font-bold">{Number(totalHours).toFixed(1)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
              <Calendar className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-[var(--muted-foreground)]">This Year</p>
              <p className="text-2xl font-bold">{Number(ytdHours).toFixed(1)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Log */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Activity Log</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-center">
              <Clock className="mb-3 h-10 w-10 text-[var(--muted-foreground)]" />
              <p className="font-medium">No volunteer hours recorded</p>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                Your volunteer activity will appear here once recorded.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Activity</TableHead>
                    <TableHead className="text-right">Hours</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm">
                        {new Date(log.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-medium">
                          {log.opportunity?.title || log.description || "Volunteer Service"}
                        </p>
                        {log.description && log.opportunity?.title && (
                          <p className="text-xs text-[var(--muted-foreground)]">{log.description}</p>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {Number(log.hours).toFixed(1)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={log.approved ? "success" : "secondary"}>
                          {log.approved ? "Approved" : "Pending"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
