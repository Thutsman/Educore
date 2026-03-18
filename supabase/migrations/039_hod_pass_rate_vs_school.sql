-- ============================================================
-- MIGRATION 039 — HOD pass-rate vs school average (RPC)
-- ============================================================

-- Returns aggregated average grade percentage (0–100) for:
-- - the HOD's department (deptAvg)
-- - the whole school (schoolAvg)
-- based on the latest exam date inside the school's current term.

CREATE OR REPLACE FUNCTION public.get_hod_pass_rate_vs_school(
  p_school_id UUID,
  p_department_id UUID
)
RETURNS TABLE (
  dept_avg NUMERIC,
  school_avg NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_term_id UUID;
  v_latest_date DATE;
BEGIN
  SELECT t.id
    INTO v_term_id
  FROM terms t
  JOIN academic_years ay ON ay.id = t.academic_year_id
  WHERE ay.school_id = p_school_id
    AND t.is_current = true
  LIMIT 1;

  IF v_term_id IS NULL THEN
    dept_avg := 0;
    school_avg := 0;
    RETURN NEXT;
  END IF;

  SELECT MAX(COALESCE(e.exam_date, e.created_at::date))
    INTO v_latest_date
  FROM exams e
  WHERE e.school_id = p_school_id
    AND e.term_id = v_term_id;

  IF v_latest_date IS NULL THEN
    dept_avg := 0;
    school_avg := 0;
    RETURN NEXT;
  END IF;

  RETURN QUERY
  SELECT
    COALESCE(
      AVG(
        CASE
          WHEN c.department_id = p_department_id
          THEN (g.marks_obtained / NULLIF(e.total_marks, 0)) * 100
          ELSE NULL
        END
      ),
      0
    ) AS dept_avg,
    COALESCE(
      AVG((g.marks_obtained / NULLIF(e.total_marks, 0)) * 100),
      0
    ) AS school_avg
  FROM grades g
  JOIN exams e ON e.id = g.exam_id
  JOIN classes c ON c.id = e.class_id
  WHERE g.school_id = p_school_id
    AND e.school_id = p_school_id
    AND e.term_id = v_term_id
    AND COALESCE(e.exam_date, e.created_at::date) = v_latest_date
    AND g.marks_obtained IS NOT NULL;
END;
$$;

-- ============================================================
-- MIGRATION 039 — HOD pass-rate vs school average (RPC)
-- ============================================================

-- Returns aggregated average grade percentage (0–100) for:
-- - the HOD's department (deptAvg)
-- - the whole school (schoolAvg)
-- based on the latest exam date inside the school's current term.

CREATE OR REPLACE FUNCTION public.get_hod_pass_rate_vs_school(
  p_school_id UUID,
  p_department_id UUID
)
RETURNS TABLE (
  dept_avg NUMERIC,
  school_avg NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_term_id UUID;
  v_latest_date DATE;
BEGIN
  SELECT t.id
    INTO v_term_id
  FROM terms t
  JOIN academic_years ay ON ay.id = t.academic_year_id
  WHERE ay.school_id = p_school_id
    AND t.is_current = true
  LIMIT 1;

  IF v_term_id IS NULL THEN
    dept_avg := 0;
    school_avg := 0;
    RETURN NEXT;
  END IF;

  SELECT MAX(COALESCE(e.exam_date, e.created_at::date))
    INTO v_latest_date
  FROM exams e
  WHERE e.school_id = p_school_id
    AND e.term_id = v_term_id;

  IF v_latest_date IS NULL THEN
    dept_avg := 0;
    school_avg := 0;
    RETURN NEXT;
  END IF;

  RETURN QUERY
  SELECT
    COALESCE(
      AVG(
        CASE
          WHEN c.department_id = p_department_id
          THEN (g.marks_obtained / NULLIF(e.total_marks, 0)) * 100
          ELSE NULL
        END
      ),
      0
    ) AS dept_avg,
    COALESCE(
      AVG((g.marks_obtained / NULLIF(e.total_marks, 0)) * 100),
      0
    ) AS school_avg
  FROM grades g
  JOIN exams e ON e.id = g.exam_id
  JOIN classes c ON c.id = e.class_id
  WHERE g.school_id = p_school_id
    AND e.school_id = p_school_id
    AND e.term_id = v_term_id
    AND COALESCE(e.exam_date, e.created_at::date) = v_latest_date
    AND g.marks_obtained IS NOT NULL;
END;
$$;

