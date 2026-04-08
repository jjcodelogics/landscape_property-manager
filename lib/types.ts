export type ZoneType = 'grass' | 'waste' | 'maintenance';
export type TaskType = 'mowing' | 'waste' | 'maintenance';

export interface Zone {
  id: string;
  title: string;
  name: string | null;
  type: ZoneType;
  instructions: string | null;
  geojson: GeoJSON.Feature;
  last_worked_at: string | null;
  next_scheduled_work: string | null;
  created_at: string;
}

export interface Task {
  id: string;
  zone_id: string;
  task_type: TaskType;
  duration_minutes: number;
  notes: string | null;
  created_at: string;
}

export interface TaskWithZone extends Task {
  zones?: Pick<Zone, 'id' | 'title' | 'name' | 'type'>;
}

export interface ZoneStats {
  zone_id: string;
  zone_name: string;
  total_minutes: number;
  avg_minutes: number;
  task_count: number;
}
