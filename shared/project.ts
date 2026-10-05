import type { HistoryItem } from './types';

export interface ProjectEntry {
  name: string;
  path: string;
  directory: boolean;
  size?: number;
}

export interface ProjectDirectory {
  path: string;
  entries: ProjectEntry[];
  truncated: boolean;
}

export type PreviewKind = 'text' | 'markdown' | 'image' | 'pdf' | 'audio' | 'unsupported';
export interface ProjectPreview {
  path: string;
  name: string;
  size: number;
  modifiedAt: number;
  kind: PreviewKind;
  text?: string;
}

export interface ProjectChange {
  path: string;
  oldPath?: string;
  index: string;
  working: string;
}

export interface ProjectChanges {
  repository: boolean;
  branch?: string;
  entries: ProjectChange[];
  truncated: boolean;
}

export interface ProjectDiff {
  path: string;
  patch: string;
  binary: boolean;
}

export interface HistoryMatch extends HistoryItem {
  snippet?: string;
}

export interface HistorySearch {
  items: HistoryMatch[];
  truncated: boolean;
}
