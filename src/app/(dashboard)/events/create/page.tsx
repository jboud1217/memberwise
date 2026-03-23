"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { createEvent, type CreateEventInput } from "@/actions/events";
import {
  Calendar,
  MapPin,
  Video,
  DollarSign,
  Users,
  Ticket,
  ArrowLeft,
  Plus,
  X,
  Sparkles,
  Loader2,
} from "lucide-react";
import { aiEventDescription } from "@/actions/ai";

export default function CreateEventPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [format, setFormat] = useState<"IN_PERSON" | "VIRTUAL" | "HYBRID">("IN_PERSON");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("17:00");
  const [allDay, setAllDay] = useState(false);
  const [venueName, setVenueName] = useState("");
  const [address1, setAddress1] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [virtualUrl, setVirtualUrl] = useState("");
  const [capacity, setCapacity] = useState("");
  const [waitlistEnabled, setWaitlistEnabled] = useState(false);
  const [isFree, setIsFree] = useState(true);
  const [memberPrice, setMemberPrice] = useState("");
  const [nonMemberPrice, setNonMemberPrice] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [ticketTypes, setTicketTypes] = useState<
    { name: string; price: string; memberPrice: string; capacity: string }[]
  >([]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !startDate || !endDate) {
      setError("Title, start date, and end date are required.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const input: CreateEventInput = {
        title,
        description: description || undefined,
        format,
        startDate: allDay ? `${startDate}T00:00:00` : `${startDate}T${startTime}:00`,
        endDate: allDay ? `${endDate}T23:59:59` : `${endDate}T${endTime}:00`,
        allDay,
        venueName: venueName || undefined,
        address1: address1 || undefined,
        city: city || undefined,
        state: state || undefined,
        zip: zip || undefined,
        virtualUrl: virtualUrl || undefined,
        capacity: capacity ? parseInt(capacity) : undefined,
        waitlistEnabled,
        isFree,
        memberPrice: memberPrice ? Math.round(parseFloat(memberPrice) * 100) : undefined,
        nonMemberPrice: nonMemberPrice ? Math.round(parseFloat(nonMemberPrice) * 100) : undefined,
        contactName: contactName || undefined,
        contactEmail: contactEmail || undefined,
        ticketTypes:
          ticketTypes.length > 0
            ? ticketTypes.map((tt) => ({
                name: tt.name,
                price: Math.round(parseFloat(tt.price || "0") * 100),
                memberPrice: tt.memberPrice
                  ? Math.round(parseFloat(tt.memberPrice) * 100)
                  : undefined,
                capacity: tt.capacity ? parseInt(tt.capacity) : undefined,
              }))
            : undefined,
      };

      const event = await createEvent(input);
      router.push(`/events/${event.id}`);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  function addTicketType() {
    setTicketTypes([...ticketTypes, { name: "", price: "0", memberPrice: "", capacity: "" }]);
  }

  function removeTicketType(index: number) {
    setTicketTypes(ticketTypes.filter((_, i) => i !== index));
  }

  function updateTicketType(index: number, field: string, value: string) {
    const updated = [...ticketTypes];
    updated[index] = { ...updated[index], [field]: value };
    setTicketTypes(updated);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Create Event</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Set up a new event for your members
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5" />
              Event Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Event Title *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Annual Member Meeting"
              />
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between">
                <Label>Description</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={aiLoading || !title}
                  className="border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100 text-xs"
                  onClick={async () => {
                    if (!title) return;
                    setAiLoading(true);
                    try {
                      const result = await aiEventDescription({
                        title,
                        date: startDate || "TBD",
                        format: format === "IN_PERSON" ? "In Person" : format === "VIRTUAL" ? "Virtual" : "Hybrid",
                        notes: venueName ? `Venue: ${venueName}` : undefined,
                      });
                      setDescription(result.description);
                    } catch {
                      setError("AI generation failed. Check your API key.");
                    } finally {
                      setAiLoading(false);
                    }
                  }}
                >
                  {aiLoading ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Sparkles className="mr-1 h-3 w-3" />}
                  {aiLoading ? "Generating..." : "AI Generate"}
                </Button>
              </div>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this event is about..."
                rows={4}
              />
            </div>
            <div>
              <Label>Format</Label>
              <div className="mt-1 flex gap-2">
                {(["IN_PERSON", "VIRTUAL", "HYBRID"] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFormat(f)}
                    className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-colors ${
                      format === f
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-[var(--border)] hover:bg-[var(--muted)]"
                    }`}
                  >
                    {f === "IN_PERSON" && <MapPin className="h-4 w-4" />}
                    {f === "VIRTUAL" && <Video className="h-4 w-4" />}
                    {f === "HYBRID" && <Users className="h-4 w-4" />}
                    {f === "IN_PERSON" ? "In Person" : f === "VIRTUAL" ? "Virtual" : "Hybrid"}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Date & Time */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Date &amp; Time</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={allDay}
                onChange={(e) => setAllDay(e.target.checked)}
                className="rounded"
              />
              All-day event
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date *</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    if (!endDate) setEndDate(e.target.value);
                  }}
                />
              </div>
              {!allDay && (
                <div>
                  <Label>Start Time</Label>
                  <Input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
              )}
              <div>
                <Label>End Date *</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              {!allDay && (
                <div>
                  <Label>End Time</Label>
                  <Input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        {(format === "IN_PERSON" || format === "HYBRID") && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="h-5 w-5" />
                Venue
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Venue Name</Label>
                <Input
                  value={venueName}
                  onChange={(e) => setVenueName(e.target.value)}
                  placeholder="Convention Center"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Address</Label>
                  <Input
                    value={address1}
                    onChange={(e) => setAddress1(e.target.value)}
                    placeholder="123 Main St"
                  />
                </div>
                <div>
                  <Label>City</Label>
                  <Input value={city} onChange={(e) => setCity(e.target.value)} />
                </div>
                <div>
                  <Label>State</Label>
                  <Input value={state} onChange={(e) => setState(e.target.value)} />
                </div>
                <div>
                  <Label>ZIP</Label>
                  <Input value={zip} onChange={(e) => setZip(e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Virtual link */}
        {(format === "VIRTUAL" || format === "HYBRID") && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Video className="h-5 w-5" />
                Virtual Meeting
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label>Meeting URL</Label>
                <Input
                  value={virtualUrl}
                  onChange={(e) => setVirtualUrl(e.target.value)}
                  placeholder="https://zoom.us/j/..."
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Capacity & Registration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5" />
              Registration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Capacity (leave blank for unlimited)</Label>
                <Input
                  type="number"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  placeholder="100"
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={waitlistEnabled}
                onChange={(e) => setWaitlistEnabled(e.target.checked)}
                className="rounded"
              />
              Enable waitlist when capacity is reached
            </label>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <DollarSign className="h-5 w-5" />
              Pricing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsFree(true)}
                className={`rounded-lg border px-4 py-2 text-sm transition-colors ${
                  isFree
                    ? "border-green-500 bg-green-50 text-green-700"
                    : "border-[var(--border)] hover:bg-[var(--muted)]"
                }`}
              >
                Free Event
              </button>
              <button
                type="button"
                onClick={() => setIsFree(false)}
                className={`rounded-lg border px-4 py-2 text-sm transition-colors ${
                  !isFree
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-[var(--border)] hover:bg-[var(--muted)]"
                }`}
              >
                Paid Event
              </button>
            </div>

            {!isFree && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Non-Member Price ($)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={nonMemberPrice}
                      onChange={(e) => setNonMemberPrice(e.target.value)}
                      placeholder="50.00"
                    />
                  </div>
                  <div>
                    <Label>Member Price ($)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={memberPrice}
                      onChange={(e) => setMemberPrice(e.target.value)}
                      placeholder="25.00"
                    />
                  </div>
                </div>

                {/* Ticket Types */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-1">
                      <Ticket className="h-4 w-4" />
                      Ticket Types (optional)
                    </Label>
                    <Button type="button" variant="outline" size="sm" onClick={addTicketType}>
                      <Plus className="mr-1 h-3 w-3" />
                      Add Ticket Type
                    </Button>
                  </div>
                  {ticketTypes.map((tt, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 rounded-lg border border-[var(--border)] p-3"
                    >
                      <div className="grid flex-1 grid-cols-4 gap-2">
                        <Input
                          placeholder="Name (e.g. VIP)"
                          value={tt.name}
                          onChange={(e) => updateTicketType(i, "name", e.target.value)}
                        />
                        <Input
                          placeholder="Price"
                          type="number"
                          step="0.01"
                          value={tt.price}
                          onChange={(e) => updateTicketType(i, "price", e.target.value)}
                        />
                        <Input
                          placeholder="Member price"
                          type="number"
                          step="0.01"
                          value={tt.memberPrice}
                          onChange={(e) => updateTicketType(i, "memberPrice", e.target.value)}
                        />
                        <Input
                          placeholder="Capacity"
                          type="number"
                          value={tt.capacity}
                          onChange={(e) => updateTicketType(i, "capacity", e.target.value)}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeTicketType(i)}
                        className="mt-2 text-[var(--muted-foreground)] hover:text-red-500"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Event Contact</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Contact Name</Label>
                <Input
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Jane Smith"
                />
              </div>
              <div>
                <Label>Contact Email</Label>
                <Input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="jane@example.com"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error */}
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Submit */}
        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Event"}
          </Button>
        </div>
      </form>
    </div>
  );
}
