import { NextResponse } from "next/server";
import { readPortfolioContent } from "@/lib/content-store";

type GitHubRepository = {
  name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  fork: boolean;
};

type PinnedRepository = {
  name: string;
  description: string | null;
  url: string;
  primaryLanguage: { name: string } | null;
};

type ContributionCalendar = {
  totalContributions: number;
  weeks: { contributionDays: { contributionCount: number; date: string; color: string }[] }[];
};

type GraphQLResponse = {
  data?: {
    user?: {
      pinnedItems: { nodes: PinnedRepository[] };
      contributionsCollection: { contributionCalendar: ContributionCalendar };
    } | null;
  };
  errors?: { message: string }[];
};

export async function GET() {
  const { profile } = await readPortfolioContent();
  const userAgent = `${profile.name.replace(/[^A-Za-z0-9-]/g, "-")}-Portfolio`;
  let username = "";
  try {
    const githubUrl = new URL(profile.github);
    if (githubUrl.hostname !== "github.com") throw new Error("Profile GitHub URL must use github.com.");
    username = githubUrl.pathname.split("/").filter(Boolean)[0] || "";
  } catch (error) {
    console.error("Profile GitHub URL is invalid.", error);
    return NextResponse.json({ error: "Profile GitHub URL is invalid." }, { status: 500 });
  }
  if (!/^[A-Za-z0-9-]{1,39}$/.test(username)) {
    return NextResponse.json({ error: "Profile GitHub URL is invalid." }, { status: 500 });
  }

  const response = await fetch(
    `https://api.github.com/users/${encodeURIComponent(username)}/repos?sort=updated&per_page=12`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": userAgent,
      },
      next: { revalidate: 3600 },
    },
  );

  if (!response.ok) {
    console.error("GitHub repository request failed.", { status: response.status });
    return NextResponse.json(
      { error: "Public repositories are temporarily unavailable." },
      { status: 502 },
    );
  }

  const repositories = (await response.json()) as GitHubRepository[];
  const publicRepositories = repositories
    .filter((repository) => !repository.fork)
    .slice(0, 5)
    .map(({ name, description, html_url, language }) => ({
      name,
      description,
      html_url,
      language,
    }));
  let pinnedRepositories: PinnedRepository[] | null = null;
  let contributionCalendar: ContributionCalendar | null = null;
  let activityError = "Add GITHUB_TOKEN to enable contribution activity and pinned repositories.";

  if (process.env.GITHUB_TOKEN) {
    const now = new Date();
    const from = new Date(now);
    from.setUTCFullYear(from.getUTCFullYear() - 1);
    const query = `
      query($login: String!) {
        user(login: $login) {
          pinnedItems(first: 4, types: REPOSITORY) {
            nodes {
              ... on Repository {
                name
                description
                url
                primaryLanguage { name }
              }
            }
          }
          contributionsCollection(from: "${from.toISOString()}", to: "${now.toISOString()}") {
            contributionCalendar {
              totalContributions
              weeks {
                contributionDays { contributionCount date color }
              }
            }
          }
        }
      }
    `;

    try {
      const graphResponse = await fetch("https://api.github.com/graphql", {
        method: "POST",
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
          "Content-Type": "application/json",
          "User-Agent": userAgent,
        },
        body: JSON.stringify({ query, variables: { login: username } }),
        next: { revalidate: 3600 },
      });

      if (!graphResponse.ok) {
        console.error("GitHub activity request failed.", { status: graphResponse.status });
        activityError = "GitHub activity is temporarily unavailable.";
      } else {
        const result = (await graphResponse.json()) as GraphQLResponse;
        const user = result.data?.user;
        if (result.errors?.length || !user) {
          console.error("GitHub activity query returned errors.", result.errors);
          activityError = "GitHub activity is temporarily unavailable.";
        } else {
          pinnedRepositories = user.pinnedItems.nodes;
          contributionCalendar = user.contributionsCollection.contributionCalendar;
          activityError = "";
        }
      }
    } catch (error) {
      console.error("Unable to reach the GitHub activity API.", error);
      activityError = "GitHub activity is temporarily unavailable.";
    }
  }

  return NextResponse.json(
    { repositories: publicRepositories, pinnedRepositories, contributionCalendar, activityError },
    { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=1800" } },
  );
}
