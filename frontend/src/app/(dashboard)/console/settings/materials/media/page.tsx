"use client";

import { Alert, AlertDescription, AlertTitle, Card, CardContent } from "@bs-lab/ui";

import { PageHeader } from "@/components/layout/page-header";
import { ConsoleMediaOpsCollapsible } from "./_components/console-media-ops-collapsible";
import { ConsoleMediaTableSection } from "./_components/console-media-table-section";
import { ConsoleMediaToolbar } from "./_components/console-media-toolbar";
import { ConsoleMediaWorkbench } from "./_components/console-media-workbench";
import { useConsoleMediaPageState } from "./page.hooks";

export default function ConsoleMediaResourcePage() {
  const st = useConsoleMediaPageState();

  return (
    <div className="space-y-6">
      <PageHeader
        title="媒体资源库"
        description={
          <>列表与上传对齐库表 <span className="font-mono text-xs">data_file</span>、字典 <span className="font-mono text-xs">data_file_type</span>（《数据库开发前规范》8.1）；接口为 <span className="font-mono text-xs">GET /v2/file</span>、<span className="font-mono text-xs">PATCH /v2/file/:id</span>。</>
        }
      />

      <Card className="border-border shadow-none">
        <CardContent className="flex flex-col gap-4 p-4">
          <ConsoleMediaToolbar
            keywordDraft={st.keywordDraft}
            onKeywordDraftChange={st.setKeywordDraft}
            fileTypeId={st.fileTypeId}
            onFileTypeIdChange={st.setFileTypeId}
            status={st.status}
            onStatusChange={st.setStatus}
            fileTypeOptions={st.fileTypeOptions}
            loading={st.loading}
            onSearch={() => void st.applySearch()}
          />
        </CardContent>
      </Card>

      <ConsoleMediaWorkbench actor={st.actor} fileTypeOptions={st.fileTypeOptions} onCompleted={st.refresh} />

      <ConsoleMediaOpsCollapsible actor={st.actor} onCompleted={st.refresh} />

      {st.error ? (
        <Alert variant="destructive">
          <AlertTitle>加载失败</AlertTitle>
          <AlertDescription>{st.error}</AlertDescription>
        </Alert>
      ) : null}

      <ConsoleMediaTableSection rows={st.rows} actor={st.actor} refresh={st.refresh} serverPagination={st.serverPagination} />
    </div>
  );
}
