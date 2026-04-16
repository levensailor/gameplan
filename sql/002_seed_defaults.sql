insert into planner_columns (slug, name, display_order)
values
  ('pipeline', 'Pipeline', 1),
  ('won', 'Won', 2),
  ('active', 'Active', 3),
  ('completed', 'Completed', 4),
  ('non-billables', 'Non Billables', 5)
on conflict (slug) do update
set name = excluded.name,
    display_order = excluded.display_order;

insert into labels (slug, name, color_hex)
values
  ('issue', 'issue', '#ef4444'),
  ('staff', 'staff', '#f59e0b'),
  ('waiting', 'waiting', '#a855f7'),
  ('pcr', 'pcr', '#22c55e'),
  ('at-risk', 'at risk', '#3b82f6')
on conflict (slug) do update
set name = excluded.name,
    color_hex = excluded.color_hex;
