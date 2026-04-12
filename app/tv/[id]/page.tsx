import TvDisplay from "./TvDisplay";

export default async function TvPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TvDisplay code={id} />;
}
