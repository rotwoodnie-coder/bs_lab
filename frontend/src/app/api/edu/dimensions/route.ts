import { fetchEduSnapshot, withErrorHandling } from "../_lib";

export async function GET() {
  return withErrorHandling(async () => fetchEduSnapshot());
}
