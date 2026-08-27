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
  buttonStep?: number;
}

export function NumberInput({
  value,
  onChange,
  showButtons = false,
  step = 1,
  buttonStep,
  min,
  max,
  ...props
}: NumberInputProps) {
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  const getStepValue = () => {
    if (buttonStep !== undefined) {
      return buttonStep;
    }
    const parsed = typeof step === "number" ? step : parseFloat(step?.toString() || "");
    return isNaN(parsed) || parsed <= 0 ? 1 : parsed;
  };

  const roundToPrecision = (num: number, stepVal: number) => {
    const decimals = (stepVal.toString().split(".")[1] || "").length;
    const precision = Math.max(decimals, 4);
    return parseFloat(num.toFixed(precision));
  };

  const handleIncrement = () => {
    const currentValue = parseFloat(value?.toString() || "0") || 0;
    const stepValue = getStepValue();
    let newValue = roundToPrecision(currentValue + stepValue, stepValue);

    if (max !== undefined && newValue > parseFloat(max.toString())) {
      newValue = parseFloat(max.toString());
      if (newValue <= currentValue) return;
    }

    const fakeEvent = {
      target: { value: newValue.toString() },
    } as React.ChangeEvent<HTMLInputElement>;
    onChange(fakeEvent);
  };

  const handleDecrement = () => {
    const currentValue = parseFloat(value?.toString() || "0") || 0;
    const stepValue = getStepValue();
    let newValue = roundToPrecision(currentValue - stepValue, stepValue);

    if (min !== undefined && newValue < parseFloat(min.toString())) {
      newValue = parseFloat(min.toString());
      if (newValue >= currentValue) return;
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
