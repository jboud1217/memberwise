-- Add missing columns to Organization
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "siteDocument" JSONB;
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "emailProvider" TEXT;
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "emailSettings" JSONB;

-- Add missing columns to Member
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "doNotEmail" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "doNotMail" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "engagementScore" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "lastEngagedAt" TIMESTAMP(3);

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "EventFormat" AS ENUM ('IN_PERSON', 'VIRTUAL', 'HYBRID');

-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('REGISTERED', 'WAITLISTED', 'CHECKED_IN', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "RSVPType" AS ENUM ('REQUIRED', 'OPTIONAL', 'NONE');

-- CreateEnum
CREATE TYPE "AutomationTrigger" AS ENUM ('MEMBER_JOINED', 'MEMBER_LAPSED', 'RENEWAL_DUE', 'PAYMENT_RECEIVED', 'STATUS_CHANGED', 'SCHEDULED', 'MANUAL');

-- CreateEnum
CREATE TYPE "AutomationActionType" AS ENUM ('SEND_EMAIL', 'UPDATE_STATUS', 'NOTIFY_ADMIN', 'WAIT');

-- CreateEnum
CREATE TYPE "AutomationStatus" AS ENUM ('ACTIVE', 'PAUSED', 'DRAFT');

-- CreateEnum
CREATE TYPE "CustomFieldType" AS ENUM ('TEXT', 'NUMBER', 'DATE', 'BOOLEAN', 'SELECT', 'MULTI_SELECT', 'URL', 'EMAIL', 'PHONE');

-- CreateEnum
CREATE TYPE "CustomFieldEntity" AS ENUM ('MEMBER', 'CONTACT');

-- CreateEnum
CREATE TYPE "DonationStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "DonationType" AS ENUM ('ONE_TIME', 'RECURRING');

-- CreateEnum
CREATE TYPE "CommitteeRole" AS ENUM ('CHAIR', 'VICE_CHAIR', 'SECRETARY', 'TREASURER', 'MEMBER');

-- CreateEnum
CREATE TYPE "FormStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CLOSED');

-- CreateTable
CREATE TABLE "CustomField" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "type" "CustomFieldType" NOT NULL DEFAULT 'TEXT',
    "entity" "CustomFieldEntity" NOT NULL DEFAULT 'MEMBER',
    "description" TEXT,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "options" TEXT[],
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomFieldValue" (
    "id" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "memberId" TEXT,
    "contactId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomFieldValue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "memberId" TEXT,
    "contactId" TEXT,
    "userId" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "body" TEXT,
    "status" "EventStatus" NOT NULL DEFAULT 'DRAFT',
    "format" "EventFormat" NOT NULL DEFAULT 'IN_PERSON',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'America/New_York',
    "allDay" BOOLEAN NOT NULL DEFAULT false,
    "recurrenceRule" TEXT,
    "venueName" TEXT,
    "address1" TEXT,
    "address2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zip" TEXT,
    "country" TEXT,
    "virtualUrl" TEXT,
    "capacity" INTEGER,
    "waitlistEnabled" BOOLEAN NOT NULL DEFAULT false,
    "registrationCount" INTEGER NOT NULL DEFAULT 0,
    "waitlistCount" INTEGER NOT NULL DEFAULT 0,
    "rsvpType" "RSVPType" NOT NULL DEFAULT 'REQUIRED',
    "registrationOpens" TIMESTAMP(3),
    "registrationCloses" TIMESTAMP(3),
    "allowGuests" BOOLEAN NOT NULL DEFAULT false,
    "maxGuestsPerRegistration" INTEGER NOT NULL DEFAULT 0,
    "requireApproval" BOOLEAN NOT NULL DEFAULT false,
    "isFree" BOOLEAN NOT NULL DEFAULT true,
    "memberPrice" INTEGER,
    "nonMemberPrice" INTEGER,
    "earlyBirdPrice" INTEGER,
    "earlyBirdDeadline" TIMESTAMP(3),
    "coverImage" TEXT,
    "tags" TEXT[],
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "checkedInCount" INTEGER NOT NULL DEFAULT 0,
    "allowedTierIds" TEXT[],
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventTicketType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" INTEGER NOT NULL DEFAULT 0,
    "capacity" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "memberPrice" INTEGER,
    "soldCount" INTEGER NOT NULL DEFAULT 0,
    "eventId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventTicketType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventRegistration" (
    "id" TEXT NOT NULL,
    "status" "RegistrationStatus" NOT NULL DEFAULT 'REGISTERED',
    "guestName" TEXT,
    "guestEmail" TEXT,
    "guestPhone" TEXT,
    "guestCount" INTEGER NOT NULL DEFAULT 0,
    "amountPaid" INTEGER NOT NULL DEFAULT 0,
    "stripePaymentId" TEXT,
    "checkedInAt" TIMESTAMP(3),
    "customResponses" JSONB,
    "notes" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "memberId" TEXT,
    "contactId" TEXT,
    "ticketTypeId" TEXT,
    "eventId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Automation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "trigger" "AutomationTrigger" NOT NULL,
    "triggerConfig" JSONB,
    "status" "AutomationStatus" NOT NULL DEFAULT 'DRAFT',
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Automation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutomationStep" (
    "id" TEXT NOT NULL,
    "action" "AutomationActionType" NOT NULL,
    "config" JSONB NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "automationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutomationStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutomationRun" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'running',
    "currentStep" INTEGER NOT NULL DEFAULT 0,
    "nextRunAt" TIMESTAMP(3),
    "error" TEXT,
    "memberId" TEXT,
    "contactId" TEXT,
    "automationId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "AutomationRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "link" TEXT,
    "metadata" JSONB,
    "userId" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentFolder" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "parentId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "memberOnly" BOOLEAN NOT NULL DEFAULT true,
    "allowedTierIds" TEXT[],
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentFolder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL DEFAULT 0,
    "mimeType" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "folderId" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "memberOnly" BOOLEAN NOT NULL DEFAULT true,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "uploadedById" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DonationCampaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "goalAmount" INTEGER,
    "raisedAmount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "coverImage" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DonationCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Donation" (
    "id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" "DonationStatus" NOT NULL DEFAULT 'PENDING',
    "type" "DonationType" NOT NULL DEFAULT 'ONE_TIME',
    "donorName" TEXT,
    "donorEmail" TEXT,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "message" TEXT,
    "recurringInterval" TEXT,
    "stripeSubscriptionId" TEXT,
    "stripePaymentId" TEXT,
    "paidAt" TIMESTAMP(3),
    "memberId" TEXT,
    "campaignId" TEXT,
    "receiptSent" BOOLEAN NOT NULL DEFAULT false,
    "receiptSentAt" TIMESTAMP(3),
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Donation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VolunteerOpportunity" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "date" TIMESTAMP(3),
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "spotsAvailable" INTEGER,
    "skills" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VolunteerOpportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VolunteerLog" (
    "id" TEXT NOT NULL,
    "hours" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "approvedById" TEXT,
    "memberId" TEXT NOT NULL,
    "opportunityId" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VolunteerLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Committee" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "purpose" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "meetingSchedule" TEXT,
    "meetingLocation" TEXT,
    "meetingUrl" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Committee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommitteeMember" (
    "id" TEXT NOT NULL,
    "role" "CommitteeRole" NOT NULL DEFAULT 'MEMBER',
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "memberId" TEXT NOT NULL,
    "contactId" TEXT,
    "committeeId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommitteeMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Form" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "FormStatus" NOT NULL DEFAULT 'DRAFT',
    "slug" TEXT NOT NULL,
    "fields" JSONB NOT NULL,
    "settings" JSONB,
    "maxResponses" INTEGER,
    "responseCount" INTEGER NOT NULL DEFAULT 0,
    "closesAt" TIMESTAMP(3),
    "formType" TEXT NOT NULL DEFAULT 'general',
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Form_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormResponse" (
    "id" TEXT NOT NULL,
    "answers" JSONB NOT NULL,
    "respondentName" TEXT,
    "respondentEmail" TEXT,
    "memberId" TEXT,
    "formId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FormResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: CustomField
CREATE UNIQUE INDEX "CustomField_organizationId_key_key" ON "CustomField"("organizationId", "key");
CREATE INDEX "CustomField_organizationId_idx" ON "CustomField"("organizationId");

-- CreateIndex: CustomFieldValue
CREATE UNIQUE INDEX "CustomFieldValue_fieldId_memberId_key" ON "CustomFieldValue"("fieldId", "memberId");
CREATE UNIQUE INDEX "CustomFieldValue_fieldId_contactId_key" ON "CustomFieldValue"("fieldId", "contactId");
CREATE INDEX "CustomFieldValue_memberId_idx" ON "CustomFieldValue"("memberId");
CREATE INDEX "CustomFieldValue_contactId_idx" ON "CustomFieldValue"("contactId");

-- CreateIndex: ActivityLog
CREATE INDEX "ActivityLog_organizationId_idx" ON "ActivityLog"("organizationId");
CREATE INDEX "ActivityLog_organizationId_createdAt_idx" ON "ActivityLog"("organizationId", "createdAt");

-- CreateIndex: Event
CREATE UNIQUE INDEX "Event_organizationId_slug_key" ON "Event"("organizationId", "slug");
CREATE INDEX "Event_organizationId_idx" ON "Event"("organizationId");
CREATE INDEX "Event_organizationId_status_idx" ON "Event"("organizationId", "status");
CREATE INDEX "Event_organizationId_startDate_idx" ON "Event"("organizationId", "startDate");

-- CreateIndex: EventTicketType
CREATE INDEX "EventTicketType_eventId_idx" ON "EventTicketType"("eventId");

-- CreateIndex: EventRegistration
CREATE INDEX "EventRegistration_eventId_idx" ON "EventRegistration"("eventId");
CREATE INDEX "EventRegistration_memberId_idx" ON "EventRegistration"("memberId");
CREATE INDEX "EventRegistration_organizationId_idx" ON "EventRegistration"("organizationId");

-- CreateIndex: Automation
CREATE INDEX "Automation_organizationId_idx" ON "Automation"("organizationId");
CREATE INDEX "Automation_organizationId_status_idx" ON "Automation"("organizationId", "status");

-- CreateIndex: AutomationStep
CREATE INDEX "AutomationStep_automationId_idx" ON "AutomationStep"("automationId");

-- CreateIndex: AutomationRun
CREATE INDEX "AutomationRun_automationId_idx" ON "AutomationRun"("automationId");
CREATE INDEX "AutomationRun_organizationId_idx" ON "AutomationRun"("organizationId");
CREATE INDEX "AutomationRun_status_nextRunAt_idx" ON "AutomationRun"("status", "nextRunAt");

-- CreateIndex: Notification
CREATE INDEX "Notification_organizationId_idx" ON "Notification"("organizationId");
CREATE INDEX "Notification_organizationId_userId_read_idx" ON "Notification"("organizationId", "userId", "read");
CREATE INDEX "Notification_organizationId_createdAt_idx" ON "Notification"("organizationId", "createdAt");

-- CreateIndex: DocumentFolder
CREATE INDEX "DocumentFolder_organizationId_idx" ON "DocumentFolder"("organizationId");
CREATE INDEX "DocumentFolder_parentId_idx" ON "DocumentFolder"("parentId");

-- CreateIndex: Document
CREATE INDEX "Document_organizationId_idx" ON "Document"("organizationId");
CREATE INDEX "Document_folderId_idx" ON "Document"("folderId");

-- CreateIndex: DonationCampaign
CREATE INDEX "DonationCampaign_organizationId_idx" ON "DonationCampaign"("organizationId");

-- CreateIndex: Donation
CREATE INDEX "Donation_organizationId_idx" ON "Donation"("organizationId");
CREATE INDEX "Donation_memberId_idx" ON "Donation"("memberId");
CREATE INDEX "Donation_campaignId_idx" ON "Donation"("campaignId");

-- CreateIndex: VolunteerOpportunity
CREATE INDEX "VolunteerOpportunity_organizationId_idx" ON "VolunteerOpportunity"("organizationId");

-- CreateIndex: VolunteerLog
CREATE INDEX "VolunteerLog_organizationId_idx" ON "VolunteerLog"("organizationId");
CREATE INDEX "VolunteerLog_memberId_idx" ON "VolunteerLog"("memberId");
CREATE INDEX "VolunteerLog_opportunityId_idx" ON "VolunteerLog"("opportunityId");

-- CreateIndex: Committee
CREATE INDEX "Committee_organizationId_idx" ON "Committee"("organizationId");

-- CreateIndex: CommitteeMember
CREATE UNIQUE INDEX "CommitteeMember_memberId_committeeId_key" ON "CommitteeMember"("memberId", "committeeId");
CREATE INDEX "CommitteeMember_committeeId_idx" ON "CommitteeMember"("committeeId");
CREATE INDEX "CommitteeMember_organizationId_idx" ON "CommitteeMember"("organizationId");

-- CreateIndex: Form
CREATE UNIQUE INDEX "Form_organizationId_slug_key" ON "Form"("organizationId", "slug");
CREATE INDEX "Form_organizationId_idx" ON "Form"("organizationId");

-- CreateIndex: FormResponse
CREATE INDEX "FormResponse_formId_idx" ON "FormResponse"("formId");
CREATE INDEX "FormResponse_organizationId_idx" ON "FormResponse"("organizationId");

-- AddForeignKey: CustomField
ALTER TABLE "CustomField" ADD CONSTRAINT "CustomField_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: CustomFieldValue
ALTER TABLE "CustomFieldValue" ADD CONSTRAINT "CustomFieldValue_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "CustomField"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CustomFieldValue" ADD CONSTRAINT "CustomFieldValue_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CustomFieldValue" ADD CONSTRAINT "CustomFieldValue_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: ActivityLog
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: Event
ALTER TABLE "Event" ADD CONSTRAINT "Event_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: EventTicketType
ALTER TABLE "EventTicketType" ADD CONSTRAINT "EventTicketType_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: EventRegistration
ALTER TABLE "EventRegistration" ADD CONSTRAINT "EventRegistration_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "EventRegistration" ADD CONSTRAINT "EventRegistration_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "EventRegistration" ADD CONSTRAINT "EventRegistration_ticketTypeId_fkey" FOREIGN KEY ("ticketTypeId") REFERENCES "EventTicketType"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "EventRegistration" ADD CONSTRAINT "EventRegistration_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EventRegistration" ADD CONSTRAINT "EventRegistration_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: Automation
ALTER TABLE "Automation" ADD CONSTRAINT "Automation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: AutomationStep
ALTER TABLE "AutomationStep" ADD CONSTRAINT "AutomationStep_automationId_fkey" FOREIGN KEY ("automationId") REFERENCES "Automation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: AutomationRun
ALTER TABLE "AutomationRun" ADD CONSTRAINT "AutomationRun_automationId_fkey" FOREIGN KEY ("automationId") REFERENCES "Automation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: Notification
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: DocumentFolder
ALTER TABLE "DocumentFolder" ADD CONSTRAINT "DocumentFolder_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "DocumentFolder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DocumentFolder" ADD CONSTRAINT "DocumentFolder_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: Document
ALTER TABLE "Document" ADD CONSTRAINT "Document_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "DocumentFolder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Document" ADD CONSTRAINT "Document_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: DonationCampaign
ALTER TABLE "DonationCampaign" ADD CONSTRAINT "DonationCampaign_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: Donation
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "DonationCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: VolunteerOpportunity
ALTER TABLE "VolunteerOpportunity" ADD CONSTRAINT "VolunteerOpportunity_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: VolunteerLog
ALTER TABLE "VolunteerLog" ADD CONSTRAINT "VolunteerLog_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VolunteerLog" ADD CONSTRAINT "VolunteerLog_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "VolunteerOpportunity"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "VolunteerLog" ADD CONSTRAINT "VolunteerLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: Committee
ALTER TABLE "Committee" ADD CONSTRAINT "Committee_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: CommitteeMember
ALTER TABLE "CommitteeMember" ADD CONSTRAINT "CommitteeMember_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommitteeMember" ADD CONSTRAINT "CommitteeMember_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CommitteeMember" ADD CONSTRAINT "CommitteeMember_committeeId_fkey" FOREIGN KEY ("committeeId") REFERENCES "Committee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: Form
ALTER TABLE "Form" ADD CONSTRAINT "Form_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: FormResponse
ALTER TABLE "FormResponse" ADD CONSTRAINT "FormResponse_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FormResponse" ADD CONSTRAINT "FormResponse_formId_fkey" FOREIGN KEY ("formId") REFERENCES "Form"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FormResponse" ADD CONSTRAINT "FormResponse_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
