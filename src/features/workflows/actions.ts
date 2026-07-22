"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

// ============================================================================
// 1. INITIATE A NEW WORKFLOW (State Machine Origin)
// ============================================================================
export async function createExpenseRequisition(title: string, amount: number, vendor: string, description: string) {
  try {
    const session = await auth();
    if (!session || !session.user) return { success: false, error: "Unauthorized" };

    // Start a transactional write to ensure the request AND its steps are created together
    const workflow = await db.$transaction(async (tx) => {
      // Create the core request ledger
      const req = await tx.workflowRequest.create({
        data: {
          initiatorId: session.user.id,
          type: "EXPENSE_REQUISITION",
          title,
          details: { amount, vendor, description },
          status: "IN_PROGRESS",
          currentStepIndex: 0,
        }
      });

      // Construct the strict Chain of Command
      // Step 0: Department/Branch Manager Approval
      await tx.workflowStep.create({
        data: {
          workflowId: req.id,
          stepOrder: 0,
          requiredRoleId: "ADMIN", // Requires a Branch Admin to approve first
        }
      });

      // Step 1: Finance Treasury Clearance
      await tx.workflowStep.create({
        data: {
          workflowId: req.id,
          stepOrder: 1,
          requiredRoleId: "FINANCE_TREASURY", // Requires Finance to release the funds
        }
      });

      // Step 2: Final Executive Sign-off (Only for high-value transactions > ₦5M)
      if (amount > 5000000) {
        await tx.workflowStep.create({
          data: {
            workflowId: req.id,
            stepOrder: 2,
            requiredRoleId: "EXEC",
          }
        });
      }

      return req;
    });

    return { success: true, workflow };
  } catch (error: any) {
    console.error("Workflow Initiation Error:", error.message);
    return { success: false, error: "Failed to construct the approval chain." };
  }
}

// ============================================================================
// 2. FETCH PENDING APPROVALS FOR THE CURRENT AGENT
// ============================================================================
export async function getMyPendingApprovals() {
  try {
    const session = await auth();
    if (!session || !session.user) return { success: false, error: "Unauthorized" };

    const { id, role } = session.user;

    // We only want workflows where the CURRENT step matches the user's ID or Role
    const pendingWorkflows = await db.workflowRequest.findMany({
      where: {
        status: "IN_PROGRESS",
        steps: {
          some: {
            // It must be the currently active step
            stepOrder: { equals: db.workflowRequest.fields.currentStepIndex },
            status: "PENDING",
            OR: [
              { specificUserId: id },
              { requiredRoleId: role as any }
            ]
          }
        }
      },
      include: {
        initiator: { select: { name: true, role: true, avatarUrl: true } },
        steps: {
          orderBy: { stepOrder: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return { success: true, workflows: pendingWorkflows };
  } catch (error: any) {
    return { success: false, error: "Failed to retrieve the approval matrix." };
  }
}

// ============================================================================
// 3. EXECUTE DECISION (Advance or Halt the State Machine)
// ============================================================================
export async function executeWorkflowDecision(workflowId: string, decision: 'APPROVED' | 'REJECTED', comments?: string) {
  try {
    const session = await auth();
    if (!session || !session.user) return { success: false, error: "Unauthorized" };

    const { id, role } = session.user;

    // Retrieve the workflow and all its steps
    const workflow = await db.workflowRequest.findUnique({
      where: { id: workflowId },
      include: { steps: true }
    });

    if (!workflow || workflow.status !== "IN_PROGRESS") {
      return { success: false, error: "Workflow is not active or already finalized." };
    }

    const currentStep = workflow.steps.find(s => s.stepOrder === workflow.currentStepIndex);
    if (!currentStep || currentStep.status !== "PENDING") {
      return { success: false, error: "Invalid step synchronization." };
    }

    // Verify Authorization for this specific step
    const isAuthorized = currentStep.specificUserId === id || currentStep.requiredRoleId === role;
    if (!isAuthorized) {
      return { success: false, error: "You lack clearance for this specific approval stage." };
    }

    // Process the transaction
    await db.$transaction(async (tx) => {
      // 1. Mark the current step as resolved by this specific user
      await tx.workflowStep.update({
        where: { id: currentStep.id },
        data: {
          status: decision,
          comments,
          actedById: id,
          actedAt: new Date()
        }
      });

      if (decision === 'REJECTED') {
        // If rejected, the entire chain halts permanently
        await tx.workflowRequest.update({
          where: { id: workflowId },
          data: { status: "REJECTED" }
        });
        
        // Notify initiator
        await tx.notification.create({
          data: {
            userId: workflow.initiatorId,
            title: "Requisition Rejected",
            message: `Your request "${workflow.title}" was rejected at Stage ${workflow.currentStepIndex + 1}.`,
            type: "ALERT"
          }
        });
      } 
      else if (decision === 'APPROVED') {
        const nextStepIndex = workflow.currentStepIndex + 1;
        const hasMoreSteps = workflow.steps.some(s => s.stepOrder === nextStepIndex);

        if (hasMoreSteps) {
          // Advance to the next department
          await tx.workflowRequest.update({
            where: { id: workflowId },
            data: { currentStepIndex: nextStepIndex }
          });
        } else {
          // All steps complete! Finalize the workflow.
          await tx.workflowRequest.update({
            where: { id: workflowId },
            data: { status: "APPROVED" }
          });

          // Notify initiator of final victory
          await tx.notification.create({
            data: {
              userId: workflow.initiatorId,
              title: "Requisition Fully Approved",
              message: `Your request "${workflow.title}" has cleared all approval stages and is finalized.`,
              type: "APPROVAL"
            }
          });
        }
      }
    });

    return { success: true };
  } catch (error: any) {
    console.error("Decision Engine Error:", error.message);
    return { success: false, error: "Failed to execute workflow decision." };
  }
}