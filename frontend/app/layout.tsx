export const metadata = {
  title: "MedCare AI — AI-assisted health guidance",
  description:
    "MedCare AI provides evidence-informed health guidance through an adaptive symptom assessment, with emergency warning detection. Not a diagnostic service.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
