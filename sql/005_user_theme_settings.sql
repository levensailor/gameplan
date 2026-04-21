alter table if exists app_users
add column if not exists theme_name text not null default 'vscode-dark-plus';

alter table app_users
drop constraint if exists app_users_theme_name_check;

alter table app_users
add constraint app_users_theme_name_check
check (
  theme_name in (
    'vscode-dark-plus',
    'dracula',
    'monokai-pro',
    'nord-night',
    'solarized-dark',
    'github-light',
    'quiet-light',
    'one-light',
    'solarized-light',
    'xcode-light'
  )
);
