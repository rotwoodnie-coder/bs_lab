/** Mock 状态层：与后端接入时替换为 API / React Query 等。 */
export {
  approveStudentWork,
  readStudentWorks,
  rejectStudentWork,
  submitSameStyleWork,
  subscribeWorksPipeline,
  useStudentWorksPipeline,
  writeStudentWorks,
} from "./works-pipeline-mock-store";
