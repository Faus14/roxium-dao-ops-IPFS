// src/types/arkiv-domain.ts

export type DaoPayloadV1 = {
  id: number; // ID interno de tu DB si querés
  createdAt: string; // ISO
  name: string;
  description?: string;
  ownerAddress: string;
  version: 1;
};

export type ProposalPayloadV1 = {
  id: number;
  createdAt: string;
  deadline?: string; // ISO
  title: string;
  budget?: number;
  description?: string;
  daoKey: string; // entityKey del DAO en Arkiv
  status: "open" | "closed" | "archived";
  version: 1;
};

export type TaskPayloadV1 = {
  id: number;
  createdAt: string;
  deadline?: string;
  title: string;
  budget?: number;
  description?: string;
  proposalKey: string;
  daoKey: string;
  status: "todo" | "in-progress" | "done";
  version: 1;
};

export type MembershipPayloadV1 = {
  userAddress: string;
  daoKey: string;
  role: "OWNER" | "CONTRIBUTOR" | "VIEWER";
  createdAt: string;
  version: 1;
};
