interface ToastProps {
  message: string | null;
  visible: boolean;
}

export default function Toast({ message, visible }: ToastProps) {
  if (!message) return null;

  return (
    <div className={`toast${visible ? " visible" : ""}`} role="status" aria-live="polite">
      {message}
    </div>
  );
}
