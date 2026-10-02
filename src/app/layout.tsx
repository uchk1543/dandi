import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { levelLabel } from "@/lib/constants";
import { getCurrentUser } from "@/lib/session";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dandi 프로토타입",
  description: "교사 중심 바이브코딩 & 미니앱 허브 (v0.2 프로토타입)",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();
  const who =
    user.role === "anon"
      ? "익명 방문자"
      : `${user.name}${user.schoolLevel ? ` (${levelLabel(user.schoolLevel)})` : ""} · ${
          user.role === "admin" ? "관리자" : "교사"
        }`;
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
          precedence="default"
        />
      </head>
      <body>
        <SiteHeader who={who} role={user.role} />
        <main className="site-main">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
