import dynamic from "next/dynamic";

const ClientNav = dynamic(() => import("./ClientNav"), { ssr: false });

export function Nav(){
  // Render a lightweight server-safe placeholder; client will load ClientNav
  return <ClientNav />;
}
