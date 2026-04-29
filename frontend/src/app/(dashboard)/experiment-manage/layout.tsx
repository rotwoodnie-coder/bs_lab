import type { ReactNode } from "react";

export default function ExperimentManageLayout(props: { children: ReactNode; modal: ReactNode }) {
  return (
    <>
      {props.children}
      {props.modal}
    </>
  );
}

