"use client";

import * as React from "react";

import type { CatalogCategory, CatalogCore } from "@/lib/experiment-catalog-api";
import { experimentCatalogDemoStreamActor } from "@/lib/experiment-catalog-api";
import { useDevInspector } from "@/contexts/dev-inspector-context";
import { mediaRegistryStreamUrl } from "@/lib/media-platform/registry-ref";
import { UserRole } from "@/types/auth";

import type { SchoolDimensionSnapshot } from "../../education/subject-grades/page.types";
import { ExperimentDetailCoreFields } from "./experiment-detail-core-fields";
import { ExperimentDetailCoreEditPanel } from "./experiment-detail-core-edit-panel";
import { ExperimentCatalogCopyId } from "./experiment-catalog-copy-id";

type Props = {
  core: CatalogCore;
  eduSnapshot?: SchoolDimensionSnapshot | null;
  canManage: boolean;
  role: UserRole;
  orgId: string;
  categories: CatalogCategory[];
  onDetailCoreSave: () => Promise<void>;
  focusOfficialVideo?: boolean;
  onFocusOfficialVideoConsumed?: () => void;
  hideOfficialVideo?: boolean;
};

/** 标准实验详情：同一「标准实验主体」区块内，有权限即编辑，无权限即只读 */
export function ExperimentDetailCoreSection(props: Props) {
  const { enabled: devMode } = useDevInspector();

  const officialVideoStreamSrc = React.useMemo(() => {
    const rid = props.core.officialVideoRegistryId?.trim();
    if (!rid || props.core.officialVideoReachable === false) return null;
    const actor = experimentCatalogDemoStreamActor(props.role, props.orgId);
    return mediaRegistryStreamUrl(rid, "view", actor);
  }, [props.core.officialVideoRegistryId, props.core.officialVideoReachable, props.role, props.orgId]);

  const c = props.core;

  return (
    <section className="rounded-md border border-border bg-muted/10 px-3 py-2 sm:px-4">
      <h3 className="mb-2 flex items-center justify-between gap-2 text-sm font-semibold text-foreground">
            {devMode ? (
          <span className="inline-flex items-center gap-1 text-xs font-normal text-muted-foreground">
            排障
            <ExperimentCatalogCopyId value={c.id} label="主键" />
          </span>
        ) : null}
      </h3>

      {props.canManage ? (
        <ExperimentDetailCoreEditPanel
          core={props.core}
          role={props.role}
          orgId={props.orgId}
          snapshot={props.eduSnapshot ?? null}
          categories={props.categories}
          onAfterSave={props.onDetailCoreSave}
          focusOfficialVideo={props.focusOfficialVideo}
          onFocusOfficialVideoConsumed={props.onFocusOfficialVideoConsumed}
          hideOfficialVideo={props.hideOfficialVideo}
          embedded
        />
      ) : (
        <ExperimentDetailCoreFields
          embedded
          core={props.core}
          eduSnapshot={props.eduSnapshot ?? null}
          officialVideoStreamSrc={officialVideoStreamSrc}
        />
      )}
    </section>
  );
}
