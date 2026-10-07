"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { uploadCustomerDocumentAction, ValidDocumentType } from "@/features/account/server/document-actions"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  RiUploadLine,
  RiLoader4Line,
  RiCheckLine,
  RiAlertLine,
  RiShieldCheckLine,
} from "@remixicon/react"

interface DocumentUploadDialogProps {
  documentType: ValidDocumentType
  documentTitle: string
  isReplacement?: boolean
}

export function DocumentUploadDialog({
  documentType,
  documentTitle,
  isReplacement = false,
}: DocumentUploadDialogProps) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [file, setFile] = React.useState<File | null>(null)
  const [isUploading, setIsUploading] = React.useState(false)
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null)
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0]
      if (selected.size > 10 * 1024 * 1024) {
        setErrorMsg("Selected file exceeds the 10 MB limit.")
        setFile(null)
        return
      }
      setFile(selected)
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      setErrorMsg("Please select a file to upload.")
      return
    }

    setIsUploading(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("documentType", documentType)

      const result = await uploadCustomerDocumentAction(formData)

      if (!result.success) {
        setErrorMsg(result.message || "Upload failed. Please try again.")
        setIsUploading(false)
        return
      }

      setSuccessMsg("Document uploaded securely and queued for verification.")
      setTimeout(() => {
        setOpen(false)
        setFile(null)
        setSuccessMsg(null)
        router.refresh()
      }, 1500)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "An unexpected error occurred.")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 text-xs font-medium"
          />
        }
      >
        <RiUploadLine className="size-3.5" />
        <span>{isReplacement ? "Upload Replacement" : "Upload Document"}</span>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleUpload}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RiShieldCheckLine className="size-5 text-primary" />
              Upload {documentTitle}
            </DialogTitle>
            <DialogDescription>
              Submit your document securely for identity verification. File is stored in encrypted private storage and accessible only by authorized verification staff.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {errorMsg && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2">
                <RiAlertLine className="size-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                <RiCheckLine className="size-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="doc-file" className="text-xs font-medium">
                Select Document File
              </Label>
              <Input
                id="doc-file"
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
                onChange={handleFileChange}
                disabled={isUploading}
                className="text-xs file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-primary/10 file:text-primary cursor-pointer"
              />
              <p className="text-[11px] text-muted-foreground">
                Accepted formats: JPEG, PNG, WebP, PDF. Maximum size: 10 MB.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isUploading}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!file || isUploading}
              className="gap-1.5"
            >
              {isUploading ? (
                <>
                  <RiLoader4Line className="size-3.5 animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <RiUploadLine className="size-3.5" />
                  <span>Submit Document</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
