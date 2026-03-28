import { listSketchDrawingsFromPublic } from "@/lib/publicDrawings";
import PortfolioClient from "./portfolio-client";

export default async function Home() {
  const { brush, pencil } = await listSketchDrawingsFromPublic();
  return (
    <PortfolioClient brushDrawings={brush} pencilDrawings={pencil} />
  );
}
