import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSchool } from '@/context/SchoolContext'
import {
  getParentMessagesSentByTeacher,
  getGuardiansWithStudentsForTeacher,
  createParentMessage,
  markParentMessageRead,
} from '../services/parentMessages'

const KEY = {
  sent: (schoolId: string) => ['parent-messages', 'sent', schoolId] as const,
  guardians: (schoolId: string) => ['parent-messages', 'guardians', schoolId] as const,
}

export function useParentMessagesSent() {
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  return useQuery({
    queryKey: KEY.sent(schoolId),
    queryFn: () => getParentMessagesSentByTeacher(schoolId),
    enabled: !!schoolId,
  })
}

export function useGuardiansWithStudents() {
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  return useQuery({
    queryKey: KEY.guardians(schoolId),
    queryFn: () => getGuardiansWithStudentsForTeacher(schoolId),
    enabled: !!schoolId,
  })
}

export function useCreateParentMessage(teacherId: string | undefined) {
  const { currentSchool } = useSchool()
  const schoolId = currentSchool?.id ?? ''
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      parentId,
      studentId,
      subject,
      message,
    }: {
      parentId: string
      studentId: string
      subject: string
      message: string
    }) => createParentMessage(schoolId, teacherId!, parentId, studentId, subject, message),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['parent-messages'] }),
  })
}

export function useMarkParentMessageRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: markParentMessageRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['parent-messages'] }),
  })
}
