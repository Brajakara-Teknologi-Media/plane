/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Mail, MessageCircle, MessageSquare } from "lucide-react";
import { EProductSubscriptionEnum } from "@plane/types";
// plane imports
import { cn } from "@plane/utils";

export type TPlanFeatureData = React.ReactNode | boolean | null;

// TODO: we should change this type and use TProductSubscriptionType instead. Need changes in common constants.
export type TPlanePlans = "free" | "one" | "pro" | "business" | "enterprise";

export type TPlanDetail = {
  id: EProductSubscriptionEnum;
  name: React.ReactNode;
  monthlyPrice?: number;
  yearlyPrice?: number;
  monthlyPriceSecondaryDescription?: React.ReactNode;
  yearlyPriceSecondaryDescription?: React.ReactNode;
  buttonCTA?: React.ReactNode;
  isActive: boolean;
};

type TPlanFeatureDetails = {
  title: React.ReactNode;
  description?: React.ReactNode;
  selfHostedDescription?: React.ReactNode;
  comingSoon?: boolean;
  selfHostedOnly?: boolean;
  cloud: Record<TPlanePlans, TPlanFeatureData>;
  "self-hosted"?: Record<TPlanePlans, TPlanFeatureData>;
};

type TPlansComparisonDetails = {
  id: string;
  title: React.ReactNode;
  comingSoon?: boolean;
  cloudOnly?: boolean;
  selfHostedOnly?: boolean;
  features: TPlanFeatureDetails[];
};

type PlanePlans = {
  planDetails: Record<TPlanePlans, TPlanDetail>;
  planHighlights: Record<TPlanePlans, string[]>;
  planComparison: TPlansComparisonDetails[];
};

function ForumIcon({ className }: { className?: string }) {
  return <MessageSquare className={cn(className, "size-5 text-secondary")} />;
}

export function ComingSoonBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "w-fit rounded-sm bg-accent-primary px-1.5 py-0.5 text-9 font-semibold whitespace-nowrap text-on-color",
        className
      )}
    >
      COMING SOON
    </span>
  );
}

export const PLANS_LIST: TPlanePlans[] = ["free", "one", "pro", "business", "enterprise"];

export const PLANS_COMPARISON_LIST: TPlansComparisonDetails[] = [
  {
    id: "project-work-tracking",
    title: "Project and Work Tracking",
    features: [
      {
        title: "Projects",
        description: "Add projects to house tickets, cycles, and modules.",
        cloud: {
          free: true,
          one: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Tickets",
        description: "Add work via tickets, define properties for tracking, and add them to\ncycles or modules.",
        cloud: {
          free: true,
          one: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Comments",
        description: "Respond to work items, @mention members, and brainstorm\ntogether without leaving Avião.",
        cloud: {
          free: true,
          one: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Cycles",
        description: "Track work in defined periods with different frequencies.",
        cloud: {
          free: true,
          one: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Modules",
        description: "Group replicable work into modules with their own\nassignees.",
        cloud: {
          free: true,
          one: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Requests",
        description:
          "See suggestions and feedback from viewers and\nguests before deciding to add them to your\nproject.",
        cloud: {
          free: true,
          one: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Estimates",
        description: "Measure effort in points in a system that works for\nyou.",
        cloud: {
          free: "Basic",
          one: "Basic",
          pro: "Advanced",
          business: "Advanced",
          enterprise: "Advanced",
        },
      },
    ],
  },
  {
    id: "project-work-management",
    title: "Project and Work Management",
    features: [
      {
        title: "Bulk operations",
        description: "Add multiple tickets to cycles or modules, transfer them, or edit their properties.",
        cloud: {
          free: false,
          one: "Limited properties",
          pro: "All properties",
          business: (
            <span className="flex flex-col items-end gap-1 lg:items-center">
              <ComingSoonBadge />
              Work item transfers and conversions
            </span>
          ),
          enterprise: (
            <span className="flex flex-col items-end gap-1 lg:items-center">
              <ComingSoonBadge />
              Work item transfers and conversions
            </span>
          ),
        },
      },
      {
        title: "Time tracking and hours",
        description: "Track time per ticket, see aggregated reports, and filter as needed.",
        cloud: {
          free: false,
          one: "Basic",
          pro: "Historical time records",
          business: "Historical time records\nand approvals",
          enterprise: "Historical time records\nand approvals",
        },
      },
      {
        title: "Active cycles",
        description: "See all ongoing cycles across all projects, or coming soon, in a single project.",
        cloud: {
          free: false,
          one: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Ticket types",
        description: "Create your own ticket types with their own properties.",
        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Custom properties",
        description: "Create your own properties and apply them to your workspace or project.",
        cloud: {
          free: false,
          one: false,
          pro: "Propriedades personalizadas\npor projeto",
          business: "Workspace properties\nand rollups",
          enterprise: "Workspace properties\nand rollups",
        },
      },
      {
        title: "Gantt dependencies",
        description: "Adjust dependent ticket schedules visually in our Gantt layout.",
        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Ticket transfers",
        description: "Move a ticket from one project or cycle to another.",
        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Auto-transfer cycle items",
        description: "Transfer incomplete tickets from a completed cycle to the next cycle or project default state.",
        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Epics",
        description: "Organize long-term work in epics that house tickets, cycles, and modules.",
        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Initiatives",
        description: "Create initiatives to group multiple epics.",
        comingSoon: true,
        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Milestones",
        description: "Add markers to Projects, Epics, and Initiatives to keep your team on track and report progress.",
        comingSoon: true,
        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Module overview",
        description: "Just like cycle overviews, see relevant details and progress charts for each module.",
        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Auto-assignment in modules",
        description:
          "Choose assignment rules for tickets in a module, including Round-robin and Capacity, Round-robin, or Capacity.",
        cloud: {
          free: false,
          one: false,
          pro: "Round-robin and Capacity",
          business: "Round-robin and Capacity",
          enterprise: "Round-robin and Capacity",
        },
      },
      // {
      //   title: "Visão geral do projeto",
      //   description: "Veja instantâneos em tempo real do seu projeto com\nmétricas essenciais.",
      //   comingSoon: true,
      //   cloud: {
      //     free: false,
      //     one: false,
      //     pro: true,
      //     business: true,
      //     enterprise: true,
      //   },
      // },
      {
        title: "Public, private, and secret projects",
        description:
          "Public projects are visible and accessible to everyone. Private are visible but require approval to join. Secret projects are neither visible nor accessible.",
        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Project state",
        description:
          "See all projects distributed by states that highlight those needing attention and those on track.",
        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      // {
      //   title: "Atualizações do projeto",
      //   description:
      //     "Mantenha as partes interessadas informadas com um espaço\ndedicado a atualizações visíveis para todos no projeto.",
      //   comingSoon: true,
      //   cloud: {
      //     free: false,
      //     one: false,
      //     pro: true,
      //     business: true,
      //     enterprise: true,
      //   },
      // },
      {
        title: "Predefined ticket templates",
        description:
          "Choose from available ticket templates that customize ticket types and properties for various use cases.",
        comingSoon: true,
        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Team cycles",
        description: "See multiple cycles across multiple projects at once.",
        cloud: {
          free: false,
          one: false,
          pro: false,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Project templates",
        description: "Save states, workflows, automations, and other project settings as templates.",
        cloud: {
          free: false,
          one: false,
          pro: false,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Baselines and deviations",
        description: "Set baselines for your projects progress and focus on deviations.",
        cloud: {
          free: false,
          one: false,
          pro: false,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Scheduled communications",
        description: "Schedule reports, notifications, and messages to third-party tools.",
        cloud: {
          free: false,
          one: false,
          pro: false,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Request assignees",
        description: "Assign approved requests to a member by default.",
        cloud: {
          free: false,
          one: false,
          pro: false,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Custom SLAs",
        description: "Define SLA matrices for time-sensitive tickets.",
        cloud: {
          free: false,
          one: false,
          pro: false,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Request forms",
        description: "Receive requests from externally accessible web forms.",
        cloud: {
          free: false,
          one: false,
          pro: false,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Emails for requests",
        description: "Get an email address to log requests directly into a project requests.",
        comingSoon: true,
        cloud: {
          free: false,
          one: false,
          pro: false,
          business: true,
          enterprise: true,
        },
      },
    ],
  },
  {
    id: "visualization",
    title: "Visualization",
    features: [
      {
        title: "Layouts",
        description: "Choose between List, Board, Calendar, Gantt, or Spreadsheet layouts for your tickets.",
        cloud: {
          free: true,
          one: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Views",
        description: "Save sort, filter, and display options of a layout in a view.",
        cloud: {
          free: true,
          one: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Shared views",
        description: "Choose some members to share a view.",
        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Publish views",
        description: "Publish a view on the internet and let your clients interact with it.",
        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Dashboards and widgets",
        description: "Create your own dashboards with custom widgets and data types.",
        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
    ],
  },
  {
    id: "analytics-reports",
    title: "Analytics and Reports",
    features: [
      {
        title: "Progress charts",
        description:
          "Track progress in cycles, modules, and overviews throughout Avião without switching to dashboards or Analytics.",
        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Cycle reports",
        description:
          "Get cycle reports on demand during and after a\ncycle. Revisit reports at any time via permanent links.",
        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Insights",
        description: "Retrospective, on-demand insights and forecasts.",
        comingSoon: true,
        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      // {
      //   title: "Cápsula do tempo",
      //   description: "Volte na linha do tempo do seu projeto e veja instantâneos de\nmomentos específicos.",
      //   comingSoon: true,
      //   cloud: {
      //     free: false,
      //     one: false,
      //     pro: false,
      //     business: true,
      //     enterprise: true,
      //   },
      // },
      {
        title: "Advanced page analytics",
        description: "See who is viewing, sharing, and commenting on your pages, plus other useful info.",
        comingSoon: true,
        cloud: {
          free: false,
          one: false,
          pro: false,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Custom reports",
        description: "Generate reports by any dimension and metric across your project or workspace.",
        comingSoon: true,
        cloud: {
          free: false,
          one: false,
          pro: false,
          business: true,
          enterprise: true,
        },
      },
    ],
  },
  {
    id: "navigation",
    title: "Navigation",
    features: [
      {
        title: "Power K",
        description: "Access a keyboard-first gateway to almost anything\nin Avião.",
        cloud: {
          free: true,
          one: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      // {
      //   title: "Pesquisa",
      //   description: "Pesquise por meio de consultas em linguagem natural, operadores ou\nPQL",
      //   cloud: {
      //     free: "Busca textual básica",
      //     one: "Busca textual básica",
      //     pro: (
      //       <span className="flex flex-col items-end lg:items-center gap-1">
      //         <span className="bg-[#3f76ff] text-on-color font-semibold text-9 p-0.5 w-fit whitespace-nowrap rounded-xs">
      //           COMING SOON
      //         </span>
      //         Operator capsules from text or PQL
      //       </span>
      //     ),
      //     business: (
      //       <span className="flex flex-col items-end lg:items-center gap-1">
      //         <span className="bg-[#3f76ff] text-on-color font-semibold text-9 p-0.5 w-fit whitespace-nowrap rounded-xs">
      //           COMING SOON
      //         </span>
      //         Operator capsules from text or PQL
      //       </span>
      //     ),
      //     enterprise: (
      //       <span className="flex flex-col items-end lg:items-center gap-1">
      //         <span className="bg-[#3f76ff] text-on-color font-semibold text-9 p-0.5 w-fit whitespace-nowrap rounded-xs">
      //           COMING SOON
      //         </span>
      //         Operator capsules from text or PQL
      //       </span>
      //     ),
      //   },
      // },
      {
        title: "PQL",
        description:
          "Write Avião Query Language in search with support\nfor Boolean operators. Soon, you can write natural\nlanguage queries.",
        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
    ],
  },
  {
    id: "workspace-user-management",
    title: "Workspace and User Management",
    features: [
      {
        title: "Member limit",
        description: "Number of seats that can use the project and work management features",
        selfHostedDescription:
          "Number of users supported by our default infrastructure. Expand infrastructure to have more users",
        cloud: {
          free: "12",
          one: "",
          pro: "Unlimited",
          business: "Unlimited",
          enterprise: "Unlimited",
        },
        "self-hosted": {
          free: "~50",
          one: "~50",
          pro: "~200",
          business: "~200",
          enterprise: "Unlimited",
        },
      },
      {
        title: "Roles",
        description: "Choose one of four predefined roles or create custom roles with RBAC.",
        cloud: {
          free: "Basic",
          one: "Basic",
          pro: "Predefined functions",
          business: "RBAC",
          enterprise: "GAC",
        },
      },
      {
        title: "Guests",
        description: "Allow some users to see everything or just their tickets in a project.",
        cloud: {
          free: false,
          one: "5 per paid member",
          pro: "5 per paid member",
          business: "5 per paid member",
          enterprise: "5 per paid member",
        },
      },
      {
        title: "Approvals",
        description: "Define workspace, project, and ticket type approvals for designated admins.",
        comingSoon: true,
        cloud: {
          free: false,
          one: false,
          pro: false,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Admin interface",
        description: "Get an admin overview to manage workspace and project settings.",
        cloud: {
          free: false,
          one: false,
          pro: false,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Workspace activity logs",
        description: "See filterable activity logs from your entire workspace.",
        cloud: {
          free: false,
          one: false,
          pro: false,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Audit logs via API",
        description: "See a full-workspace audit log and use APIs to flag Avião activity in compliance systems.",
        comingSoon: true,
        cloud: {
          free: false,
          one: false,
          pro: false,
          business: true,
          enterprise: true,
        },
      },
    ],
  },
  {
    id: "automations-workflows",
    title: "Automations and Workflows",
    features: [
      {
        title: "Trigger and action",
        description: "Choose a trigger and corresponding action per automation flow.",
        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Decision and loop automation",
        description: "Use actions as triggers indefinitely in an automation flow.",
        comingSoon: true,
        cloud: {
          free: false,
          one: false,
          pro: false,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Number of automations",
        description: "Total number of automation flows in your workspace",
        cloud: {
          free: false,
          one: false,
          pro: "5,000",
          business: "10,000",
          enterprise: "Unlimited",
        },
      },
    ],
  },
  {
    id: "knowledge-management",
    title: "Knowledge Management",
    features: [
      {
        title: "Pages",
        description: "Create knowledge bases for your teams that are accessible and shareable.",
        cloud: {
          free: true,
          one: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Real-time collaboration",
        description: "Edit a page together with members of your project, team, or workspace.",
        cloud: {
          free: false,
          one: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Embed tickets",
        description: "Embed tickets from any project you are a member of.",
        cloud: {
          free: false,
          one: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Link to tickets",
        description: "Link pages to tickets in a separate section in the ticket details.",
        cloud: {
          free: false,
          one: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Publish",
        description:
          "Publish your pages on the web for external users and let them comment without joining your workspace.",
        cloud: {
          free: false,
          one: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Wiki",
        description: "Create wikis or knowledge bases for the whole company without creating a project.",
        cloud: {
          free: false,
          one: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Exports",
        description: "Export page content to PDFs or Word-compatible documents.",
        cloud: {
          free: false,
          one: false,
          pro: "One download at a time",
          business: "Queued downloads",
          enterprise: "Queued downloads",
        },
      },
      {
        title: "Templates",
        description: "Use pages as templates for your project, team, or workspace.",
        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Versions",
        description: "See restorable versions of your page edits.",
        cloud: {
          free: false,
          one: false,
          pro: "2 days",
          business: "3 months",
          enterprise: "Unlimited",
        },
      },
      {
        title: "Databases and formulas",
        description:
          "Insert databases and formulas in a page without worrying about losing text, images, or other content types.",
        comingSoon: true,
        cloud: {
          free: false,
          one: false,
          pro: false,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Nested pages",
        description: "Pages inside a page; organize your pages as you see fit for progressive disclosure.",
        comingSoon: true,
        cloud: {
          free: false,
          one: false,
          pro: false,
          business: "Word and other format compatible downloads",
          enterprise: "Word and other format compatible downloads",
        },
      },
    ],
  },
  {
    id: "importers",
    title: "Importers",
    features: [
      {
        title: "Jira",
        description: "Import your tickets and members from Jira.",
        cloud: {
          free: "Without custom properties",
          one: "Without custom properties",
          pro: "With custom properties",
          business: "With custom properties",
          enterprise: "With custom properties",
        },
      },
      {
        title: "GitHub",
        description: "Import your tickets and members from GitHub.",
        cloud: {
          free: "Without custom properties",
          one: "Without custom properties",
          pro: "With custom properties",
          business: "With custom properties",
          enterprise: "With custom properties",
        },
      },
    ],
  },
  {
    id: "integrations",
    title: "Integrations",
    comingSoon: true,
    features: [
      {
        title: "GitHub",
        description:
          "Sync Avião work items and states to GitHub work items and\nstates. Update GitHub automatically with activity\nfrom Avião and vice-versa.",
        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Slack",
        description: "Get Avião activity in Slack and use / commands in\nSlack to make changes in Avião.",
        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Zapier",
        description: "Execute if-then-else automations using Zapier.",
        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Zendesk",
        description: "Create Avião work items from Zendesk tickets.",
        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Freshdesk",
        description: "Create Avião work items from Freshdesk tickets.",
        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
    ],
  },
  {
    id: "storage",
    title: "Storage",
    cloudOnly: true,
    features: [
      {
        title: "Space",
        description: "Total storage allowed per workspace",
        cloud: {
          free: "5GB",
          one: false,
          pro: "1 TB",
          business: "5 TB",
          enterprise: "Custom",
        },
      },
      {
        title: "Max file size",
        description: "Upload limit in your workspace",
        cloud: {
          free: "5 MB",
          one: false,
          pro: "100 MB",
          business: "200 MB",
          enterprise: "Custom",
        },
      },
    ],
  },
  {
    id: "security",
    title: "Security",
    features: [
      {
        title: "SAML",
        description: "Get the officially supported SAML implementation\nand make Avião secure with any IdP.",
        cloud: {
          free: false,
          one: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "OIDC",
        description: "Get the officially supported OIDC implementation\nand make Avião secure with any IdP.",
        selfHostedOnly: true,
        cloud: {
          free: false,
          one: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Domain security",
        description:
          "Choose other domains that can authenticate into your Avião workspace or restrict all but one domain.",
        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Two-factor authentication and passkeys",
        description: "Secure your Avião workspace with device-\ndependent two-factor authentication and passkeys. ",
        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Password policy",
        description: "Set custom password policies to match your compliance requirements.",
        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "LDAP",
        description: "Get our official LDAP implementation and secure your Avião workspace with your LDAP server.",
        comingSoon: true,
        cloud: {
          free: false,
          one: false,
          pro: false,
          business: false,
          enterprise: true,
        },
      },
    ],
  },
  {
    id: "self-hosted",
    title: "Self-hosted",
    selfHostedOnly: true,
    features: [
      {
        title: "God Mode",
        description: "Manage your self-hosted Avião instance better with an instance admin interface.",
        cloud: {
          free: true,
          one: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "One-click deployment",
        description: "Install and deploy your self-hosted Avião to any\nprivate cloud with a single-line command.",
        cloud: {
          free: false,
          one: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "App no Marketplace da Digital Ocean",
        description: "Get our Digital Ocean compatible app on their marketplace.",
        cloud: {
          free: false,
          one: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "App da Plataforma Heroku",
        description: "Get our Heroku Platform compatible app and deploy on Heroku easily.",
        cloud: {
          free: false,
          one: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "AWS AMI",
        description: "Get our AMI compatible app on the AWS marketplace.",
        cloud: {
          free: false,
          one: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Private deployments",
        description: "Get our Cloud app hosted on a private cloud managed by us.",
        comingSoon: true,
        cloud: {
          free: false,
          one: false,
          pro: false,
          business: false,
          enterprise: true,
        },
      },
    ],
  },
  {
    id: "support",
    title: "Suporte",
    features: [
      {
        title: "Canais",
        description: "Obtenha acesso a um ou mais canais de suporte\nconforme o seu plano.",
        cloud: {
          free: (
            <>
              <ForumIcon className="size-4" />
            </>
          ),
          one: (
            <div className="flex items-center gap-1">
              <Mail className="size-4 flex-shrink-0" />
              <ForumIcon className="size-4 flex-shrink-0" />
            </div>
          ),
          pro: (
            <div className="flex items-center gap-1">
              <Mail className="size-4 flex-shrink-0" />
              <ForumIcon className="size-4 flex-shrink-0" />
              <MessageCircle className="size-4 flex-shrink-0" />
            </div>
          ),
          business: "Full suite of\nprofessional services",
          enterprise: "Full suite of\nprofessional services",
        },
      },
      {
        title: "SLA",
        description: (
          <>
            Get business-friendly SLAs with higher plans. SLAs are by priority of work item and tiers{" "}
            <a href="https://plane.so/talk-to-sales" target="_blank" rel="noopener noreferrer" className="underline">
              can be requested
            </a>
            .
          </>
        ),
        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
    ],
  },
];

export const PLANE_PLANS: PlanePlans = {
  planDetails: {
    free: {
      id: EProductSubscriptionEnum.FREE,
      name: "Free",
      monthlyPrice: 0,
      yearlyPrice: 0,
      isActive: true,
    },
    one: {
      id: EProductSubscriptionEnum.ONE,
      name: "One",
      monthlyPrice: 799,
      yearlyPrice: 799,
      monthlyPriceSecondaryDescription: "por workspace",
      yearlyPriceSecondaryDescription: "por workspace",
      buttonCTA: "Upgrade",
      isActive: false,
    },
    pro: {
      id: EProductSubscriptionEnum.PRO,
      name: "Pro",
      monthlyPrice: 8,
      yearlyPrice: 6,
      monthlyPriceSecondaryDescription: "cobrado mensalmente",
      yearlyPriceSecondaryDescription: "cobrado anualmente",
      buttonCTA: "Upgrade",
      isActive: true,
    },
    business: {
      id: EProductSubscriptionEnum.BUSINESS,
      name: "Business",
      monthlyPriceSecondaryDescription: "cobrado mensalmente",
      yearlyPriceSecondaryDescription: "cobrado anualmente",
      buttonCTA: "Falar com vendas",
      isActive: false,
    },
    enterprise: {
      id: EProductSubscriptionEnum.ENTERPRISE,
      name: "Enterprise",
      monthlyPriceSecondaryDescription: "cobrado mensalmente",
      yearlyPriceSecondaryDescription: "cobrado anualmente",
      buttonCTA: "Falar com vendas",
      isActive: false,
    },
  },
  planHighlights: {
    free: ["Up to 12 users", "Pages", "Unlimited projects", "Unlimited cycles and modules"],
    one: ["Up to 50 users", "OIDC and SAML", "Active cycles", "Limited time tracking"],
    pro: ["Unlimited users", "Custom tickets and properties", "Ticket templates", "Full time tracking"],
    business: ["RBAC", "Project templates", "Baselines and deviations", "Custom reports"],
    enterprise: ["Private and managed deployments", "GAC", "LDAP support", "Databases and formulas"],
  },
  planComparison: PLANS_COMPARISON_LIST,
};
