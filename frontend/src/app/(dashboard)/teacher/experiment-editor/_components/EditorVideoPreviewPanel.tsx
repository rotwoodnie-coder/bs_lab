import * as React from "react";
import Link from "next/link";

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  MediaPreview,
} from "@bs-lab/ui";

export function EditorVideoPreviewPanel(props: {
  selectedStepTitle: string;
  videoUrl: string;
  onLocateDesign: () => void;
  compact?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const panelHeightClass = props.compact ? "h-[120px]" : "h-[180px]";

  return (
    <>
      <Card className="rounded-[28px] border-0 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">实时视频预览</CardTitle>
          <p className="text-xs text-muted-foreground">当前步骤：{props.selectedStepTitle}</p>
        </CardHeader>
        <CardContent className="space-y-2">
          {props.videoUrl ? (
            <button
              type="button"
              className="block w-full overflow-hidden rounded-md border border-border bg-black/80 text-left"
              onClick={() => setOpen(true)}
            >
              <MediaPreview kind="video" src={props.videoUrl} className={`${panelHeightClass} w-full object-cover`} />
            </button>
          ) : (
            <div className={`${panelHeightClass} flex items-center justify-center rounded-md border border-dashed border-border bg-muted/20 px-2 text-center text-xs text-muted-foreground`}>
              暂无视频，点击“定位到实验设计”添加原理视频
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" onClick={props.onLocateDesign}>
              定位到实验设计
            </Button>
            {props.videoUrl ? (
              <>
                <Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)}>
                  点击放大
                </Button>
                <Button type="button" size="sm" variant="outline" asChild>
                  <Link href={props.videoUrl} target="_blank">
                    新窗口打开
                  </Link>
                </Button>
              </>
            ) : null}
          </div>
        </CardContent>
      </Card>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>视频预览（放大）</DialogTitle>
          </DialogHeader>
          <div className="overflow-hidden rounded-md border border-border bg-black/80">
            <MediaPreview
              kind="video"
              variant="default"
              src={props.videoUrl}
              className="h-[420px] w-full object-contain"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

