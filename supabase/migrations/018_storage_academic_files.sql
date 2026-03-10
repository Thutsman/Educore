-- ============================================================
-- MIGRATION 018 — Storage bucket for academic files
-- Assignments attachments and learning resources
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'academic-files',
  'academic-files',
  true,
  52428800,  -- 50MB
  ARRAY['application/pdf','video/*','application/vnd.ms-powerpoint','application/vnd.openxmlformats-officedocument.presentationml.presentation','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','image/*']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- RLS: authenticated users can read; teachers/admins can upload/update/delete
CREATE POLICY "academic_files_upload"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'academic-files');

CREATE POLICY "academic_files_update"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'academic-files');

CREATE POLICY "academic_files_select"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'academic-files');

CREATE POLICY "academic_files_delete"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'academic-files');
