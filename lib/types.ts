export type ZoneType = 'grass' | 'waste' | 'maintenance';
export type TaskType = 'mowing' | 'waste' | 'maintenance';
export type WeatherCondition = 'good' | 'normal' | 'bad';
export type DifficultyLevel = 'normal' | 'dirty' | 'heavy';
export type TaskMode = 'productive' | 'non_productive';
export type PointType = 'trash_bin' | 'asset' | 'other';
export type DaySessionMode = 'productive' | 'non_productive';
export type NonProductiveReason = 'driving' | 'break' | 'loading' | 'talking' | 'other';

export interface Zone {
  id: string;
  title: string;
  name: string | null;
  type: ZoneType;
  instructions: string | null;
  geojson: GeoJSON.Feature;
  area_m2: number | null;
  tags: string[];
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
  weather_condition: WeatherCondition | null;
  difficulty: DifficultyLevel | null;
  mode: TaskMode | null;
  productive_minutes: number;
  non_productive_minutes: number;
  created_at: string;
}

export interface TaskWithZone extends Task {
  zones?: Pick<Zone, 'id' | 'title' | 'name' | 'type'>;
}

export interface ZoneStats {
  zone_id: string;
  zone_name: string;
  area_m2: number | null;
  total_minutes: number;
  avg_minutes: number;
  task_count: number;
}

export interface Point {
  id: string;
  title: string;
  type: PointType;
  notes: string | null;
  geojson: GeoJSON.Feature;
  created_at: string;
}

export interface Route {
  id: string;
  title: string;
  point_ids: string[];
  created_at: string;
}

export interface DailyPlan {
  id: string;
  plan_date: string;
  zone_ids: string[];
  team_members: number;
  hours_per_member: number;
  notes: string | null;
  created_at: string;
}

export interface KpiData {
  timePerM2ByZone: { zone_id: string; zone_name: string; area_m2: number; minutes_per_m2: number }[];
  productiveRatio: { productive_minutes: number; non_productive_minutes: number; ratio: number };
  varianceByZone: { zone_id: string; zone_name: string; avg_minutes: number; variance: number; std_dev: number }[];
}

export interface DaySession {
  id: string;
  date: string;
  mode: DaySessionMode;
  start_time: string;
  end_time: string | null;
  non_productive_reason: NonProductiveReason | null;
  created_at: string;
}

export interface DaySessionSummary {
  total_productive_minutes: number;
  total_non_productive_minutes: number;
  active_session: DaySession | null;
}
