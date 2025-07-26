import { Path } from "../types";

interface Parameters {
  routesWithPathAndMethod: Path[];
  apiVersion: string;
}

const generateSlugAndParameters = (route: Path, apiVersion: string) => {
  if (route.type === "jobs") {
    
    
    const openApiPath = route.path.replace(/:(\w+)/g, "{$1}");

    
    const paramMatches = route.path.match(/:(\w+)/g) || [];
    const parameters = paramMatches.map(param => ({
      in: "path" as const,
      name: param.substring(1), 
      required: true,
      type: "string",
    }));

    return {
      slug: `/${apiVersion}/jobs${openApiPath}`,
      parameters,
    };
  }

  return null;
};

export default ({ routesWithPathAndMethod, apiVersion }: Parameters) => {
  return routesWithPathAndMethod.reduce((acc: any, route) => {
    const slugAndParameters = generateSlugAndParameters(route, apiVersion);

    if (!slugAndParameters) {
      return acc;
    }

    const { parameters, slug } = slugAndParameters;

    acc[slug] = {
      ...acc[slug], 

      [route.method]: {
        operationId: `${route.method}-jobs${route.path.replace(/\
        parameters,
        security: [
          {
            api_key: [],
          },
        ],
        "x-google-quota": {
          metricCosts: {
            requests: 1,
          },
        },
        produces: ["application/json"],
        responses: {
          200: {
            description: "Successful response",
            schema: {
              type: "object",
            },
          },
          400: {
            description: "Bad request",
            schema: {
              type: "object",
            },
          },
          401: {
            description: "Unauthorized",
            schema: {
              type: "object",
            },
          },
          404: {
            description: "Not found",
            schema: {
              type: "object",
            },
          },
          500: {
            description: "Internal server error",
            schema: {
              type: "object",
            },
          },
        },
      },
      options: {
        operationId: "options-jobs" + route.path.replace(/\
        parameters,
        responses: {
          "204": {
            description: "No content",
          },
        },
      },
    };
    return acc;
  }, {});
};
