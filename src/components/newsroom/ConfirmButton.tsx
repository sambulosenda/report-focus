"use client";

/** A submit button that asks before doing something that can't be undone. */
export function ConfirmButton({ message, ...props }: { message: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} onClick={(e) => !confirm(message) && e.preventDefault()} />;
}
