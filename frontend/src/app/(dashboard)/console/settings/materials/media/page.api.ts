"use client";

export type { MediaActor } from "@/lib/media-platform/media-api";
export {
  approveMediaRegistry,
  completeMediaPendingJobs,
  createMediaReference,
  forkMediaRegistryRevision,
  getMediaOrphanReport,
  getMediaRegistry,
  getMediaReviewPolicy,
  listMediaReferences,
  processMediaOutbox,
  putMediaReviewPolicy,
  rejectMediaRegistry,
  searchMediaRegistry,
  submitMediaRegistryReview,
  upgradeMediaReferenceRegistry,
} from "@/lib/media-platform/media-api";
