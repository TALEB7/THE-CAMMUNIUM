export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8f6f0]">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
