export function Loading({ message = "Loading..." }: { message?: string }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "48px 24px",
      color: "var(--color-text-secondary)",
      fontFamily: "var(--font-sans)",
      fontSize: "0.875rem",
    }}>
      {message}
    </div>
  );
}
