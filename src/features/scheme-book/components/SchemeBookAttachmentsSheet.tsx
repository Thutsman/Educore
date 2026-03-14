import { useRef, useState } from 'react'
import { Paperclip, FileText, FileImage, Eye, Download, Trash2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import {
  useSchemeBookAttachments,
  useUploadAttachment,
  useDeleteAttachment,
} from '../hooks/useSchemeBook'
import { getAttachmentSignedUrl } from '../services/schemeBook'
import type { SchemeBook } from '../types'

const MAX_BYTES = 10 * 1024 * 1024
const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic']

function formatBytes(n: number | null): string {
  if (!n) return ''
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

async function openFile(filePath: string) {
  const url = await getAttachmentSignedUrl(filePath)
  if (url) window.open(url, '_blank')
  else toast.error('Could not open file')
}

async function downloadFile(filePath: string, fileName: string) {
  const url = await getAttachmentSignedUrl(filePath)
  if (!url) { toast.error('Could not download file'); return }
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.click()
}

export function SchemeBookAttachmentsSheet({
  scheme,
  open,
  onOpenChange,
  teacherId,
  schoolId,
  canUpload,
}: {
  scheme: SchemeBook | null
  open: boolean
  onOpenChange: (v: boolean) => void
  teacherId: string | undefined
  schoolId: string
  canUpload: boolean
}) {
  const schemeBookId = scheme?.id ?? ''
  const { data: attachments = [], isLoading } = useSchemeBookAttachments(schemeBookId)
  const upload = useUploadAttachment()
  const remove = useDeleteAttachment()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleFiles = async (files: FileList | null) => {
    if (!files || !scheme || !schoolId || !teacherId) return
    const valid = Array.from(files).filter((f) => {
      if (!ACCEPTED_TYPES.includes(f.type)) {
        toast.error(`${f.name}: unsupported file type`)
        return false
      }
      if (f.size > MAX_BYTES) {
        toast.error(`${f.name}: exceeds 10 MB limit`)
        return false
      }
      return true
    })
    if (!valid.length) return
    setUploading(true)
    let failed = 0
    for (const file of valid) {
      const ok = await upload.mutateAsync({ schemeBookId: scheme.id, file, schoolId, teacherId })
      if (ok) toast.success(`${file.name} uploaded`)
      else { toast.error(`Failed to upload ${file.name}`); failed++ }
    }
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle className="flex items-center gap-2 text-base">
            <Paperclip className="h-4 w-4 shrink-0" />
            Attachments
            {scheme && (
              <span className="truncate text-sm font-normal text-muted-foreground">
                — Wk {scheme.week}: {scheme.topic}
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : attachments.length === 0 ? (
            <div className="py-16 text-center">
              <Paperclip className="mx-auto mb-3 h-8 w-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No files attached yet</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {attachments.map((att) => {
                const isImage = att.file_type.startsWith('image/')
                return (
                  <li key={att.id} className="flex items-center gap-3 rounded-lg border bg-card p-3">
                    {isImage
                      ? <FileImage className="h-5 w-5 shrink-0 text-blue-500" />
                      : <FileText className="h-5 w-5 shrink-0 text-red-500" />
                    }
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{att.file_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatBytes(att.file_size)}
                        {att.file_size ? ' · ' : ''}
                        {new Date(att.uploaded_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button
                        size="icon" variant="ghost" className="h-7 w-7"
                        title="View" onClick={() => openFile(att.file_path)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon" variant="ghost" className="h-7 w-7"
                        title="Download" onClick={() => downloadFile(att.file_path, att.file_name)}
                      >
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                      {canUpload && (
                        <Button
                          size="icon" variant="ghost"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          title="Remove"
                          onClick={() =>
                            remove.mutate({
                              attachmentId: att.id,
                              filePath: att.file_path,
                              schemeBookId: att.scheme_book_id,
                            })
                          }
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {canUpload && (
          <div className="border-t px-6 py-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,image/*"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            <Button
              variant="outline"
              className="w-full"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mr-2 h-4 w-4" />
              {uploading ? 'Uploading…' : 'Upload files'}
            </Button>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              PDF or image · up to 10 MB per file
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
