import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSchool } from '@/context/SchoolContext'
import {
  approveRequisitionHM,
  addQuote,
  countPendingProcurementApprovals,
  createDraftRequisition,
  deleteQuote,
  getRequisitionExpensePrefill,
  getRequisitionWithQuotes,
  getSchoolProcurementInitiator,
  linkRequisitionExpense,
  listRequisitions,
  markRequisitionOrdered,
  rejectRequisitionHM,
  setSelectedQuote,
  submitRequisition,
  updateDraftRequisition,
  updateSchoolProcurementInitiator,
} from '@/features/procurement/services/procurement'
import type {
  CreateRequisitionInput,
  MarkOrderedInput,
  ProcurementInitiator,
  QuoteInput,
  UpdateDraftRequisitionInput,
} from '@/features/procurement/types'

const procurementInvalidationPrefix = ['procurement'] as const

function useProcurementSchoolId(): string {
  const { currentSchool } = useSchool()
  return currentSchool?.id ?? ''
}

export const procurementKeys = {
  initiator: (schoolId: string) => [...procurementInvalidationPrefix, 'initiator', schoolId] as const,
  list: (schoolId: string) => [...procurementInvalidationPrefix, 'requisitions', schoolId] as const,
  detail: (schoolId: string, id: string | null) => [...procurementInvalidationPrefix, 'requisition', schoolId, id] as const,
  pendingHmCount: (schoolId: string) => [...procurementInvalidationPrefix, 'pending-hm-count', schoolId] as const,
  prefill: (schoolId: string, requisitionId: string | null) =>
    [...procurementKeys.detail(schoolId, requisitionId), 'prefill'] as const,
}

export function useSchoolProcurementInitiator() {
  const schoolId = useProcurementSchoolId()
  return useQuery({
    queryKey: procurementKeys.initiator(schoolId),
    queryFn: () => getSchoolProcurementInitiator(schoolId),
    enabled: !!schoolId,
  })
}

export function usePendingHmProcurementCount() {
  const schoolId = useProcurementSchoolId()
  return useQuery({
    queryKey: procurementKeys.pendingHmCount(schoolId),
    queryFn: () => countPendingProcurementApprovals(schoolId),
    enabled: !!schoolId,
  })
}

export function useProcurementInitiatorMutation() {
  const qc = useQueryClient()
  const schoolId = useProcurementSchoolId()
  return useMutation({
    mutationFn: (value: ProcurementInitiator) => updateSchoolProcurementInitiator(schoolId, value),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: procurementKeys.initiator(schoolId) })
    },
  })
}

export function useRequisitions() {
  const schoolId = useProcurementSchoolId()
  return useQuery({
    queryKey: procurementKeys.list(schoolId),
    queryFn: () => listRequisitions(schoolId),
    enabled: !!schoolId,
  })
}

export function useRequisitionDetail(id: string | null) {
  const schoolId = useProcurementSchoolId()
  return useQuery({
    queryKey: procurementKeys.detail(schoolId, id),
    queryFn: () => getRequisitionWithQuotes(schoolId, id!),
    enabled: !!schoolId && !!id,
  })
}

export function useRequisitionExpensePrefill(requisitionId: string | null) {
  const schoolId = useProcurementSchoolId()
  return useQuery({
    queryKey: procurementKeys.prefill(schoolId, requisitionId),
    queryFn: () => getRequisitionExpensePrefill(schoolId, requisitionId!),
    enabled: !!schoolId && !!requisitionId,
  })
}

function useInvalidateProcurement() {
  const qc = useQueryClient()
  const schoolId = useProcurementSchoolId()
  return (detailId?: string | null) => {
    qc.invalidateQueries({ queryKey: procurementInvalidationPrefix })
    if (detailId) qc.invalidateQueries({ queryKey: procurementKeys.detail(schoolId, detailId) })
  }
}

export function useProcurementCommands() {
  const schoolId = useProcurementSchoolId()
  const inv = useInvalidateProcurement()

  const createDraft = useMutation({
    mutationFn: ({ userId, input }: { userId: string; input: CreateRequisitionInput }) =>
      createDraftRequisition(schoolId, userId, input),
    onSuccess: () => inv(),
  })

  const updateDraft = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateDraftRequisitionInput }) =>
      updateDraftRequisition(schoolId, id, input),
    onSuccess: (_, v) => inv(v.id),
  })

  const submit = useMutation({
    mutationFn: (id: string) => submitRequisition(schoolId, id),
    onSuccess: (_, id) => inv(id),
  })

  const approveHm = useMutation({
    mutationFn: ({ id, userId }: { id: string; userId: string }) => approveRequisitionHM(id, schoolId, userId),
    onSuccess: (_, v) => inv(v.id),
  })

  const rejectHm = useMutation({
    mutationFn: ({ id, userId, reason }: { id: string; userId: string; reason: string }) =>
      rejectRequisitionHM(id, schoolId, userId, reason),
    onSuccess: (_, v) => inv(v.id),
  })

  const markOrdered = useMutation({
    mutationFn: ({ id, input }: { id: string; input: MarkOrderedInput }) =>
      markRequisitionOrdered(schoolId, id, input),
    onSuccess: (_, v) => inv(v.id),
  })

  const linkExpense = useMutation({
    mutationFn: ({ requisitionId, expenseId }: { requisitionId: string; expenseId: string }) =>
      linkRequisitionExpense(schoolId, requisitionId, expenseId),
    onSuccess: (_, v) => inv(v.requisitionId),
  })

  const addQuoteMut = useMutation({
    mutationFn: ({ requisitionId, input }: { requisitionId: string; input: QuoteInput }) =>
      addQuote(requisitionId, input),
    onSuccess: (_, v) => inv(v.requisitionId),
  })

  const deleteQuoteMut = useMutation({
    mutationFn: (vars: { quoteId: string; requisitionId: string }) => deleteQuote(vars.quoteId),
    onSuccess: (_, v) => inv(v.requisitionId),
  })

  const selectQuoteMut = useMutation({
    mutationFn: ({ requisitionId, quoteId }: { requisitionId: string; quoteId: string }) =>
      setSelectedQuote(requisitionId, quoteId),
    onSuccess: (_, v) => inv(v.requisitionId),
  })

  return {
    createDraft,
    updateDraft,
    submit,
    approveHm,
    rejectHm,
    markOrdered,
    linkExpense,
    addQuoteMut,
    deleteQuoteMut,
    selectQuoteMut,
  }
}
