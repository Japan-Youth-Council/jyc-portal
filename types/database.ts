export interface PolicyCategory {
  id: number;
  name: string;
  parent_id: number | null;
  created_by_name: string | null;
  created_at: string;
}

export interface Knowledge {
  id: number;
  category_id: number | null;
  title: string;
  content: string;
  author_name: string;
  updated_at: string;
  created_at: string;
}

export interface AdvocacyTarget {
  id: number;
  name: string;
  category: string;
  region: string | null;
  sort_order: number;        // ← これを追加
  created_by_name: string | null;
  created_at: string;
}

export interface AdvocacyLog {
  id: number;
  target_id: number;
  action_date: string;
  title: string;
  members: string | null;
  summary: string | null;
  file_url: string | null;
  minutes_url: string | null;  // ← これを追加
  author_name: string;
  created_at: string;
}

export interface Project {
  id: number;
  title: string;
  status: 'active' | 'paused' | 'completed';
  description: string | null;
  parent_id: number | null; // ← これを追加（親がない場合はnull）
  created_at: string;
}

export interface ProjectUpdate {
  id: number;
  project_id: number; // ← null許容を外し、必須に変更
  content: string;
  author_name: string;
  created_at: string;
}