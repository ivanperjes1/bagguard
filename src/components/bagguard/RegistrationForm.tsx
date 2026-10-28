
"use client";

import Image from "next/image";
import { useEffect, useState, type FormEvent } from "react";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ImagePlus,
  LoaderCircle,
} from "lucide-react";

import { registerBag } from "@/lib/data-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { departments, type Department } from "@/lib/bagguard-types";

interface RegistrationFormProps {
  className?: string;
}

interface UploadedPhoto {
  file: File;
  previewUrl: string;
}

const MAX_PHOTO_SIZE = 700 * 1024;

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.addEventListener(
      "load",
      () => {
        if (typeof reader.result === "string") {
          resolve(reader.result);
        } else {
          reject(
            new Error(
              "We couldn't read that bag photo. Please try again."
            )
          );
        }
      },
      { once: true }
    );

    reader.addEventListener(
      "error",
      () =>
        reject(
          new Error(
            "We couldn't read that bag photo. Please try again."
          )
        ),
      { once: true }
    );

    reader.readAsDataURL(file);
  });
}

export function RegistrationForm({
  className = "",
}: RegistrationFormProps) {
  const [photo, setPhoto] = useState<UploadedPhoto | null>(null);
  const [department, setDepartment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registrationId, setRegistrationId] = useState<string | null>(
    null
  );

  useEffect(() => {
    return () => {
      if (photo) {
        URL.revokeObjectURL(photo.previewUrl);
      }
    };
  }, [photo]);

  function selectPhoto(file: File | undefined) {
    setError(null);
    setRegistrationId(null);

    if (!file) {
      setPhoto(null);
      return;
    }

    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      setPhoto(null);
      setError("Choose a JPG, PNG, or WebP photo of your bag.");
      return;
    }

    if (file.size > MAX_PHOTO_SIZE) {
      setPhoto(null);
      setError("The bag photo must be smaller than 700 KB.");
      return;
    }

    setPhoto({
      file,
      previewUrl: URL.createObjectURL(file),
    });
  }

  async function submitRegistration(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (submitting) return;

    setSubmitting(true);
    setError(null);
    setRegistrationId(null);

    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      const studentName = String(
        formData.get("studentName") ?? ""
      ).trim();

      const usn = String(formData.get("usn") ?? "")
        .trim()
        .toUpperCase();

      const bagDescription = String(
        formData.get("bagDescription") ?? ""
      ).trim();

      if (studentName.length < 2) {
        throw new Error("Please enter your full name.");
      }

      if (usn.length < 5) {
        throw new Error("Please enter a valid student ID or USN.");
      }

      if (
        !departments.some((item) => item === department)
      ) {
        throw new Error("Please select your department.");
      }

      if (bagDescription.length < 5) {
        throw new Error(
          "Please provide a more detailed bag description."
        );
      }

      const imageUrl = photo
        ? await fileToDataUrl(photo.file)
        : null;

      const result = await registerBag({
        studentName,
        usn,
        department: department as Department,
        bagDescription,
        imageUrl,
      });

      if (!result?.id) {
        throw new Error(
          "The registration was submitted, but no reference ID was returned. Please check your registrations before trying again."
        );
      }

      setRegistrationId(result.id);
      form.reset();
      setPhoto(null);
      setDepartment("");

      const fileInput = form.querySelector<HTMLInputElement>(
        'input[name="bagPhoto"]'
      );

      if (fileInput) {
        fileInput.value = "";
      }
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "We couldn't submit your registration. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={submitRegistration}
      className={`space-y-6 ${className}`}
    >
      {registrationId && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-xl border border-chart-2/30 bg-chart-2/10 p-4 text-sm"
        >
          <CheckCircle2
            className="mt-0.5 shrink-0 text-chart-2"
            size={19}
          />

          <div className="min-w-0">
            <p className="font-semibold text-foreground">
              Registration received
            </p>

            <p className="mt-1 text-muted-foreground">
              Your request has been submitted. Save this reference:
            </p>

            <p className="mt-2 break-all font-mono font-semibold text-foreground">
              {registrationId}
            </p>

            <p className="mt-1 text-muted-foreground">
              Your bag registration is awaiting staff approval.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-destructive/25 bg-destructive/10 p-4 text-sm text-destructive"
        >
          <AlertCircle
            className="mt-0.5 shrink-0"
            size={18}
          />
          <p>{error}</p>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="space-y-2 text-sm font-semibold">
          <span className="block">Full name</span>

          <Input
            name="studentName"
            required
            minLength={2}
            maxLength={120}
            autoComplete="name"
            placeholder="Student's full name"
            className="h-12 rounded-lg bg-background px-3.5 text-sm font-normal"
          />
        </label>

        <label className="space-y-2 text-sm font-semibold">
          <span className="block">Student ID / USN</span>

          <Input
            name="usn"
            required
            minLength={5}
            maxLength={32}
            autoComplete="off"
            placeholder="Enter your student number"
            className="h-12 rounded-lg bg-background px-3.5 font-mono text-sm font-normal uppercase"
          />
        </label>
      </div>

      {/* Department dropdown */}
      <label
        htmlFor="department"
        className="block space-y-2 text-sm font-semibold"
      >
        <span className="block">
          Department / classification
        </span>

        <select
          id="department"
          name="department"
          required
          value={department}
          onChange={(event) => {
            setDepartment(event.target.value);
            setError(null);
            setRegistrationId(null);
          }}
          className="h-12 w-full appearance-auto rounded-lg border border-input bg-background px-3.5 text-sm font-normal text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <option value="" disabled>
            Select your department
          </option>

          {departments.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </label>

      {/* Bag description */}
      <label className="block space-y-2 text-sm font-semibold">
        <span className="block">Bag description</span>

        <Textarea
          name="bagDescription"
          required
          minLength={5}
          maxLength={500}
          rows={4}
          placeholder="Brand, color, size, distinctive details..."
          className="min-h-28 resize-y rounded-lg bg-background px-3.5 py-3 text-sm font-normal"
        />

        <span className="block text-xs font-normal text-muted-foreground">
          Include the brand, color, size, and details staff can use
          to identify your bag.
        </span>
      </label>

      {/* Optional bag photo */}
      <div className="space-y-2">
        <label
          htmlFor="bag-photo"
          className="block text-sm font-semibold"
        >
          Bag photo{" "}
          <span className="font-normal text-muted-foreground">
            (optional)
          </span>
        </label>

        <label
          htmlFor="bag-photo"
          className="flex min-h-28 cursor-pointer items-center gap-4 rounded-xl border border-dashed border-border bg-muted/50 p-4 transition-colors hover:border-primary/40 hover:bg-muted"
        >
          {photo ? (
            <Image
              src={photo.previewUrl}
              alt="Preview of selected bag"
              width={104}
              height={80}
              unoptimized
              className="h-20 w-26 shrink-0 rounded-lg object-cover"
            />
          ) : (
            <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-card text-primary">
              <ImagePlus size={20} />
            </span>
          )}

          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold">
              {photo?.file.name ?? "Add a clear photo of your bag"}
            </span>

            <span className="mt-1 block text-xs leading-5 text-muted-foreground">
              JPG, PNG, or WebP · maximum 700 KB. Avoid including
              faces, IDs, or personal documents.
            </span>
          </span>

          <span className="shrink-0 rounded-md border border-border bg-card px-3 py-2 text-xs font-semibold">
            Browse
          </span>
        </label>

        <Input
          id="bag-photo"
          name="bagPhoto"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={(event) =>
            selectPhoto(event.target.files?.[0])
          }
        />

        {photo && (
          <button
            type="button"
            onClick={() => {
              setPhoto(null);

              const input = document.getElementById(
                "bag-photo"
              ) as HTMLInputElement | null;

              if (input) input.value = "";
            }}
            className="text-xs font-medium text-destructive hover:underline"
          >
            Remove selected photo
          </button>
        )}
      </div>

      {/* Submit */}
      <div className="flex flex-col gap-4 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-md text-xs leading-5 text-muted-foreground">
          By submitting, you confirm that the information describes
          the bag you intend to bring to campus. AMA Lipa staff will
          review your registration.
        </p>

        <Button
          type="submit"
          disabled={submitting}
          variant="secondary"
          className="min-h-12 shrink-0 rounded-lg px-5 text-sm font-semibold"
        >
          {submitting ? (
            <LoaderCircle
              className="animate-spin"
              size={17}
            />
          ) : (
            <ArrowRight size={16} />
          )}

          {submitting
            ? "Submitting..."
            : "Submit for review"}
        </Button>
      </div>
    </form>
  );
}
