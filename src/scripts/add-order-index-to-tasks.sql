-- tasksテーブルにorder_indexカラムを追加
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS order_index INTEGER;

-- 既存のタスクにorder_indexを設定（created_at順）
UPDATE tasks 
SET order_index = subquery.row_number 
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY project_id, category ORDER BY created_at) as row_number
  FROM tasks 
  WHERE order_index IS NULL
) AS subquery 
WHERE tasks.id = subquery.id;

-- order_indexにインデックスを作成（パフォーマンス向上のため）
CREATE INDEX IF NOT EXISTS idx_tasks_order_index ON tasks(project_id, category, order_index);
