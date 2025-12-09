import React, { InputHTMLAttributes } from "react";
import "./NumberInput.css";

interface NumberInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "onFocus"
> {
  value: number | string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  showButtons?: boolean;
  step?: string | number;
}

export function NumberInput({
  value,
  onChange,
  showButtons = false,
  step = 1,
  min,
  max,
  ...props
}: NumberInputProps) {
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  const handleIncrement = () => {
    const currentValue = parseFloat(value.toString()) || 0;
    const stepValue = parseFloat(step.toString());
    const newValue = currentValue + stepValue;

    if (max !== undefined && newValue > parseFloat(max.toString())) {
      return;
    }

    const fakeEvent = {
      target: { value: newValue.toString() },
    } as React.ChangeEvent<HTMLInputElement>;
    onChange(fakeEvent);
  };

  const handleDecrement = () => {
    const currentValue = parseFloat(value.toString()) || 0;
    const stepValue = parseFloat(step.toString());
    const newValue = currentValue - stepValue;

    if (min !== undefined && newValue < parseFloat(min.toString())) {
      return;
    }

    const fakeEvent = {
      target: { value: newValue.toString() },
    } as React.ChangeEvent<HTMLInputElement>;
    onChange(fakeEvent);
  };

  if (!showButtons) {
    return (
      <input
        type="number"
        value={value}
        onChange={onChange}
        onFocus={handleFocus}
        step={step}
        min={min}
        max={max}
        {...props}
      />
    );
  }

  return (
    <div className="number-input-container">
      <button
        type="button"
        onClick={handleDecrement}
        className="number-input-btn number-input-btn-minus"
      >
        −
      </button>
      <input
        type="number"
        value={value}
        onChange={onChange}
        onFocus={handleFocus}
        step={step}
        min={min}
        max={max}
        {...props}
      />
      <button
        type="button"
        onClick={handleIncrement}
        className="number-input-btn number-input-btn-plus"
      >
        +
      </button>
    </div>
  );
}
