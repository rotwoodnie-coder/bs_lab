import type { ExperimentMaterialDraft } from "../types";
import { ExperimentalMaterialsPickerDialog } from "./ExperimentalMaterialsPickerDialog";

type Props = {
  disabled: boolean;
  onAppendMaterials: (drafts: Omit<ExperimentMaterialDraft, "id">[]) => void;
  className?: string;
};

export function StepMaterialsLibraryPanel(props: Props) {
  return <ExperimentalMaterialsPickerDialog disabled={props.disabled} className={props.className} onAppendMaterials={props.onAppendMaterials} />;
}
