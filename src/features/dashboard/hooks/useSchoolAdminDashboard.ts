import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useSchool } from '@/context/SchoolContext'

export function useSchoolAdminSetupStats() {
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''

  return useQuery({
    queryKey: ['school-admin-setup', schoolId],
    queryFn: async () => {
      const [studentsRes, teachersRes, classesRes, usersRes] = await Promise.all([
        supabase.from('students').select('id', { count: 'exact', head: true }).eq('school_id', schoolId).is('deleted_at', null),
        supabase.from('teachers').select('id', { count: 'exact', head: true }).eq('school_id', schoolId).is('deleted_at', null),
        supabase.from('classes').select('id', { count: 'exact', head: true }).eq('school_id', schoolId).is('deleted_at', null),
        supabase.from('user_roles').select('id', { count: 'exact', head: true }).eq('school_id', schoolId),
      ])
      return {
        studentCount:  studentsRes.count  ?? 0,
        teacherCount:  teachersRes.count  ?? 0,
        classCount:    classesRes.count   ?? 0,
        userCount:     usersRes.count     ?? 0,
      }
    },
    enabled: !!schoolId,
  })
}
