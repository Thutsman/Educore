import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getParentMessagesSentByTeacher,
  getGuardiansWithStudentsForTeacher,
  createParentMessage,
  markParentMessageRead,
} from '../services/parentMessages'

const KEY = {
  sent: ['parent-messages', 'sent'] as const,
  guardians: ['parent-messages', 'guardians'] as const,
}

export function useParentMessagesSent() {
  return useQuery({
    queryKey: KEY.sent,
    queryFn: getParentMessagesSentByTeacher,
  })
}

export function useGuardiansWithStudents() {
  return useQuery({
    queryKey: KEY.guardians,
    queryFn: getGuardiansWithStudentsForTeacher,
  })
}

export function useCreateParentMessage(teacherId: string | undefined) {
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
    }) => createParentMessage(teacherId!, parentId, studentId, subject, message),
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
