export const Status = {
    _cases: ["Draft", "Published"],
    _methods: ["icon", "color"],
    Draft: 0,
    Published: 1,
    icon: {
        Draft: "pencil",
        Published: "check",
    },
    color: {
        Draft: "gray",
        Published: "green",
    },
    valueLabelPair: [
        { label: "Draft", value: 0 },
        { label: "Published", value: 1 },
    ],
    names: ["Draft", "Published"],
    values: [0, 1],
    options: { Draft: 0, Published: 1 },
} as const;

export type StatusType = 0 | 1;

export type StatusKind = "Draft" | "Published";

export const Visibility = {
    _cases: ["Public", "Private", "Protected", "Internal", "Draft"],
    _methods: ["isPublic", "description"],
    Public: "Public",
    Private: "Private",
    Protected: "Protected",
    Internal: "Internal",
    Draft: "Draft",
    isPublic: {
        Public: true,
        Private: false,
        Protected: false,
        Internal: false,
        Draft: false,
    },
    description: {
        Public: "Visible to everyone",
        Private: "Only visible to the owner",
        Protected: "Visible to team members",
        Internal: "Visible to organization members",
        Draft: "Not visible to anyone except the author",
    },
} as const;

export type VisibilityType =
    | "Public"
    | "Private"
    | "Protected"
    | "Internal"
    | "Draft";

export const Priority = {
    _cases: ["Low", "Medium", "High", "Critical"],
    _methods: ["label", "badgeColor", "icon"],
    Low: 0,
    Medium: 1,
    High: 2,
    Critical: 3,
    label: {
        Low: "Low Priority",
        Medium: "Medium Priority",
        High: "High Priority",
        Critical: "Critical Priority",
    },
    badgeColor: {
        Low: "bg-gray-100 text-gray-800",
        Medium: "bg-blue-100 text-blue-800",
        High: "bg-orange-100 text-orange-800",
        Critical: "bg-red-100 text-red-800",
    },
    icon: {
        Low: "arrow-down",
        Medium: "minus",
        High: "arrow-up",
        Critical: "exclamation-triangle",
    },
} as const;

export type PriorityType = 0 | 1 | 2 | 3;

export type PriorityKind = "Low" | "Medium" | "High" | "Critical";

export interface Post {
    id: number;
    title: string;
    content: string;
    user_id: number;
    status: StatusType;
    published_at: string | null;
    metadata: Record<string, { title: string; content: string }>;
    rating: number | null;
    category: string;
    options: Array<unknown> | null;
    deleted_at: string | null;
    created_at: string | null;
    updated_at: string | null;
    category_id: number | null;
    visibility: VisibilityType | null;
    priority: PriorityType | null;
    word_count: number | null;
    reading_time_minutes: number | null;
    featured_image_url: string | null;
    is_pinned: boolean;
}
