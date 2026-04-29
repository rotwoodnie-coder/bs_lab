import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@bs-lab/ui";
import type { WorkRecord } from "../types";

type FeedPanelProps = {
  feed: WorkRecord[];
  onLoadFeed: () => void;
};

export function FeedPanel({ feed, onLoadFeed }: FeedPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Published Feed</CardTitle>
        <CardDescription>Only published works should appear here.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={onLoadFeed}>Load published feed</Button>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Work ID</TableHead>
              <TableHead>Experiment ID</TableHead>
              <TableHead>Student ID</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {feed.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.id}</TableCell>
                <TableCell>{item.experimentId}</TableCell>
                <TableCell>{item.studentUserId}</TableCell>
                <TableCell>{item.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          {feed.length === 0 ? <TableCaption>No published works yet.</TableCaption> : null}
        </Table>
      </CardContent>
    </Card>
  );
}

