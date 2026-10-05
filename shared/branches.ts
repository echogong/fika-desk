export interface CreateBranchResult {
  branch: string;
  currentBranch: string;
  created: boolean;
}

export interface BranchList {
  branches: string[];
  currentBranch: string;
}

export interface SwitchBranchResult extends CreateBranchResult {
  created: false;
  switched: boolean;
}

export const PROTECTED_BRANCHES: readonly string[] = ['main', 'master'];

export interface DeleteBranchResult extends CreateBranchResult {
  created: false;
  deleted: true;
}
