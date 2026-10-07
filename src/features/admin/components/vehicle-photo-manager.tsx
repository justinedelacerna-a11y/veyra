"use client"

import * as React from "react"
import Image from "next/image"
import {
  RiUploadCloud2Line,
  RiStarFill,
  RiStarLine,
  RiDeleteBinLine,
  RiArrowUpLine,
  RiArrowDownLine,
  RiCheckLine,
  RiAlertLine,
  RiLoader4Line,
  RiImageLine,
} from "@remixicon/react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  uploadVehiclePhotoAction,
  setPrimaryVehiclePhotoAction,
  deleteVehiclePhotoAction,
  reorderVehiclePhotosAction,
} from "@/features/admin/server/vehicle-photos-actions"
import type { VehicleImage } from "@/types"

interface VehiclePhotoManagerProps {
  vehicleId: string
  vehicleName: string
  initialImages: VehicleImage[]
}

export function VehiclePhotoManager({
  vehicleId,
  vehicleName,
  initialImages,
}: VehiclePhotoManagerProps) {
  const [images, setImages] = React.useState<VehicleImage[]>(initialImages)
  const [isUploading, setIsUploading] = React.useState(false)
  const [uploadProgress, setUploadProgress] = React.useState<string | null>(null)
  const [actionLoadingId, setActionLoadingId] = React.useState<string | null>(null)
  const [altText, setAltText] = React.useState("")
  const [makePrimary, setMakePrimary] = React.useState(false)
  const [feedback, setFeedback] = React.useState<{
    type: "success" | "error"
    message: string
  } | null>(null)

  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = React.useState(false)

  // Clear feedback after 5 seconds
  React.useEffect(() => {
    if (!feedback) return
    const timer = setTimeout(() => setFeedback(null), 5000)
    return () => clearTimeout(timer)
  }, [feedback])

  const validateAndUpload = async (file: File) => {
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
    if (!allowed.includes(file.type.toLowerCase())) {
      setFeedback({
        type: "error",
        message: `Unsupported file format (${file.type}). Please select a JPG, PNG, or WEBP image.`,
      })
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setFeedback({
        type: "error",
        message: `Image is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum allowed size is 10MB.`,
      })
      return
    }

    setIsUploading(true)
    setUploadProgress("Uploading to Supabase Storage…")
    setFeedback(null)

    try {
      const formData = new FormData()
      formData.set("vehicleId", vehicleId)
      formData.set("file", file)
      if (altText.trim()) {
        formData.set("altText", altText.trim())
      } else {
        formData.set("altText", `${vehicleName} - Veyra rental vehicle`)
      }
      formData.set("isPrimary", makePrimary ? "true" : "false")

      const result = await uploadVehiclePhotoAction(formData)

      if (!result.success || !result.data) {
        setFeedback({
          type: "error",
          message: result.message || "Failed to upload photo.",
        })
      } else {
        const newImg = result.data
        setImages((prev) => {
          if (newImg.isPrimary) {
            return [newImg, ...prev.map((img) => ({ ...img, isPrimary: false }))]
          }
          return [...prev, newImg]
        })
        setFeedback({
          type: "success",
          message: "Photo uploaded successfully and attached to vehicle.",
        })
        setAltText("")
        setMakePrimary(false)
        if (fileInputRef.current) fileInputRef.current.value = ""
      }
    } catch (err) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Upload encountered an error.",
      })
    } finally {
      setIsUploading(false)
      setUploadProgress(null)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      void validateAndUpload(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      void validateAndUpload(file)
    }
  }

  const handleSetPrimary = async (photoId: string) => {
    setActionLoadingId(photoId)
    setFeedback(null)
    try {
      const result = await setPrimaryVehiclePhotoAction(photoId, vehicleId)
      if (result.success) {
        setImages((prev) =>
          prev.map((img) => ({
            ...img,
            isPrimary: img.id === photoId,
          }))
        )
        setFeedback({
          type: "success",
          message: "Primary photo updated. This photo will be shown on cards & catalog.",
        })
      } else {
        setFeedback({
          type: "error",
          message: result.message || "Failed to update primary photo.",
        })
      }
    } catch (err) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Error setting primary photo.",
      })
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleDelete = async (photoId: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this vehicle photo?")) {
      return
    }

    setActionLoadingId(photoId)
    setFeedback(null)
    try {
      const result = await deleteVehiclePhotoAction(photoId, vehicleId)
      if (result.success) {
        setImages((prev) => {
          const filtered = prev.filter((img) => img.id !== photoId)
          // If deleted image was primary and there are still images, mark first as primary locally
          const hadPrimary = filtered.some((img) => img.isPrimary)
          if (!hadPrimary && filtered.length > 0) {
            filtered[0] = { ...filtered[0], isPrimary: true }
          }
          return filtered
        })
        setFeedback({
          type: "success",
          message: "Photo deleted from storage and vehicle gallery.",
        })
      } else {
        setFeedback({
          type: "error",
          message: result.message || "Failed to delete photo.",
        })
      }
    } catch (err) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Error deleting photo.",
      })
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleMove = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= images.length) return

    const reordered = [...images]
    const [moved] = reordered.splice(index, 1)
    reordered.splice(targetIndex, 0, moved)

    // Update local state immediately for responsive feel
    setImages(reordered)
    setActionLoadingId(moved.id)

    try {
      const ids = reordered.map((img) => img.id)
      const result = await reorderVehiclePhotosAction(vehicleId, ids)
      if (!result.success) {
        // revert on error
        setImages(images)
        setFeedback({
          type: "error",
          message: result.message || "Failed to update photo order.",
        })
      }
    } catch {
      setImages(images)
    } finally {
      setActionLoadingId(null)
    }
  }

  return (
    <section
      aria-labelledby="vehicle-photos-heading"
      className="rounded-xl border bg-card p-5 sm:p-6 space-y-6 shadow-xs"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b">
        <div>
          <div className="flex items-center gap-2">
            <h2
              id="vehicle-photos-heading"
              className="font-heading text-base font-bold text-foreground"
            >
              Vehicle Marketing Photos
            </h2>
            <Badge variant="secondary" className="font-mono text-xs">
              {images.length} {images.length === 1 ? "photo" : "photos"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Photos stored in Supabase Storage (`vehicles-marketing` bucket) and served through Next.js CDN.
          </p>
        </div>

        {images.length > 0 && (
          <div className="text-xs text-muted-foreground flex items-center gap-1.5">
            <RiStarFill className="size-3.5 text-amber-500 fill-amber-500" />
            <span>Marked photo is used as primary catalog thumbnail</span>
          </div>
        )}
      </div>

      {/* Feedback banner */}
      {feedback && (
        <div
          role="alert"
          className={`rounded-lg p-3.5 text-xs flex items-start gap-2.5 border transition-all ${
            feedback.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
              : "bg-red-500/10 border-red-500/30 text-red-800 dark:text-red-300"
          }`}
        >
          {feedback.type === "success" ? (
            <RiCheckLine className="size-4 shrink-0 mt-0.5" />
          ) : (
            <RiAlertLine className="size-4 shrink-0 mt-0.5" />
          )}
          <span className="font-medium flex-1">{feedback.message}</span>
        </div>
      )}

      {/* Upload Dropzone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-xl p-6 sm:p-8 text-center transition-all ${
          isDragging
            ? "border-primary bg-primary/5 scale-[1.005]"
            : "border-border/80 bg-muted/20 hover:bg-muted/30 hover:border-primary/50"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/jpg"
          onChange={handleFileChange}
          disabled={isUploading}
          className="hidden"
          id="vehicle-photo-upload-input"
        />

        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            {isUploading ? (
              <RiLoader4Line className="size-7 animate-spin" />
            ) : (
              <RiUploadCloud2Line className="size-7" />
            )}
          </div>

          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">
              {isUploading ? uploadProgress : "Upload real vehicle photo"}
            </p>
            <p className="text-xs text-muted-foreground max-w-md">
              Drag & drop a photo here, or click to browse. JPG, PNG, or WEBP up to 10MB.
            </p>
          </div>

          {/* Optional alt text and primary toggle before upload */}
          <div className="flex flex-col sm:flex-row items-center gap-2 pt-2 w-full max-w-md">
            <input
              type="text"
              placeholder={`Alt text (default: ${vehicleName})`}
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              disabled={isUploading}
              className="w-full text-xs px-3 py-1.5 rounded-lg border bg-background text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
            />
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={makePrimary}
                onChange={(e) => setMakePrimary(e.target.checked)}
                disabled={isUploading}
                className="rounded border-border text-primary focus:ring-primary size-3.5"
              />
              <span>Set as primary</span>
            </label>
          </div>

          <div className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="gap-1.5 text-xs font-semibold"
            >
              <RiImageLine className="size-4" data-icon="inline-start" />
              <span>Choose Photo File</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Photo Gallery Grid */}
      {images.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center bg-muted/10 space-y-2">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <RiImageLine className="size-6" />
          </div>
          <h3 className="font-heading text-sm font-semibold text-foreground">
            No photos uploaded yet
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            This vehicle is currently using the professional Veyra fallback in the customer catalog.
            Upload photos above to display real images.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {images.map((photo, index) => {
            const isLoading = actionLoadingId === photo.id
            return (
              <div
                key={photo.id}
                className={`group relative rounded-xl border bg-card overflow-hidden transition-all shadow-xs ${
                  photo.isPrimary
                    ? "ring-2 ring-primary border-primary shadow-sm"
                    : "hover:border-primary/40"
                }`}
              >
                {/* Photo Preview Container */}
                <div className="relative aspect-16/10 w-full bg-muted/40 overflow-hidden">
                  <Image
                    src={photo.url}
                    alt={photo.altText || `${vehicleName} - Photo ${index + 1}`}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover object-center group-hover:scale-102 transition-transform duration-300"
                    unoptimized={photo.url.startsWith("data:")}
                  />

                  {/* Primary Badge */}
                  {photo.isPrimary ? (
                    <div className="absolute top-2.5 left-2.5 z-10">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-primary text-primary-foreground px-2 py-0.5 rounded-md shadow-xs">
                        <RiStarFill className="size-3 fill-primary-foreground" />
                        <span>Primary Photo</span>
                      </span>
                    </div>
                  ) : (
                    <div className="absolute top-2.5 left-2.5 z-10">
                      <span className="text-[10px] font-mono font-medium bg-background/80 backdrop-blur-xs text-muted-foreground px-1.5 py-0.5 rounded border">
                        #{index + 1}
                      </span>
                    </div>
                  )}

                  {/* Loading indicator overlay */}
                  {isLoading && (
                    <div className="absolute inset-0 bg-background/60 backdrop-blur-xs flex items-center justify-center z-20">
                      <RiLoader4Line className="size-6 animate-spin text-primary" />
                    </div>
                  )}
                </div>

                {/* Card Controls & Info */}
                <div className="p-3 space-y-2 border-t bg-card">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground truncate font-mono text-[11px] max-w-[140px]">
                      {photo.storagePath.split("/").pop()}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(photo.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-border/60">
                    <div className="flex items-center gap-1">
                      {/* Set as primary button */}
                      {!photo.isPrimary && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="xs"
                          disabled={isLoading}
                          onClick={() => handleSetPrimary(photo.id)}
                          className="gap-1 text-[11px] text-muted-foreground hover:text-foreground h-7 px-2"
                        >
                          <RiStarLine className="size-3.5 text-amber-500" />
                          <span>Make Primary</span>
                        </Button>
                      )}

                      {/* Reorder buttons */}
                      {images.length > 1 && (
                        <div className="flex items-center">
                          <button
                            type="button"
                            title="Move Up"
                            disabled={index === 0 || isLoading}
                            onClick={() => handleMove(index, "up")}
                            className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:hover:text-muted-foreground"
                          >
                            <RiArrowUpLine className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            title="Move Down"
                            disabled={index === images.length - 1 || isLoading}
                            onClick={() => handleMove(index, "down")}
                            className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:hover:text-muted-foreground"
                          >
                            <RiArrowDownLine className="size-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Delete button */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      disabled={isLoading}
                      onClick={() => handleDelete(photo.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 px-2"
                      title="Delete Photo"
                    >
                      <RiDeleteBinLine className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
