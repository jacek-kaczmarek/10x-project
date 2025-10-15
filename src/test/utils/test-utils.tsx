import { render } from "@testing-library/react";
import type { RenderOptions } from "@testing-library/react";
import type { ReactElement } from "react";

/**
 * Custom render function that wraps components with common providers
 * Extend this as needed with your app's context providers
 */
const customRender = (ui: ReactElement, options?: Omit<RenderOptions, "wrapper">) => {
  return render(ui, { ...options });
};

export * from "@testing-library/react";
export { customRender as render };
