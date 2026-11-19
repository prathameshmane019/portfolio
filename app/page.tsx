import { Portfolio } from "@/components/portfolio";
import { readPortfolioContent } from "@/lib/content-store";

export const dynamic = "force-dynamic";

export default async function Home() {
  const content = await readPortfolioContent();
  return <Portfolio content={content} />;
}
