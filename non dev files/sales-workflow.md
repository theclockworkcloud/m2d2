# HubSpot + SimPRO Sync — Sales Team Guide

This document explains how data flows between HubSpot and SimPRO, what happens automatically, and what the sales team needs to know.

---

## How It Works

HubSpot and SimPRO are connected in real time. When you create or update a record in one system, the change appears in the other within seconds. This sync runs automatically 24/7 — you don't need to do anything to trigger it.

**Direction of sync:**

| Data | SimPRO | | HubSpot |
|------|--------|-|---------|
| Companies / Customers | Creates or updates | <-> | Creates or updates |
| Contacts | Creates or updates | <-> | Creates or updates |
| Sites | Creates or updates | --> | Appears as child Company |
| Quotes | Creates or updates | --> | Appears as Quote + Deal |
| Deals | — | <-- | You can create Deals first (see below) |

---

## What Syncs Automatically

### Companies and Contacts
- When a **Customer** is created in SimPRO, a matching **Company** appears in HubSpot (and vice versa).
- When a **Contact** is created in SimPRO under a Customer, a matching **Contact** appears in HubSpot, linked to the correct Company.
- Updates flow both ways — change a phone number in either system and it updates in the other.

### Sites
- SimPRO **Sites** appear in HubSpot as **child Companies** under their parent Customer's Company record.
- Sites are one-way: SimPRO to HubSpot only.
- You can identify them by the naming pattern: `[Customer Name] Site Name` (e.g. `[Australia Post] Brisbane Depot`).

### Quotes
- SimPRO **Quotes** appear in HubSpot as **Quote** records.
- Each quote is linked to its Company and Contact.
- Quotes include **line items** (one per cost centre) showing the breakdown of work.
- Amounts are shown **excluding GST**.

### Deals
- Deals are **automatically created from quotes** (see Deal Workflow below).
- The Deal name, amount, and owner are all set automatically.
- You can also create Deals manually in HubSpot first — see "Deal-First Workflow" below.

---

## Deal Workflow

There are two ways Deals get created. Both work — use whichever fits the situation.

### Flow 1: Quote Creates the Deal (most common)

1. A quote is created in SimPRO (e.g. "Roof Replacement - Option A")
2. The sync automatically creates a **Deal** in HubSpot named "Roof Replacement"
3. The Quote is linked to the Deal
4. If more quotes are created for the same project (e.g. "Roof Replacement - Option B"), they're grouped under the **same Deal**
5. The Deal amount and stage update automatically:
   - If one quote is **accepted** (or converted to a job) — Deal = **Closed Won**, amount = that quote's total
   - If no quotes accepted yet — Deal stays open, amount = the highest option
   - If all quotes are **declined** — Deal = **Closed Lost**, amount = $0

### Flow 2: Create a Deal First in HubSpot

1. A sales rep creates a **Deal** manually in HubSpot (e.g. "Solar Install") and associates it with the correct Company
2. Later, when a SimPRO quote is created with a matching name (e.g. "Solar Install - Option A"), the sync finds the existing Deal and **links to it** instead of creating a duplicate
3. The Deal amount and owner update automatically from the quote

### Quote Naming Convention

For quotes to group correctly into Deals, use this naming pattern in SimPRO:

> **Project Name - Option A**
> **Project Name - Option B**
> **Project Name - Option C**

The part before " - Option" is the project name. All quotes sharing the same project name (for the same customer) will be grouped under one Deal.

If a quote has no " - Option" suffix, it becomes a standalone Deal.

### Deal Owner

The Deal owner in HubSpot is automatically set from the **Salesperson** assigned to the quote in SimPRO. If the salesperson changes on a quote, the Deal owner updates accordingly.

---

## Things to Avoid

These actions can cause sync issues. Please don't do them:

**Don't edit these HubSpot fields manually:**
- `SimPRO ID` — This is the link between the two systems. Changing it will break the sync for that record.
- `SimPRO Source Type` — This tells the system whether a Company is a Customer or a Site. Changing it causes incorrect behaviour.
- `SimPRO Quote Customer Stage` — This reflects the quote status from SimPRO and updates automatically.

**Don't delete synced records:**
- If you delete a Company, Contact, or Deal that was created by the sync, it may be recreated next time the SimPRO record updates. If you need a record removed, delete it from SimPRO first.

**Don't rename auto-created Deals:**
- Deals created from quotes are named after the SimPRO project. If you rename them, new quotes for the same project won't be able to find and link to the existing Deal, and a duplicate will be created.
- If you created a Deal manually (Deal-first workflow), the name must **exactly match** the SimPRO project name for the link to work.

**Don't create duplicate Companies:**
- The sync checks for existing Companies by name before creating new ones. If you manually create a Company that matches a SimPRO Customer, you may end up with duplicates. Let the sync handle Company creation.

---

## SimPRO Fields in HubSpot — Quick Reference

You'll see some extra fields on HubSpot records that come from SimPRO. These are **read-only** — they update automatically and shouldn't be edited manually.

| Field | Where | What It Means |
|-------|-------|---------------|
| SimPRO ID | Companies, Contacts, Deals, Quotes | The unique ID from SimPRO. Don't edit. |
| SimPRO Quote Numbers | Deals | Comma-separated list of SimPRO quote numbers. You can search for a quote number in HubSpot to find the Deal. |
| SimPRO Source Type | Companies | Whether this is a "customer" or "site". |
| SimPRO Source Type | Contacts | Whether this is a "contact" or "individual_customer". |
| Quote Customer Stage | Quotes | The quote status: New, Pending, Accepted, or Declined. |
| Quote Type | Quotes | Project, Service, or Prepaid. |
| ABN | Companies | Australian Business Number from SimPRO. |

---

## Questions?

If something doesn't look right — a record is missing, a Deal has the wrong amount, or associations look broken — contact the development team. Don't try to fix sync issues by manually editing SimPRO fields in HubSpot.
