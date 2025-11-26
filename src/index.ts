#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import sharp from "sharp";

import { EventLiteClient } from "./client.js";
import {
  tools,
  listEventsSchema,
  getEventSchema,
  createEventSchema,
  updateEventSchema,
  deleteEventSchema,
  listRegistrationsSchema,
  registerAttendeeSchema,
  unregisterAttendeeSchema,
  sendNotificationSchema,
  uploadImageSchema,
} from "./tools.js";

// Configuration from environment variables
const API_URL = process.env.EVENTLITE_API_URL || "http://localhost:3000";
const API_KEY = process.env.EVENTLITE_API_KEY;

if (!API_KEY) {
  console.error("Error: EVENTLITE_API_KEY environment variable is required");
  process.exit(1);
}

// Initialize client
const client = new EventLiteClient(API_URL, API_KEY);

// Image compression settings
const IMAGE_MAX_WIDTH = 400;
const IMAGE_MAX_HEIGHT = 300;
const IMAGE_QUALITY = 75;

/**
 * Compress an image from base64 to reduce context pollution
 * Resizes to 400x300 max and converts to JPEG with 75% quality
 */
async function compressBase64Image(base64Data: string): Promise<string> {
  // Remove data URL prefix if present
  const base64Clean = base64Data.replace(/^data:image\/\w+;base64,/, "");
  const inputBuffer = Buffer.from(base64Clean, "base64");

  const compressedBuffer = await sharp(inputBuffer)
    .resize(IMAGE_MAX_WIDTH, IMAGE_MAX_HEIGHT, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({ quality: IMAGE_QUALITY })
    .toBuffer();

  return compressedBuffer.toString("base64");
}

// Create MCP server
const server = new Server(
  {
    name: "eventlite-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      // ==================== EVENTS ====================

      case "list_events": {
        const input = listEventsSchema.parse(args);
        const result = await client.listEvents({
          status: input.status,
          search: input.search,
          city: input.city,
          upcoming: input.upcoming,
          limit: input.limit,
        });

        const events = result.data;
        if (events.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: "No events found.",
              },
            ],
          };
        }

        const summary = events
          .map((e) => {
            const date = new Date(e.startAt).toLocaleDateString("fr-FR", {
              weekday: "long",
              day: "numeric",
              month: "long",
              hour: "2-digit",
              minute: "2-digit",
            });
            const capacity = e.capacity
              ? `${e.confirmed_count || 0}/${e.capacity}`
              : `${e.confirmed_count || 0} inscrits`;
            const publicUrl = `${API_URL}/e/${e.slug}`;
            return `- **${e.title}** (${e.status})\n  📅 ${date}\n  👥 ${capacity}\n  🔗 ${publicUrl}`;
          })
          .join("\n\n");

        return {
          content: [
            {
              type: "text",
              text: `Found ${events.length} event(s):\n\n${summary}`,
            },
          ],
        };
      }

      case "get_event": {
        const input = getEventSchema.parse(args);
        const result = await client.getEvent(input.id);
        const e = result.data;

        const date = new Date(e.startAt).toLocaleDateString("fr-FR", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });

        const publicUrl = `${API_URL}/e/${e.slug}`;

        const details = [
          `# ${e.title}`,
          e.subtitle ? `*${e.subtitle}*` : "",
          "",
          `**Status:** ${e.status}`,
          `**Mode:** ${e.mode}`,
          `**Date:** ${date}`,
          e.location ? `**Location:** ${e.location}` : "",
          "",
          `**Registrations:** ${e.confirmed_count || 0} confirmed${e.capacity ? ` / ${e.capacity} capacity` : ""}`,
          e.waitlist_count ? `**Waitlist:** ${e.waitlist_count}` : "",
          "",
          `**Public URL:** ${publicUrl}`,
          `**Slug:** ${e.slug}`,
          `**ID:** ${e.id}`,
        ]
          .filter(Boolean)
          .join("\n");

        return {
          content: [
            {
              type: "text",
              text: details,
            },
          ],
        };
      }

      case "create_event": {
        const input = createEventSchema.parse(args);
        const result = await client.createEvent(input);
        const e = result.data;
        const publicUrl = `${API_URL}/e/${e.slug}`;

        return {
          content: [
            {
              type: "text",
              text: `✅ Event created successfully!\n\n**Title:** ${e.title}\n**URL:** ${publicUrl}\n**Status:** ${e.status}\n**ID:** ${e.id}\n\nTo publish it, use update_event with status: "PUBLISHED"`,
            },
          ],
        };
      }

      case "update_event": {
        const input = updateEventSchema.parse(args);
        const { id, ...updates } = input;
        const result = await client.updateEvent(id, updates);
        const e = result.data;

        return {
          content: [
            {
              type: "text",
              text: `✅ Event updated successfully!\n\n**Title:** ${e.title}\n**Status:** ${e.status}\n**Slug:** ${e.slug}`,
            },
          ],
        };
      }

      case "delete_event": {
        const input = deleteEventSchema.parse(args);
        await client.deleteEvent(input.id);

        return {
          content: [
            {
              type: "text",
              text: `✅ Event deleted successfully.`,
            },
          ],
        };
      }

      // ==================== REGISTRATIONS ====================

      case "list_registrations": {
        const input = listRegistrationsSchema.parse(args);
        const result = await client.listRegistrations(input.eventId, {
          status: input.status,
          limit: input.limit,
        });

        const regs = result.data;
        if (regs.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: "No registrations found.",
              },
            ],
          };
        }

        const summary = regs
          .map((r) => {
            const date = new Date(r.registered_at).toLocaleDateString("fr-FR");
            return `- **${r.name}** <${r.email}> [${r.status}] - ${date}`;
          })
          .join("\n");

        return {
          content: [
            {
              type: "text",
              text: `Found ${regs.length} registration(s):\n\n${summary}\n\n${result.pagination?.has_more ? `(More results available)` : ""}`,
            },
          ],
        };
      }

      case "register_attendee": {
        const input = registerAttendeeSchema.parse(args);
        const result = await client.createRegistration(input.eventId, {
          email: input.email,
          name: input.name,
          notes: input.notes,
        });
        const r = result.data;

        return {
          content: [
            {
              type: "text",
              text: `✅ Registration successful!\n\n**Name:** ${r.name}\n**Email:** ${r.email}\n**Status:** ${r.status}`,
            },
          ],
        };
      }

      case "unregister_attendee": {
        const input = unregisterAttendeeSchema.parse(args);
        const result = await client.deleteRegistration(input.eventId, input.email);

        let message = `✅ Registration cancelled for ${input.email}`;
        if (result.data.promoted) {
          message += `\n\n📤 ${result.data.promoted.name} <${result.data.promoted.email}> has been promoted from waitlist to confirmed.`;
        }

        return {
          content: [
            {
              type: "text",
              text: message,
            },
          ],
        };
      }

      // ==================== NOTIFICATIONS ====================

      case "send_notification": {
        const input = sendNotificationSchema.parse(args);
        const result = await client.sendNotification(
          input.eventId,
          {
            subject: input.subject,
            message: input.message,
            target: input.target,
            includeEventDetails: input.includeEventDetails,
          },
          input.preview
        );

        const data = result.data;

        if (input.preview) {
          return {
            content: [
              {
                type: "text",
                text: `📧 **Preview Mode** - No emails sent\n\n**Recipients:** ${data.total || (data as unknown as { recipients_count: number }).recipients_count} ${input.target || "all"}\n**Subject:** ${input.subject}\n**Message:**\n${input.message}`,
              },
            ],
          };
        }

        return {
          content: [
            {
              type: "text",
              text: `📧 Notification sent!\n\n**Sent:** ${data.sent}\n**Failed:** ${data.failed}\n**Target:** ${data.target}`,
            },
          ],
        };
      }

      // ==================== UPLOAD ====================

      case "upload_image": {
        const input = uploadImageSchema.parse(args);

        let result;
        if (input.base64) {
          // Compress image before upload to reduce file size
          const compressedBase64 = await compressBase64Image(input.base64);
          result = await client.uploadImageFromBase64(compressedBase64);
        } else if (input.url) {
          // For URLs, download, compress, then upload
          const response = await fetch(input.url);
          if (!response.ok) {
            throw new Error(`Failed to fetch image from URL: ${response.status}`);
          }
          const arrayBuffer = await response.arrayBuffer();
          const base64 = Buffer.from(arrayBuffer).toString("base64");
          const compressedBase64 = await compressBase64Image(base64);
          result = await client.uploadImageFromBase64(compressedBase64);
        } else {
          throw new Error("Either 'url' or 'base64' must be provided");
        }

        return {
          content: [
            {
              type: "text",
              text: `✅ Image uploaded successfully!\n\n**URL:** ${result.data.url}\n\nYou can now use this URL as the \`coverImage\` when creating or updating an event.`,
            },
          ],
        };
      }

      default:
        return {
          content: [
            {
              type: "text",
              text: `Unknown tool: ${name}`,
            },
          ],
          isError: true,
        };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return {
      content: [
        {
          type: "text",
          text: `❌ Error: ${message}`,
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("EventLite MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
