import { useState } from 'react';
export function Counter({
  initial = 0,
  onChange,
  buttonLabel = 'Increment',
}: {
  initial?: number;
  onChange?: (value: number) => void;
  buttonLabel?: string;
}) {
  const [count, setCount] = useState(initial);
  return (
    <section aria-label="Counter">
      <output aria-label="Count">{count}</output>
      <button
        onClick={() => {
          setCount(count + 1);
          onChange?.(count + 1);
        }}
      >
        {buttonLabel}
      </button>
    </section>
  );
}
