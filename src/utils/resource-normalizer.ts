
export interface NormalizedResource {
  id: string;
  title: string;
  subject: string;
  grade: string;
  type: "pdf" | "video" | "link" | "file";
  displayType: string;
  url: string;
  uploadedBy: string;
  createdAt?: any;
}

/**
 * Safely normalizes any Firestore resource document to prevent
 * runtime exceptions when fields like type, subject, grade, title, or url are undefined/null/malformed.
 */
export function normalizeResourceType(resource: any): NormalizedResource {
  if (!resource || typeof resource !== "object") {
    return {
      id: String(Math.random()),
      title: "Untitled Study Resource",
      subject: "General",
      grade: "12",
      type: "file",
      displayType: "FILE",
      url: "",
      uploadedBy: "",
    };
  }

  const rawType = (resource.type || resource.resourceType || resource.fileType || "").toString().toLowerCase().trim();
  const rawUrl = (resource.url || resource.fileUrl || resource.link || "").toString().trim();

  let type: "pdf" | "video" | "link" | "file" = "file";
  let displayType = "FILE";

  if (rawType.includes("pdf") || rawUrl.toLowerCase().endsWith(".pdf")) {
    type = "pdf";
    displayType = "PDF";
  } else if (
    rawType.includes("video") ||
    rawType.includes("mp4") ||
    rawUrl.includes("youtube.com") ||
    rawUrl.includes("youtu.be") ||
    rawUrl.toLowerCase().endsWith(".mp4")
  ) {
    type = "video";
    displayType = "VIDEO";
  } else if (rawType.includes("link") || rawUrl.startsWith("http") || rawUrl.startsWith("https")) {
    type = "link";
    displayType = "LINK";
  } else if (rawType) {
    displayType = rawType.toUpperCase();
  }

  return {
    id: String(resource.id || Math.random()),
    title: (resource.title || resource.name || "Untitled Resource").toString(),
    subject: (resource.subject || "General").toString(),
    grade: (resource.grade || "12").toString(),
    type,
    displayType,
    url: rawUrl,
    uploadedBy: (resource.uploadedBy || "").toString(),
    createdAt: resource.createdAt,
  };
}
