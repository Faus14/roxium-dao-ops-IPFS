export interface AttachmentEntity {
    type: 'attachment';
    cid: string;
    filename: string;
    mimeType: string;
    size: number;
    taskId: string;
    gatewayUrl: string;
    uploadedAt: string;
}
export interface TaskExecutionEntity {
    type: 'taskExecution';
    taskId: string;
    proposalId: string;
    daoId: string;
    previousStatus: string;
    newStatus: string;
    changedAt: string;
    changedBy: string;
}
export interface DAOEntity {
    type: 'dao';
    daoId: string;
    name: string;
    description: string;
    createdAt: string;
    ownerId: string;
}
export interface ProposalEntity {
    type: 'proposal';
    proposalId: string;
    daoId: string;
    title: string;
    budget: number;
    status: string;
    createdAt: string;
}
export interface TaskEntity {
    type: 'task';
    taskId: string;
    proposalId: string;
    title: string;
    budget: number;
    status: string;
    taskType: string;
    createdAt: string;
}
//# sourceMappingURL=arkiv.types.d.ts.map