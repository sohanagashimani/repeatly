export interface Path {
  path: string;
  method: string;
  type: "jobs";
}

export interface OpenApiParameter {
  in: "path" | "query" | "header";
  name: string;
  required: boolean;
  type: string;
}

export interface OpenApiPath {
  slug: string;
  parameters: OpenApiParameter[];
}
