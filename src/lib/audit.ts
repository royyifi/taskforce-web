import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function logAudit(params: {
  action: string;
  entityType: string;
  entityId?: string;
  entityName?: string;
  detail?: string;
}) {
  const session = await getSession();
  await db.auditLog.create({
    data: {
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      entityName: params.entityName,
      detail: params.detail,
      userId: session?.id,
      userName: session?.name || "Public",
    },
  });
}
