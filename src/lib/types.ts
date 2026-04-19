export type UserSession = {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  webexAccessToken: string;
};

export type PlannerColumn = {
  id: string;
  slug: string;
  name: string;
  display_order: number;
};

export type PlannerCard = {
  id: string;
  column_id: string;
  name: string;
  description: string | null;
  customer_name: string | null;
  project_manager_name: string | null;
  project_manager_email: string | null;
  project_code: string | null;
  engineering_hours: number | null;
  notes: string | null;
  due_date: string | null;
  position: number;
  created_at: string;
};

export type EngineerSummary = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar_url: string | null;
  title: string | null;
  skills: string | null;
};

export type CardLabel = {
  id: string;
  slug: string;
  name: string;
  color_hex: string;
};

export type CardAssignment = {
  card_id: string;
  engineer_id: string;
};

export type CardLabelAssignment = {
  card_id: string;
  label_id: string;
};

export type BoardSnapshot = {
  columns: PlannerColumn[];
  cards: PlannerCard[];
  engineers: EngineerSummary[];
  labels: CardLabel[];
  assignments: CardAssignment[];
  cardLabels: CardLabelAssignment[];
};
