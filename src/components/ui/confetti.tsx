import type { ReactNode } from "react";
import React, { createContext, forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";

import type {
  CreateTypes as CanvasConfettiCreateTypes,
  GlobalOptions as CanvasConfettiGlobalOptions,
  Options as CanvasConfettiOptions,
} from "canvas-confetti";
import confetti from "canvas-confetti";

export interface ConfettiRef {
  fire: (options?: CanvasConfettiOptions) => void;
}

interface ConfettiProps {
  options?: CanvasConfettiOptions & CanvasConfettiGlobalOptions & { canvas?: HTMLCanvasElement };
  globalOptions?: CanvasConfettiGlobalOptions;
  manualstart?: boolean;
  children?: ReactNode;
  className?: string;
}

const ConfettiContext = createContext<ConfettiRef | null>(null);

export const Confetti = forwardRef<ConfettiRef, ConfettiProps>((props, ref) => {
  const { options, globalOptions = { resize: true, useWorker: true }, manualstart = false, children, className, ...rest } = props;
  const instanceRef = useRef<CanvasConfettiCreateTypes | null>(null);
  const [isReady, setIsReady] = useState(false);

  const canvasRef = useCallback(
    (node: HTMLCanvasElement) => {
      if (node !== null) {
        if (instanceRef.current) return;
        instanceRef.current = confetti.create(node, {
          ...globalOptions,
          resize: true,
        });
        setIsReady(true);
      } else {
        if (instanceRef.current) {
          instanceRef.current.reset();
          instanceRef.current = null;
        }
        setIsReady(false);
      }
    },
    [globalOptions],
  );

  const fire = useCallback(
    (opts = {}) => {
      instanceRef.current?.({ ...options, ...opts });
    },
    [options],
  );

  const api = useMemo(() => ({ fire }), [fire]);

  useImperativeHandle(ref, () => api, [api]);

  useEffect(() => {
    if (!manualstart && isReady) {
      fire();
    }
  }, [manualstart, isReady, fire]);

  return (
    <ConfettiContext.Provider value={api}>
      <canvas 
        ref={canvasRef} 
        {...rest} 
        className={className || "pointer-events-none fixed inset-0 z-50 h-full w-full"} 
      />
      {children}
    </ConfettiContext.Provider>
  );
});

Confetti.displayName = "Confetti";

export default Confetti;

interface ConfettiButtonProps {
  options?: CanvasConfettiOptions &
    CanvasConfettiGlobalOptions & {
      canvas?: HTMLCanvasElement;
    };
  children?: ReactNode;
  globalOptions?: CanvasConfettiGlobalOptions;
}

export function ConfettiButton({ options, globalOptions, children, ...props }: ConfettiButtonProps & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const confettiRef = useRef<ConfettiRef>(null);

  return (
    <>
      <Confetti ref={confettiRef} options={options} globalOptions={globalOptions} manualstart />
      <button
        {...props}
        onClick={(e) => {
          confettiRef.current?.fire();
          props.onClick?.(e);
        }}
      >
        {children}
      </button>
    </>
  );
}

