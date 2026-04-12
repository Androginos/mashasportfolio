import { PastelShaderBackground } from "@/components/PastelShaderBackground";
import { listSketchDrawingsFromPublic } from "@/lib/publicDrawings";
import PortfolioClient from "./portfolio-client";

export default async function Home() {
  const { brush, pencil } = await listSketchDrawingsFromPublic();
  return (
    <>
      <PastelShaderBackground />
      <PortfolioClient brushDrawings={brush} pencilDrawings={pencil} />
    </>
  );
}
